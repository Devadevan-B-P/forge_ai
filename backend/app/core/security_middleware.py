import json
import time
from collections import defaultdict
from starlette.types import ASGIApp, Receive, Scope, Send, Message
from starlette.responses import JSONResponse

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

        path = scope.get("path", "")
        method = scope.get("method", "GET")

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

        # 2. SQL injection check in Query String
        query_string = scope.get("query_string", b"").decode("utf-8", errors="ignore")
        if self._is_malicious(query_string):
            response = JSONResponse(
                status_code=400,
                content={"detail": "Suspicious characters or commands detected."}
            )
            await response(scope, receive, send)
            return

        # 3. Request body inspection (SQL/NoSQL)
        if method in ("POST", "PUT", "PATCH"):
            try:
                # Read the full body chunks from ASGI receive stream
                body_bytes = b""
                more_body = True
                while more_body:
                    message = await receive()
                    body_bytes += message.get("body", b"")
                    more_body = message.get("more_body", False)

                body_str = body_bytes.decode("utf-8", errors="ignore")

                # SQL Injection check in request body
                if self._is_malicious(body_str):
                    response = JSONResponse(
                        status_code=400,
                        content={"detail": "Suspicious characters or SQL commands detected."}
                    )
                    await response(scope, receive, send)
                    return

                # NoSQL Injection check in JSON keys
                try:
                    headers = dict(scope.get("headers", []))
                    content_type = headers.get(b"content-type", b"").decode()
                    if "application/json" in content_type and body_bytes:
                        data = json.loads(body_str)
                        if self._has_nosql_operators(data):
                            response = JSONResponse(
                                status_code=400,
                                content={"detail": "Suspicious query operators detected."}
                            )
                            await response(scope, receive, send)
                            return
                except Exception:
                    pass

                # Recreate ASGI receive generator to feed the buffered request body back to the application
                body_received = False
                async def custom_receive() -> Message:
                    nonlocal body_received
                    if not body_received:
                        body_received = True
                        return {
                            "type": "http.request",
                            "body": body_bytes,
                            "more_body": False
                        }
                    return {"type": "http.disconnect"}

                await self.app(scope, custom_receive, send)
                return
            except Exception:
                pass

        await self.app(scope, receive, send)

    def _is_malicious(self, val: str) -> bool:
        if not val:
            return False
        val_lower = val.lower()
        # Common SQL injection patterns
        sql_patterns = [
            "union select",
            "union all select",
            "select * from",
            "insert into",
            "drop table",
            "delete from",
            "or 1=1",
            "or '1'='1",
            "' or 1=1",
            "admin' --",
            "admin'--",
            "admin' #",
            "admin'/*",
        ]
        for pattern in sql_patterns:
            if pattern in val_lower:
                return True
        return False

    def _has_nosql_operators(self, data) -> bool:
        """Recursively checks if any dictionary keys look like NoSQL operators (starting with $)"""
        if isinstance(data, dict):
            for k, v in data.items():
                if isinstance(k, str) and k.startswith("$") and k not in ("$oid", "$date"):
                    return True
                if self._has_nosql_operators(v):
                    return True
        elif isinstance(data, list):
            for item in data:
                if self._has_nosql_operators(item):
                    return True
        return False
