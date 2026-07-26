from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import connect_db, close_db
from app.core.security_middleware import SecurityMiddleware
from app.routers import blueprint, generators, auth, history, contact


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_db()
    yield
    await close_db()


app = FastAPI(
    title="Forge AI",
    description="AI Software Project Architect API",
    lifespan=lifespan,
)


# Global Payload Size Limit Middleware (100KB limit for POST/PUT/PATCH)
@app.middleware("http")
async def limit_request_size(request: Request, call_next):
    if request.method in ("POST", "PUT", "PATCH"):
        content_length = request.headers.get("content-length")
        if content_length:
            try:
                if int(content_length) > 100 * 1024:  # 100 KB
                    return Response(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        content="Request Entity Too Large: Max size is 100KB."
                    )
            except ValueError:
                pass
    return await call_next(request)


# Global HTTP Security Headers Middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; "
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
        "font-src 'self' https://fonts.gstatic.com; "
        "img-src 'self' data:; "
        "connect-src 'self'"
    )
    return response


# Security middleware runs first (rate limiting + injection checks)
app.add_middleware(SecurityMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.frontend_origin,
        "http://localhost:5173",
        "http://localhost:5174",
        "https://localhost:5173",
        "https://localhost:5174",
        "http://localhost",
        "https://localhost",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(blueprint.router)
app.include_router(generators.router)
app.include_router(history.router)
app.include_router(contact.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}


from fastapi.staticfiles import StaticFiles
import os

frontend_dist = os.path.join(os.path.dirname(__file__), "static")

if os.path.exists(frontend_dist):
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="frontend")