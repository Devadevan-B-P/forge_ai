from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List


# ─── Model waterfall ─────────────────────────────────────────────────────────
# Tried in order; if a model hits a rate-limit the next one is used.
# Each tuple: (model_id, human_readable_name)
GROQ_MODEL_WATERFALL: List[tuple] = [
    ("qwen/qwen3-32b",          "Qwen3 32B"),
    ("openai/gpt-4o-mini",      "GPT-4o Mini"),
    ("llama-3.3-70b-versatile", "Llama 3.3 70B"),
]


class Settings(BaseSettings):
    groq_api_key: str = ""
    # Kept for the legacy /generate endpoint; streaming uses GROQ_MODEL_WATERFALL
    groq_model: str = GROQ_MODEL_WATERFALL[0][0]
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
