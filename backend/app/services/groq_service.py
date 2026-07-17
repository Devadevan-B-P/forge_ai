import json
import hashlib
from groq import AsyncGroq

from app.core.config import settings

_async_client = None
_redis_client = None

if settings.redis_url:
    try:
        import redis.asyncio as aioredis
        _redis_client = aioredis.from_url(settings.redis_url, decode_responses=True)
    except Exception as e:
        print(f"[WARN] Failed to initialize Redis cache in groq_service: {e}")


def _get_async_client() -> AsyncGroq:
    global _async_client
    if not settings.groq_api_key:
        raise RuntimeError(
            "GROQ_API_KEY is not set. Please add your key to backend/.env."
        )
    if _async_client is None:
        _async_client = AsyncGroq(api_key=settings.groq_api_key)
    return _async_client


def _compute_cache_key(prefix: str, payload: dict, modifier: str) -> str:
    serialized = json.dumps(payload, sort_keys=True)
    hasher = hashlib.sha256()
    hasher.update(serialized.encode("utf-8"))
    hasher.update(modifier.encode("utf-8"))
    return f"cache:{prefix}:{hasher.hexdigest()}"


REQUEST_TIMEOUT_SECONDS = 60


async def generate_sql(database: dict, dialect: str) -> str:
    cache_key = None
    if _redis_client:
        try:
            cache_key = _compute_cache_key("sql", database, dialect)
            cached_value = await _redis_client.get(cache_key)
            if cached_value:
                print(f"[INFO] SQL generation Cache HIT for key: {cache_key}")
                return cached_value
        except Exception as e:
            print(f"[WARN] Redis cache lookup failed: {e}")

    client = _get_async_client()
    prompt = f"""You are a senior database engineer. Given this database schema (JSON), write \
{dialect} CREATE TABLE statements including primary keys, foreign keys, and sensible indexes.
Return ONLY raw SQL, no markdown fences, no commentary.

Schema:
{json.dumps(database, indent=2)}
"""
    response = await client.chat.completions.create(
        model=settings.groq_model,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.2,
        max_tokens=4096,
        timeout=REQUEST_TIMEOUT_SECONDS,
    )
    result = _strip_code_fence(response.choices[0].message.content)

    if _redis_client and cache_key and result:
        try:
            # Store generated SQL with a 24-hour expiration (86400 seconds)
            await _redis_client.set(cache_key, result, ex=86400)
            print(f"[INFO] SQL generation cached in Redis: {cache_key}")
        except Exception as e:
            print(f"[WARN] Redis cache storage failed: {e}")

    return result


async def generate_endpoint_code(endpoint: dict, framework: str) -> str:
    cache_key = None
    if _redis_client:
        try:
            cache_key = _compute_cache_key("endpoint", endpoint, framework)
            cached_value = await _redis_client.get(cache_key)
            if cached_value:
                print(f"[INFO] Endpoint generation Cache HIT for key: {cache_key}")
                return cached_value
        except Exception as e:
            print(f"[WARN] Redis cache lookup failed: {e}")

    client = _get_async_client()
    prompt = f"""You are a senior backend engineer. Given this single API endpoint spec (JSON), \
write the {framework} route handler implementation for JUST this one endpoint. Include request/\
response Pydantic models if using FastAPI, basic validation, and a short docstring. Use \
placeholder/mock logic for the actual business logic (comment where a DB call would go) since \
you don't have the full app context.
Return ONLY raw code, no markdown fences, no commentary.

Endpoint spec:
{json.dumps(endpoint, indent=2)}
"""
    response = await client.chat.completions.create(
        model=settings.groq_model,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.2,
        max_tokens=4096,
        timeout=REQUEST_TIMEOUT_SECONDS,
    )
    result = _strip_code_fence(response.choices[0].message.content)

    if _redis_client and cache_key and result:
        try:
            # Store generated endpoint code with a 24-hour expiration (86400 seconds)
            await _redis_client.set(cache_key, result, ex=86400)
            print(f"[INFO] Endpoint generation cached in Redis: {cache_key}")
        except Exception as e:
            print(f"[WARN] Redis cache storage failed: {e}")

    return result


def _strip_code_fence(text: str) -> str:
    t = text.strip()
    if "<think>" in t:
        parts = t.split("</think>", 1)
        if len(parts) > 1:
            t = parts[1].strip()
        else:
            t = t.replace("<think>", "").strip()
    if t.startswith("```"):
        lines = t.split("\n")
        lines = lines[1:]
        if lines and lines[-1].strip().startswith("```"):
            lines = lines[:-1]
        t = "\n".join(lines)
    return t.strip()
