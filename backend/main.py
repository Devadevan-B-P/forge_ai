from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.routers import blueprint, generators

app = FastAPI(title="Forge AI", description="AI Software Project Architect API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin, "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(blueprint.router)
app.include_router(generators.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}
