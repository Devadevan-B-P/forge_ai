import json
from groq import Groq

from app.core.config import settings
from app.prompts.system_prompt import BLUEPRINT_SYSTEM_PROMPT, build_user_prompt

_client = None


def _get_client():
    global _client
    if not settings.groq_api_key:
        raise RuntimeError(
            "GROQ_API_KEY is not set. Please add your key to backend/.env."
        )
    if _client is None:
        _client = Groq(api_key=settings.groq_api_key)
    return _client


REQUEST_TIMEOUT_SECONDS = 45


def generate_blueprint(idea: str, config: dict) -> dict:
    client = _get_client()
    messages = [
        {"role": "system", "content": BLUEPRINT_SYSTEM_PROMPT},
        {"role": "user", "content": build_user_prompt(idea, config)},
    ]
    response = client.chat.completions.create(
        model=settings.groq_model,
        messages=messages,
        temperature=0.4,
        response_format={"type": "json_object"},
        timeout=REQUEST_TIMEOUT_SECONDS,
    )
    return json.loads(response.choices[0].message.content)


def generate_sql(database: dict, dialect: str) -> str:
    client = _get_client()
    prompt = f"""You are a senior database engineer. Given this database schema (JSON), write \
{dialect} CREATE TABLE statements including primary keys, foreign keys, and sensible indexes.
Return ONLY raw SQL, no markdown fences, no commentary.

Schema:
{json.dumps(database, indent=2)}
"""
    response = client.chat.completions.create(
        model=settings.groq_model,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.2,
        timeout=REQUEST_TIMEOUT_SECONDS,
    )
    return _strip_code_fence(response.choices[0].message.content)


def generate_endpoint_code(endpoint: dict, framework: str) -> str:
    client = _get_client()
    prompt = f"""You are a senior backend engineer. Given this single API endpoint spec (JSON), \
write the {framework} route handler implementation for JUST this one endpoint. Include request/\
response Pydantic models if using FastAPI, basic validation, and a short docstring. Use \
placeholder/mock logic for the actual business logic (comment where a DB call would go) since \
you don't have the full app context.
Return ONLY raw code, no markdown fences, no commentary.

Endpoint spec:
{json.dumps(endpoint, indent=2)}
"""
    response = client.chat.completions.create(
        model=settings.groq_model,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.2,
        timeout=REQUEST_TIMEOUT_SECONDS,
    )
    return _strip_code_fence(response.choices[0].message.content)


def _strip_code_fence(text: str) -> str:
    t = text.strip()
    if t.startswith("```"):
        lines = t.split("\n")
        lines = lines[1:]
        if lines and lines[-1].strip().startswith("```"):
            lines = lines[:-1]
        t = "\n".join(lines)
    return t.strip()
