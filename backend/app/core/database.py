import urllib.parse
import certifi
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

_client: AsyncIOMotorClient | None = None


def get_client() -> AsyncIOMotorClient:
    if _client is None:
        raise RuntimeError("Database not connected. Call connect_db() first.")
    return _client


def get_db():
    return get_client()[settings.mongodb_db]


def clean_mongodb_uri(uri: str) -> str:
    if not uri.startswith("mongodb://") and not uri.startswith("mongodb+srv://"):
        return uri
    
    scheme, rest = uri.split("://", 1)
    parts = rest.split("/", 1)
    host_creds = parts[0]
    path_options = "/" + parts[1] if len(parts) > 1 else ""
    
    if "@" in host_creds:
        creds, host = host_creds.rsplit("@", 1)
        if ":" in creds:
            username, password = creds.split(":", 1)
            escaped_username = urllib.parse.quote_plus(urllib.parse.unquote(username))
            escaped_password = urllib.parse.quote_plus(urllib.parse.unquote(password))
            host_creds = f"{escaped_username}:{escaped_password}@{host}"
            
    return f"{scheme}://{host_creds}{path_options}"


async def connect_db():
    global _client
    
    # Enforce Atlas / Cloud only database
    if not settings.mongodb_uri:
        print("[WARN] MONGODB_URI is not set. Auth features will be unavailable.")
        _client = None
        return
        
    if "localhost" in settings.mongodb_uri or "127.0.0.1" in settings.mongodb_uri:
        raise RuntimeError("Local MongoDB connections are disabled. Please configure MongoDB Atlas in your .env.")

    cleaned_uri = clean_mongodb_uri(settings.mongodb_uri)

    try:
        _client = AsyncIOMotorClient(
            cleaned_uri,
            serverSelectionTimeoutMS=5000,
            tlsCAFile=certifi.where()
        )
        # Verify the connection is alive
        await _client.admin.command("ping")
        print("[OK] Connected to MongoDB Atlas")
        
        # Ensure collection indexes exist securely
        try:
            db = get_db()
            await db["history"].create_index([("user_id", 1), ("created_at", -1)])
            await db["users"].create_index("email", unique=True)
            # Create a TTL index that automatically deletes entries after the datetime stored in 'expires_at'
            await db["token_blacklist"].create_index("expires_at", expireAfterSeconds=0)
            print("[OK] MongoDB indexes verified/created")
        except Exception as idx_err:
            print(f"[WARN] Failed to create database indexes: {idx_err}. Server connection remains active.")
    except Exception as e:
        _client = None
        print(f"[WARN] MongoDB connection failed: {e}. Auth features will be unavailable.")


async def close_db():
    global _client
    if _client:
        _client.close()
        _client = None
