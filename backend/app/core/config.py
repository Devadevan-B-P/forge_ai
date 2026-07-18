from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List


# ─── Model waterfall ─────────────────────────────────────────────────────────
# Tried in order; if a model hits a rate-limit the next one is used.
# Each tuple: (model_id, human_readable_name, max_output_tokens, tpm_limit)
# max_output_tokens is set conservatively below each model's TPM limit
# so the total request (input ~2k tokens + output) stays under the cap.
GROQ_MODEL_WATERFALL: List[tuple] = [
    ("qwen/qwen3-32b",          "Qwen3 32B",      3500,  6000),
    ("openai/gpt-oss-120b",     "GPT-OSS 120B",    6000,  8000),
    ("llama-3.3-70b-versatile", "Llama 3.3 70B", 10000, 12000),
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
    jwt_expire_minutes: int = 120  # 2 hours (hardened lifetime)

    # Redis
    redis_url: str = ""

    # EmailJS (backend security fallback)
    emailjs_service_id: str = ""
    emailjs_contact_template_id: str = ""
    emailjs_auto_reply_template_id: str = ""
    emailjs_public_key: str = ""
    emailjs_private_key: str = ""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
