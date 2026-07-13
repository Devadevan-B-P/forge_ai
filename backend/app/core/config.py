from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    gemini_api_key: str = ""
    gemini_model: str = "gemini-3.1-flash-lite"
    frontend_origin: str = "http://localhost:5173"

    # MongoDB
    mongodb_uri: str = "mongodb://localhost:27017"
    mongodb_db: str = "forge_ai"

    # JWT
    jwt_secret_key: str = "forge-ai-super-secret-key-change-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60 * 24 * 7  # 7 days

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
