from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

_client: AsyncIOMotorClient | None = None


def get_client() -> AsyncIOMotorClient:
    if _client is None:
        raise RuntimeError("Database not connected. Call connect_db() first.")
    return _client


def get_db():
    return get_client()[settings.mongodb_db]


async def connect_db():
    global _client
    _client = AsyncIOMotorClient(settings.mongodb_uri, serverSelectionTimeoutMS=5000)
    # Verify the connection is alive
    try:
        await _client.admin.command("ping")
        print("✅ Connected to MongoDB:", settings.mongodb_uri)
    except Exception as e:
        print(f"⚠️  MongoDB connection failed: {e}. Auth features will be unavailable.")


async def close_db():
    global _client
    if _client:
        _client.close()
        _client = None
