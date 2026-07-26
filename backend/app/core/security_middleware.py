import time
import sqlite3
import tempfile
from pathlib import Path
from collections import defaultdict
from starlette.types import ASGIApp, Receive, Scope, Send
from starlette.responses import JSONResponse
from app.core.config import settings

# Optional Redis rate limiter for multi-worker container deployments
_redis_client = None
if settings.redis_url:
    try:
        import redis.asyncio as aioredis
        _redis_client = aioredis.from_url(settings.redis_url, decode_responses=True)
    except Exception as e:
        print(f"[WARN] Failed to initialize Redis rate-limiter: {e}. Falling back to in-memory.")

class SecurityMiddleware:
    def __init__(self, app: ASGIApp):
        self.app = app
        # Store for in-memory rate limiting: ip -> list of timestamps
        self.rate_limits = defaultdict(list)
        self.limit_period = 60
        self.auth_limit = 10
        self.general_limit = 60
        
        # SQLite path for multi-worker fallback
        self.db_path = Path(tempfile.gettempdir()) / "app_rate_limit.db"
        self._init_sqlite()

    async def __call__(self, scope: Scope, receive: Receive, send: Send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        if getattr(settings, "testing", False):
            await self.app(scope, receive, send)
            return

        path = scope.get("path", "")

        # Skip rate limiting for static assets
        STATIC_PREFIXES = (
            "/assets/",
            "/flower_frames/",
        )

        STATIC_EXTENSIONS = (
            ".png",
            ".jpg",
            ".jpeg",
            ".gif",
            ".webp",
            ".svg",
            ".ico",
            ".woff",
            ".woff2",
            ".ttf",
            ".css",
            ".js",
        )

        if path.startswith(STATIC_PREFIXES) or path.endswith(STATIC_EXTENSIONS):
            await self.app(scope, receive, send)
            return


        # Get client IP address
        client = scope.get("client")
        client_ip = client[0] if client else "unknown"
        now = time.time()

        # Separate limits for authentication endpoints
        is_auth = path.startswith("/api/auth/")
        limit = self.auth_limit if is_auth else self.general_limit

        import anyio
        
        # 1. Rate Limiting Check
        is_rate_limited = False

        if _redis_client:
            try:
                # Key format: ratelimit:{ip}:{auth/general}
                key = f"ratelimit:{client_ip}:{'auth' if is_auth else 'general'}"
                async with _redis_client.pipeline(transaction=True) as pipe:
                    pipe.incr(key)
                    pipe.expire(key, self.limit_period, nx=True)
                    results = await pipe.execute()
                current_requests = results[0]
                
                if current_requests > limit:
                    is_rate_limited = True
            except Exception as e:
                # Fallback to SQLite/in-memory on Redis error
                print(f"[WARN] Redis rate limiting failed, falling back to SQLite: {e}")
                is_rate_limited = await anyio.to_thread.run_sync(
                    self._check_sqlite, client_ip, 'auth' if is_auth else 'general', limit, now
                )
        else:
            is_rate_limited = await anyio.to_thread.run_sync(
                self._check_sqlite, client_ip, 'auth' if is_auth else 'general', limit, now
            )

        if is_rate_limited:
            response = JSONResponse(
                status_code=429,
                content={"detail": "Too many requests. Please try again later."}
            )
            await response(scope, receive, send)
            return

        await self.app(scope, receive, send)

    def _init_sqlite(self):
        try:
            conn = sqlite3.connect(self.db_path, timeout=5.0)
            try:
                conn.execute("PRAGMA journal_mode=WAL")
                conn.execute(
                    """
                    CREATE TABLE IF NOT EXISTS rate_limits (
                        ip TEXT,
                        endpoint_type TEXT,
                        timestamp REAL
                    )
                    """
                )
                conn.execute("CREATE INDEX IF NOT EXISTS idx_ip_type_time ON rate_limits (ip, endpoint_type, timestamp)")
                conn.commit()
            finally:
                conn.close()
        except Exception as e:
            print(f"[WARN] SQLite rate limit fallback initialization failed: {e}")

    def _check_sqlite(self, client_ip: str, endpoint_type: str, limit: int, now: float) -> bool:
        try:
            conn = sqlite3.connect(self.db_path, timeout=5.0)
            try:
                conn.execute("PRAGMA journal_mode=WAL")
                # Delete expired entries
                conn.execute(
                    "DELETE FROM rate_limits WHERE ? - timestamp > ?",
                    (now, self.limit_period)
                )
                # Count current requests
                cursor = conn.cursor()
                cursor.execute(
                    "SELECT COUNT(*) FROM rate_limits WHERE ip = ? AND endpoint_type = ? AND ? - timestamp < ?",
                    (client_ip, endpoint_type, now, self.limit_period)
                )
                count = cursor.fetchone()[0]
                
                if count >= limit:
                    conn.commit()
                    return True
                
                # Insert current request
                conn.execute(
                    "INSERT INTO rate_limits (ip, endpoint_type, timestamp) VALUES (?, ?, ?)",
                    (client_ip, endpoint_type, now)
                )
                conn.commit()
                return False
            finally:
                conn.close()
        except Exception as e:
            print(f"[WARN] SQLite rate-limiting check failed: {e}. Falling back to per-process in-memory.")
            return self._check_in_memory(client_ip, limit, now)

    def _check_in_memory(self, client_ip: str, limit: int, now: float) -> bool:
        ip_limits = self.rate_limits[client_ip]
        # Filter request timestamps in the last 60 seconds
        ip_limits = [t for t in ip_limits if now - t < self.limit_period]
        self.rate_limits[client_ip] = ip_limits

        if len(ip_limits) >= limit:
            return True

        self.rate_limits[client_ip].append(now)
        return False
