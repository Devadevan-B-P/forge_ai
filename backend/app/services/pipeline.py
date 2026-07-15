import json
import groq as groq_sdk
from groq import AsyncGroq
from typing import AsyncGenerator

from app.core.config import settings, GROQ_MODEL_WATERFALL
from app.prompts.system_prompt import BLUEPRINT_SYSTEM_PROMPT, build_user_prompt

_async_client: AsyncGroq | None = None


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
    "qwen/qwen3-32b",
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
        temperature=0.3,
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
    last_exc: Exception | None = None
    for model_id, model_name, max_tokens in GROQ_MODEL_WATERFALL:
        try:
            print(f"[INFO] Trying model: {model_name} ({model_id}, max_tokens={max_tokens})")
            return await _call_model_async(prompt, BLUEPRINT_SYSTEM_PROMPT, model_id, max_tokens)
        except Exception as exc:
            if _should_try_next_model(exc):
                print(f"[WARN] {model_name} unavailable ({exc}), falling back to next model.")
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
    client = _get_async_client()
    messages = [
        {"role": "system", "content": BLUEPRINT_SYSTEM_PROMPT},
        {"role": "user", "content": prompt},
    ]

    last_exc: Exception | None = None
    for model_id, model_name, max_tokens in GROQ_MODEL_WATERFALL:
        try:
            print(f"[INFO] Streaming with model: {model_name} ({model_id}, max_tokens={max_tokens})")
            yield ("model", model_name)

            kwargs: dict = dict(
                model=model_id,
                messages=messages,
                temperature=0.3,
                max_tokens=max_tokens,
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
            # Stream completed successfully — stop waterfall
            return
        except Exception as exc:
            if _should_try_next_model(exc):
                print(f"[WARN] {model_name} unavailable ({exc}), falling back to next model.")
                last_exc = exc
                continue
            raise

    raise last_exc or RuntimeError("All models exhausted without producing a response.")
