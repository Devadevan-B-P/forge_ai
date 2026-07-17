from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import connect_db, close_db
from app.core.security_middleware import SecurityMiddleware
from app.routers import blueprint, generators, auth, history


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


@app.get("/api/health")
def health():
    return {"status": "ok"}
