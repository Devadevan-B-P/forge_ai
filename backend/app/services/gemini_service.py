import json
import google.generativeai as genai

from app.core.config import settings
from app.prompts.system_prompt import BLUEPRINT_SYSTEM_PROMPT, build_user_prompt

_configured = False


def _ensure_configured():
    global _configured
    if not settings.gemini_api_key:
        raise RuntimeError(
            "GEMINI_API_KEY is not set. Copy backend/.env.example to backend/.env and add your key."
        )
    if not _configured:
        # transport="rest" avoids gRPC keepalive/handshake issues behind some
        # corporate proxies and firewalls, and gives us clean per-call timeouts.
        genai.configure(api_key=settings.gemini_api_key, transport="rest")
        _configured = True


REQUEST_TIMEOUT_SECONDS = 45


def generate_blueprint(idea: str, config: dict) -> dict:
    _ensure_configured()
    model = genai.GenerativeModel(
        model_name=settings.gemini_model,
        system_instruction=BLUEPRINT_SYSTEM_PROMPT,
    )
    response = model.generate_content(
        build_user_prompt(idea, config),
        generation_config={
            "response_mime_type": "application/json",
            "temperature": 0.4,
        },
        request_options={"timeout": REQUEST_TIMEOUT_SECONDS},
    )
    return json.loads(response.text)


def generate_sql(database: dict, dialect: str) -> str:
    _ensure_configured()
    model = genai.GenerativeModel(model_name=settings.gemini_model)
    prompt = f"""You are a senior database engineer. Given this database schema (JSON), write \
{dialect} CREATE TABLE statements including primary keys, foreign keys, and sensible indexes.
Return ONLY raw SQL, no markdown fences, no commentary.

Schema:
{json.dumps(database, indent=2)}
"""
    response = model.generate_content(
        prompt,
        generation_config={"temperature": 0.2},
        request_options={"timeout": REQUEST_TIMEOUT_SECONDS},
    )
    return _strip_code_fence(response.text)


def generate_endpoint_code(endpoint: dict, framework: str) -> str:
    _ensure_configured()
    model = genai.GenerativeModel(model_name=settings.gemini_model)
    prompt = f"""You are a senior backend engineer. Given this single API endpoint spec (JSON), \
write the {framework} route handler implementation for JUST this one endpoint. Include request/\
response Pydantic models if using FastAPI, basic validation, and a short docstring. Use \
placeholder/mock logic for the actual business logic (comment where a DB call would go) since \
you don't have the full app context.
Return ONLY raw code, no markdown fences, no commentary.

Endpoint spec:
{json.dumps(endpoint, indent=2)}
"""
    response = model.generate_content(
        prompt,
        generation_config={"temperature": 0.2},
        request_options={"timeout": REQUEST_TIMEOUT_SECONDS},
    )
    return _strip_code_fence(response.text)


def _strip_code_fence(text: str) -> str:
    t = text.strip()
    if t.startswith("```"):
        lines = t.split("\n")
        lines = lines[1:]
        if lines and lines[-1].strip().startswith("```"):
            lines = lines[:-1]
        t = "\n".join(lines)
    return t.strip()
