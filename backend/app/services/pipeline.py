import json
import time
import groq as groq_sdk
from groq import AsyncGroq
from typing import AsyncGenerator

from app.core.config import settings, GROQ_MODEL_WATERFALL
from app.prompts.system_prompt import BLUEPRINT_SYSTEM_PROMPT, build_user_prompt

_async_client: AsyncGroq | None = None
_redis_client = None

if settings.redis_url:
    try:
        import redis.asyncio as aioredis
        _redis_client = aioredis.from_url(settings.redis_url, decode_responses=True)
    except Exception as e:
        print(f"[WARN] Failed to initialize Redis token tracker in pipeline: {e}")


# ─── Rate Limiting / Token Waterfall Tracking State ──────────────────────────
# In-memory rate limiting state fallback (blocked until timestamp)
_in_memory_blocked_until: dict[str, float] = {}


def _is_in_memory_blocked(model_id: str) -> bool:
    blocked_until = _in_memory_blocked_until.get(model_id, 0)
    return time.time() < blocked_until


def _mark_in_memory_blocked(model_id: str, duration: float = 30.0):
    _in_memory_blocked_until[model_id] = time.time() + duration


async def _get_model_token_usage(model_id: str) -> int:
    """Get estimated token usage in the last 60 seconds from Redis."""
    if _redis_client is None:
        return 0
    try:
        val = await _redis_client.get(f"tpm_tracker:{model_id}")
        return int(val) if val else 0
    except Exception:
        return 0


async def _incr_model_token_usage(model_id: str, tokens: int):
    """Increment token usage in Redis with a 60s TTL."""
    if _redis_client is None:
        return
    try:
        key = f"tpm_tracker:{model_id}"
        async with _redis_client.pipeline(transaction=True) as pipe:
            pipe.incrby(key, tokens)
            pipe.expire(key, 60, nx=True)
            await pipe.execute()
    except Exception:
        pass


async def _mark_model_rate_limited(model_id: str, tpm_limit: int):
    """Mark model as fully rate limited/exhausted for the next 30 seconds."""
    if _redis_client is None:
        return
    try:
        key = f"tpm_tracker:{model_id}"
        await _redis_client.set(key, tpm_limit, ex=30)
    except Exception:
        pass


def _get_async_client() -> AsyncGroq:
    global _async_client
    if not settings.groq_api_key:
        raise RuntimeError("GROQ_API_KEY is not set. Please add your key to backend/.env.")
    if _async_client is None:
        _async_client = AsyncGroq(api_key=settings.groq_api_key)
    return _async_client


# ─── Models that support response_format={"type":"json_object"} ──────────────
# Models NOT in this set use plain-text mode; the system prompt instructs them
# to return raw JSON so parsing still works without the API-level enforcement.
JSON_MODE_SUPPORTED = {
    "qwen/qwen3.6-27b",
    "llama-3.3-70b-versatile",
}


def _should_try_next_model(exc: Exception) -> bool:
    """Return True for any error that means we should skip to the next model.

    Covers:
    - HTTP 429 rate limits (groq_sdk.RateLimitError)
    - HTTP 413 "Request too large" (prompt + output exceeds model TPM window)
    - JSON-mode not supported / failed_generation errors
    """
    if isinstance(exc, groq_sdk.RateLimitError):
        return True
    if isinstance(exc, groq_sdk.APIStatusError) and exc.status_code in (413, 429):
        return True
    msg = str(exc).lower()
    return (
        "rate limit" in msg
        or "429" in msg
        or "413" in msg
        or "too many requests" in msg
        or "request too large" in msg
        or "tokens per minute" in msg
        or "tpm" in msg
        or "quota" in msg
        or "reduce your message size" in msg
        or "failed_generation" in msg
        or "failed to generate json" in msg
        or "adjust your prompt" in msg
        or "json_validate_failed" in msg
    )


async def _call_model_async(
    prompt: str, system_role: str, model_id: str, max_tokens: int = 3500
) -> dict:
    """Single non-streaming call to a specific Groq model."""
    client = _get_async_client()
    messages = [
        {"role": "system", "content": system_role},
        {"role": "user", "content": prompt},
    ]
    kwargs: dict = dict(
        model=model_id,
        messages=messages,
        temperature=0.1,
        max_tokens=max_tokens,
        timeout=60,
    )
    if model_id in JSON_MODE_SUPPORTED:
        kwargs["response_format"] = {"type": "json_object"}

    response = await client.chat.completions.create(**kwargs)
    return json.loads(response.choices[0].message.content.strip())


async def run_generator_pipeline(idea: str, config: dict) -> dict:
    """Non-streaming pipeline that tries models in waterfall order."""
    prompt = build_user_prompt(idea, config)
    estimated_input_tokens = (len(prompt) + len(BLUEPRINT_SYSTEM_PROMPT)) // 4
    last_exc: Exception | None = None

    for model_id, model_name, max_tokens, tpm_limit in GROQ_MODEL_WATERFALL:
        # Check if the input size itself exceeds the total model TPM capacity
        if estimated_input_tokens >= tpm_limit:
            print(f"[INFO] Proactively skipping {model_name} (input size {estimated_input_tokens} >= limit {tpm_limit})")
            continue

        # Dynamic max_tokens capping logic with safety buffer
        safety_buffer = 500
        safe_tpm_limit = tpm_limit - safety_buffer
        min_usable_output = 2000
        active_max_tokens = max_tokens
        if estimated_input_tokens + max_tokens > safe_tpm_limit:
            remaining_budget = safe_tpm_limit - estimated_input_tokens
            if remaining_budget < min_usable_output:
                print(f"[INFO] Proactively skipping {model_name} (remaining output budget {remaining_budget} is below minimum {min_usable_output})")
                continue
            active_max_tokens = remaining_budget
            print(f"[INFO] Dynamically capping max_tokens for {model_name} from {max_tokens} to {active_max_tokens} to fit inside safe {safe_tpm_limit} TPM limit")

        estimated_total_tokens = estimated_input_tokens + active_max_tokens

        # 2. In-memory local cooldown check
        if _is_in_memory_blocked(model_id):
            print(f"[INFO] Proactively skipping {model_name} (in-memory block from recent rate limit)")
            continue

        # 3. Redis concurrent usage check
        current_usage = await _get_model_token_usage(model_id)
        if current_usage + estimated_total_tokens > tpm_limit:
            print(f"[INFO] Proactively skipping {model_name} (Redis tracker usage {current_usage} + estimated {estimated_total_tokens} > limit {tpm_limit})")
            continue

        try:
            print(f"[INFO] Trying model: {model_name} ({model_id}, max_tokens={active_max_tokens})")
            result = await _call_model_async(prompt, BLUEPRINT_SYSTEM_PROMPT, model_id, active_max_tokens)
            # Success — log token usage to Redis
            await _incr_model_token_usage(model_id, estimated_total_tokens)
            return result
        except Exception as exc:
            if _should_try_next_model(exc):
                print(f"[WARN] {model_name} unavailable ({exc}), falling back to next model.")
                _mark_in_memory_blocked(model_id)
                await _mark_model_rate_limited(model_id, tpm_limit)
                last_exc = exc
                continue
            raise
    raise last_exc or RuntimeError("All models exhausted.")


async def run_generator_pipeline_stream(
    idea: str, config: dict
) -> AsyncGenerator[tuple[str, str], None]:
    """Streaming pipeline with 3-model waterfall.

    Yields (event_type, payload) tuples:
      - ("model", model_name)     — model selected / switched
      - ("chunk", text_fragment)  — streamed token chunk

    Falls over to the next model on rate-limit, token-capacity, or
    JSON-mode-not-supported errors, emitting a fresh "model" event each time.
    """
    prompt = build_user_prompt(idea, config)
    estimated_input_tokens = (len(prompt) + len(BLUEPRINT_SYSTEM_PROMPT)) // 4
    client = _get_async_client()
    messages = [
        {"role": "system", "content": BLUEPRINT_SYSTEM_PROMPT},
        {"role": "user", "content": prompt},
    ]

    last_exc: Exception | None = None
    for model_id, model_name, max_tokens, tpm_limit in GROQ_MODEL_WATERFALL:
        # Check if the input size itself exceeds the total model TPM capacity
        if estimated_input_tokens >= tpm_limit:
            print(f"[INFO] Proactively skipping {model_name} (input size {estimated_input_tokens} >= limit {tpm_limit})")
            continue

        # Dynamic max_tokens capping logic with safety buffer
        safety_buffer = 500
        safe_tpm_limit = tpm_limit - safety_buffer
        min_usable_output = 2000
        active_max_tokens = max_tokens
        if estimated_input_tokens + max_tokens > safe_tpm_limit:
            remaining_budget = safe_tpm_limit - estimated_input_tokens
            if remaining_budget < min_usable_output:
                print(f"[INFO] Proactively skipping {model_name} (remaining output budget {remaining_budget} is below minimum {min_usable_output})")
                continue
            active_max_tokens = remaining_budget
            print(f"[INFO] Dynamically capping max_tokens for {model_name} from {max_tokens} to {active_max_tokens} to fit inside safe {safe_tpm_limit} TPM limit")

        estimated_total_tokens = estimated_input_tokens + active_max_tokens

        # 2. In-memory local cooldown check
        if _is_in_memory_blocked(model_id):
            print(f"[INFO] Proactively skipping {model_name} (in-memory block from recent rate limit)")
            continue

        # 3. Redis concurrent usage check
        current_usage = await _get_model_token_usage(model_id)
        if current_usage + estimated_total_tokens > tpm_limit:
            print(f"[INFO] Proactively skipping {model_name} (Redis tracker usage {current_usage} + estimated {estimated_total_tokens} > limit {tpm_limit})")
            continue

        try:
            print(f"[INFO] Streaming with model: {model_name} ({model_id}, max_tokens={active_max_tokens})")
            yield ("model", model_name)

            kwargs: dict = dict(
                model=model_id,
                messages=messages,
                temperature=0.1,
                max_tokens=active_max_tokens,
                timeout=120,
                stream=True,
            )
            if model_id in JSON_MODE_SUPPORTED:
                kwargs["response_format"] = {"type": "json_object"}

            response_stream = await client.chat.completions.create(**kwargs)
            async for chunk in response_stream:
                content = chunk.choices[0].delta.content or ""
                if content:
                    yield ("chunk", content)
            
            # Stream completed successfully — log token usage and stop waterfall
            await _incr_model_token_usage(model_id, estimated_total_tokens)
            return
        except Exception as exc:
            if _should_try_next_model(exc):
                print(f"[WARN] {model_name} unavailable ({exc}), falling back to next model.")
                _mark_in_memory_blocked(model_id)
                await _mark_model_rate_limited(model_id, tpm_limit)
                last_exc = exc
                continue
            raise

    raise last_exc or RuntimeError("All models exhausted without producing a response.")
