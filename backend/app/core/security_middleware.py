import time
from collections import defaultdict
from starlette.types import ASGIApp, Receive, Scope, Send
from starlette.responses import JSONResponse
from app.core.config import settings

class SecurityMiddleware:
    def __init__(self, app: ASGIApp):
        self.app = app
        # Store for rate limiting: ip -> list of timestamps
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

        # 1. Rate Limiting Check
        ip_limits = self.rate_limits[client_ip]
        # Filter request timestamps in the last 60 seconds
        ip_limits = [t for t in ip_limits if now - t < self.limit_period]
        self.rate_limits[client_ip] = ip_limits

        # Separate limits for authentication endpoints
        is_auth = path.startswith("/api/auth/")
        limit = self.auth_limit if is_auth else self.general_limit

        if len(ip_limits) >= limit:
            response = JSONResponse(
                status_code=429,
                content={"detail": "Too many requests. Please try again later."}
            )
            await response(scope, receive, send)
            return

        self.rate_limits[client_ip].append(now)

        await self.app(scope, receive, send)
