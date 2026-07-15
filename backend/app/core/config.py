from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    groq_api_key: str = ""
    groq_model: str = "qwen/qwen3-32b"
    frontend_origin: str = "http://localhost:5173"
    testing: bool = False

    # Contact form email
    contact_email_to: str = ""
    contact_email_from: str = ""
    contact_email_pass: str = ""  # Gmail App Password (not your regular password)

    # MongoDB
    mongodb_uri: str = ""
    mongodb_db: str = "forge_ai"

    # JWT
    jwt_secret_key: str
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60 * 24 * 7  # 7 days

    # Redis
    redis_url: str = ""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
