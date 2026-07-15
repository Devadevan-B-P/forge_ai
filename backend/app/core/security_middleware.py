import time
from collections import defaultdict
from starlette.types import ASGIApp, Receive, Scope, Send
from starlette.responses import JSONResponse
from app.core.config import settings

# Optional Redis rate limiter for multi-worker container deployments
_redis_client = None
if settings.redis_url:
    try:
        import redis
        _redis_client = redis.from_url(settings.redis_url, decode_responses=True)
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

    async def __call__(self, scope: Scope, receive: Receive, send: Send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        if getattr(settings, "testing", False):
            await self.app(scope, receive, send)
            return

        path = scope.get("path", "")

        # Get client IP address
        client = scope.get("client")
        client_ip = client[0] if client else "unknown"
        now = time.time()

        # Separate limits for authentication endpoints
        is_auth = path.startswith("/api/auth/")
        limit = self.auth_limit if is_auth else self.general_limit

        # 1. Rate Limiting Check
        is_rate_limited = False

        if _redis_client:
            try:
                # Key format: ratelimit:{ip}:{auth/general}
                key = f"ratelimit:{client_ip}:{'auth' if is_auth else 'general'}"
                pipe = _redis_client.pipeline()
                pipe.incr(key)
                pipe.expire(key, self.limit_period, nx=True)
                results = pipe.execute()
                current_requests = results[0]
                
                if current_requests > limit:
                    is_rate_limited = True
            except Exception as e:
                # Fallback to in-memory on Redis error
                print(f"[WARN] Redis rate limiting failed, falling back to in-memory: {e}")
                is_rate_limited = self._check_in_memory(client_ip, limit, now)
        else:
            is_rate_limited = self._check_in_memory(client_ip, limit, now)

        if is_rate_limited:
            response = JSONResponse(
                status_code=429,
                content={"detail": "Too many requests. Please try again later."}
            )
            await response(scope, receive, send)
            return

        await self.app(scope, receive, send)

    def _check_in_memory(self, client_ip: str, limit: int, now: float) -> bool:
        ip_limits = self.rate_limits[client_ip]
        # Filter request timestamps in the last 60 seconds
        ip_limits = [t for t in ip_limits if now - t < self.limit_period]
        self.rate_limits[client_ip] = ip_limits

        if len(ip_limits) >= limit:
            return True

        self.rate_limits[client_ip].append(now)
        return False
