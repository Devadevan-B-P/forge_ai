import json
import time
import groq as groq_sdk
from groq import AsyncGroq
from typing import AsyncGenerator

from app.core.config import settings, GROQ_MODEL_WATERFALL
from app.prompts.system_prompt import (
    BLUEPRINT_SYSTEM_PROMPT,
    build_user_prompt,
    STAGE_A_SYSTEM_PROMPT,
    STAGE_B_SYSTEM_PROMPT,
    STAGE_C_SYSTEM_PROMPT,
)

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


async def _get_all_model_usages(model_ids: list[str]) -> dict[str, dict[str, int]]:
    """Fetch tpm, rpm, tpd, and rpd counters for all models in a single Redis call."""
    if _redis_client is None:
        return {m: {"tpm": 0, "rpm": 0, "tpd": 0, "rpd": 0} for m in model_ids}
    try:
        keys = []
        for model_id in model_ids:
            keys.extend([
                f"tpm:{model_id}",
                f"rpm:{model_id}",
                f"tpd:{model_id}",
                f"rpd:{model_id}"
            ])
        values = await _redis_client.mget(keys)
        
        usages = {}
        for idx, model_id in enumerate(model_ids):
            offset = idx * 4
            usages[model_id] = {
                "tpm": int(values[offset]) if values[offset] else 0,
                "rpm": int(values[offset+1]) if values[offset+1] else 0,
                "tpd": int(values[offset+2]) if values[offset+2] else 0,
                "rpd": int(values[offset+3]) if values[offset+3] else 0,
            }
        return usages
    except Exception as e:
        print(f"[WARN] Failed to batch-fetch Redis usages: {e}")
        return {m: {"tpm": 0, "rpm": 0, "tpd": 0, "rpd": 0} for m in model_ids}


def _headroom_score(usage: dict, limits: dict, estimated_tokens: int, active_max_tokens: int) -> float:
    """Computes the ratio-based headroom score for a model, accounting for the new request's requirements."""
    total_tokens = estimated_tokens + active_max_tokens
    tpm_ratio = 1.0 - ((usage["tpm"] + total_tokens) / limits["tpm"])
    rpm_ratio = 1.0 - ((usage["rpm"] + 1) / limits["rpm"])
    tpd_ratio = 1.0 - ((usage["tpd"] + total_tokens) / limits["tpd"])
    rpd_ratio = 1.0 - ((usage["rpd"] + 1) / limits["rpd"])
    return min(tpm_ratio, rpm_ratio, tpd_ratio, rpd_ratio)


async def _reserve_budget(model_id: str, tokens: int, limits: dict) -> bool:
    """Atomically increment all counters in Redis and check limits; roll back if exceeded."""
    if _redis_client is None:
        return True
    tpm_key = f"tpm:{model_id}"
    rpm_key = f"rpm:{model_id}"
    tpd_key = f"tpd:{model_id}"
    rpd_key = f"rpd:{model_id}"
    try:
        async with _redis_client.pipeline(transaction=True) as pipe:
            pipe.incrby(tpm_key, tokens)
            pipe.expire(tpm_key, 60, nx=True)
            pipe.incr(rpm_key)
            pipe.expire(rpm_key, 60, nx=True)
            pipe.incrby(tpd_key, tokens)
            pipe.expire(tpd_key, 86400, nx=True)
            pipe.incr(rpd_key)
            pipe.expire(rpd_key, 86400, nx=True)
            results = await pipe.execute()
        
        tpm_new = int(results[0])
        rpm_new = int(results[2])
        tpd_new = int(results[4])
        rpd_new = int(results[6])
        
        if (tpm_new > limits["tpm"] or
            rpm_new > limits["rpm"] or
            tpd_new > limits["tpd"] or
            rpd_new > limits["rpd"]):
            # Over budget! Roll back changes immediately
            async with _redis_client.pipeline(transaction=True) as pipe:
                pipe.decrby(tpm_key, tokens)
                pipe.decr(rpm_key)
                pipe.decrby(tpd_key, tokens)
                pipe.decr(rpd_key)
                await pipe.execute()
            return False
        return True
    except Exception as e:
        print(f"[WARN] Redis budget reservation failed for {model_id}: {e}")
        return True


async def _release_tokens(model_id: str, tokens: int):
    """Release allocated tokens (TPM/TPD) from Redis if a request fails (keeping the request count)."""
    if _redis_client is None:
        return
    try:
        async with _redis_client.pipeline(transaction=True) as pipe:
            pipe.decrby(f"tpm:{model_id}", tokens)
            pipe.decrby(f"tpd:{model_id}", tokens)
            await pipe.execute()
    except Exception:
        pass


async def _mark_model_rate_limited(model_id: str, rpm_limit: int):
    """Mark model as fully rate limited/exhausted for the next 30 seconds in Redis."""
    if _redis_client is None:
        return
    try:
        await _redis_client.set(f"rpm:{model_id}", rpm_limit, ex=30)
    except Exception:
        pass


async def _get_nearest_reset_time(model_ids: list[str]) -> int:
    """Calculate the remaining seconds until the nearest block/limit resets."""
    if _redis_client is None:
        return 60
    min_ttl = 86400
    try:
        for model_id in model_ids:
            for key_prefix in ["tpm", "rpm", "tpd", "rpd"]:
                ttl = await _redis_client.ttl(f"{key_prefix}:{model_id}")
                if ttl > 0:
                    min_ttl = min(min_ttl, ttl)
    except Exception:
        pass
    return min_ttl if min_ttl < 86400 else 60


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
    - HTTP 404 Model not found / decommissioned
    - JSON-mode not supported / failed_generation errors
    """
    if isinstance(exc, groq_sdk.RateLimitError):
        return True
    if isinstance(exc, groq_sdk.APIStatusError) and exc.status_code in (404, 413, 429):
        return True
    msg = str(exc).lower()
    return (
        "rate limit" in msg
        or "429" in msg
        or "413" in msg
        or "404" in msg
        or "not found" in msg
        or "decommissioned" in msg
        or "unknown model" in msg
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


async def _select_and_prepare_models(estimated_input_tokens: int, min_usable_output: int) -> list[dict]:
    """
    Determines model eligibility, calculates active max_tokens, and sorts eligible
    models descending by ratio-based headroom.
    Returns a list of dicts:
      [{"model_id": str, "model_name": str, "max_tokens": int, "limits": dict, "score": float}]
    """
    model_ids = [m["id"] for m in GROQ_MODEL_WATERFALL]
    usages = await _get_all_model_usages(model_ids)
    
    eligible = []
    for config in GROQ_MODEL_WATERFALL:
        model_id = config["id"]
        model_name = config["name"]
        max_output = config["max_output"]
        limits = config["limits"]
        tpm_limit = limits["tpm"]
        
        # 1. Input token limit check
        if estimated_input_tokens >= tpm_limit:
            print(f"[INFO] Proactively skipping {model_name} (input size {estimated_input_tokens} >= limit {tpm_limit})")
            continue
            
        # 2. Dynamic max_tokens capping logic
        safety_buffer = 500
        safe_tpm_limit = tpm_limit - safety_buffer
        active_max_tokens = max_output
        if estimated_input_tokens + max_output > safe_tpm_limit:
            active_max_tokens = safe_tpm_limit - estimated_input_tokens
            print(f"[INFO] Dynamically capping max_tokens for {model_name} from {max_output} to {active_max_tokens} to fit inside safe {safe_tpm_limit} TPM limit")
            
        if active_max_tokens < min_usable_output:
            print(f"[INFO] Proactively skipping {model_name} (available output budget {active_max_tokens} is below minimum {min_usable_output})")
            continue
            
        # 3. In-memory local cooldown check
        if _is_in_memory_blocked(model_id):
            print(f"[INFO] Proactively skipping {model_name} (in-memory block from recent rate limit)")
            continue
            
        # 4. Redis usage & ratio scoring
        usage = usages.get(model_id, {"tpm": 0, "rpm": 0, "tpd": 0, "rpd": 0})
        score = _headroom_score(usage, limits, estimated_input_tokens, active_max_tokens)
        
        if score <= 0.0:
            print(f"[INFO] Proactively skipping {model_name} (insufficient headroom score: {score:.4f})")
            continue
            
        eligible.append({
            "model_id": model_id,
            "model_name": model_name,
            "max_tokens": active_max_tokens,
            "limits": limits,
            "score": score
        })
        
    # Sort eligible models in descending order of headroom score
    eligible.sort(key=lambda x: x["score"], reverse=True)
    return eligible


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
    choice = response.choices[0]
    finish_reason = getattr(choice, "finish_reason", "stop")
    if finish_reason == "length":
        raise RuntimeError("json_validate_failed: response truncated by max_tokens")
    return json.loads(choice.message.content.strip())


async def _run_stage(
    idea: str,
    config: dict,
    system_prompt: str,
    context: dict | None = None,
    min_usable_output: int = 2000
) -> dict:
    """Runs a single stage using dynamic headroom-based load balancing."""
    prompt = build_user_prompt(idea, config, context=context)
    estimated_input_tokens = (len(prompt) + len(system_prompt)) // 4
    last_exc: Exception | None = None

    eligible_models = await _select_and_prepare_models(estimated_input_tokens, min_usable_output)
    
    if not eligible_models:
        # Check if daily limit is exhausted on any model
        model_ids = [m["id"] for m in GROQ_MODEL_WATERFALL]
        usages = await _get_all_model_usages(model_ids)
        for conf in GROQ_MODEL_WATERFALL:
            m_id = conf["id"]
            limits = conf["limits"]
            usage = usages.get(m_id, {})
            if usage.get("tpd", 0) >= limits["tpd"] or usage.get("rpd", 0) >= limits["rpd"]:
                raise RuntimeError("This AI provider's daily limit is reached — please try again after midnight UTC")
        
        seconds_until_reset = await _get_nearest_reset_time(model_ids)
        raise RuntimeError(f"All AI models are at capacity. Next available in ~{seconds_until_reset}s.")

    for model_info in eligible_models:
        model_id = model_info["model_id"]
        model_name = model_info["model_name"]
        active_max_tokens = model_info["max_tokens"]
        limits = model_info["limits"]
        
        estimated_total_tokens = estimated_input_tokens + active_max_tokens
        
        # Atomically reserve budget
        if not await _reserve_budget(model_id, estimated_total_tokens, limits):
            print(f"[INFO] Reservation failed for {model_name} (over budget under concurrency)")
            continue
            
        try:
            print(f"[INFO] Trying model: {model_name} ({model_id}, max_tokens={active_max_tokens})")
            result = await _call_model_async(prompt, system_prompt, model_id, active_max_tokens)
            return result
        except Exception as exc:
            if _should_try_next_model(exc):
                # Check for direct daily limit/quota failures
                exc_msg = str(exc).lower()
                if "quota" in exc_msg or "daily limit" in exc_msg:
                    raise RuntimeError("This AI provider's daily limit is reached — please try again after midnight UTC")
                
                print(f"[WARN] {model_name} unavailable ({exc}), falling back to next model.")
                _mark_in_memory_blocked(model_id)
                await _mark_model_rate_limited(model_id, limits["rpm"])
                await _release_tokens(model_id, estimated_total_tokens)
                last_exc = exc
                continue
            await _release_tokens(model_id, estimated_total_tokens)
            raise
            
    raise last_exc or RuntimeError("All models exhausted.")


async def run_generator_pipeline(idea: str, config: dict) -> dict:
    """Waterfall generator route. Uses fast-path or staged fallback."""
    prompt_size_estimate = len(build_user_prompt(idea, config)) // 4
    SINGLE_CALL_THRESHOLD = 1500

    if prompt_size_estimate < SINGLE_CALL_THRESHOLD:
        # Fast path
        return await _run_stage(idea, config, BLUEPRINT_SYSTEM_PROMPT, min_usable_output=4500)

    # Slow path: staged generation
    import asyncio
    stage_a = await _run_stage(idea, config, STAGE_A_SYSTEM_PROMPT, min_usable_output=2000)
    context = {"decisions": stage_a.get("decisions", []), "techStack": stage_a.get("techStack", {})}
    
    stage_b, stage_c = await asyncio.gather(
        _run_stage(idea, config, STAGE_B_SYSTEM_PROMPT, context=context, min_usable_output=2000),
        _run_stage(idea, config, STAGE_C_SYSTEM_PROMPT, context=context, min_usable_output=2000)
    )
    return {**stage_a, **stage_b, **stage_c}


async def _run_stage_stream(
    idea: str,
    config: dict,
    system_prompt: str,
    context: dict | None = None,
    min_usable_output: int = 2000
) -> AsyncGenerator[tuple[str, str], None]:
    """Streams a single stage waterfall run using dynamic headroom-based load balancing."""
    prompt = build_user_prompt(idea, config, context=context)
    estimated_input_tokens = (len(prompt) + len(system_prompt)) // 4
    last_exc: Exception | None = None

    eligible_models = await _select_and_prepare_models(estimated_input_tokens, min_usable_output)
    
    if not eligible_models:
        # Check if daily limit is exhausted on any model
        model_ids = [m["id"] for m in GROQ_MODEL_WATERFALL]
        usages = await _get_all_model_usages(model_ids)
        for conf in GROQ_MODEL_WATERFALL:
            m_id = conf["id"]
            limits = conf["limits"]
            usage = usages.get(m_id, {})
            if usage.get("tpd", 0) >= limits["tpd"] or usage.get("rpd", 0) >= limits["rpd"]:
                raise RuntimeError("This AI provider's daily limit is reached — please try again after midnight UTC")
        
        seconds_until_reset = await _get_nearest_reset_time(model_ids)
        raise RuntimeError(f"All AI models are at capacity. Next available in ~{seconds_until_reset}s.")

    for model_info in eligible_models:
        model_id = model_info["model_id"]
        model_name = model_info["model_name"]
        active_max_tokens = model_info["max_tokens"]
        limits = model_info["limits"]
        
        estimated_total_tokens = estimated_input_tokens + active_max_tokens
        
        # Atomically reserve budget
        if not await _reserve_budget(model_id, estimated_total_tokens, limits):
            print(f"[INFO] Reservation failed for {model_name} (over budget under concurrency)")
            continue
            
        try:
            print(f"[INFO] Streaming with model: {model_name} ({model_id}, max_tokens={active_max_tokens})")
            yield ("model", model_name)

            client = _get_async_client()
            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt},
            ]
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
            last_finish_reason = None
            async for chunk in response_stream:
                if chunk.choices:
                    finish_reason = getattr(chunk.choices[0], "finish_reason", None)
                    if finish_reason:
                        last_finish_reason = finish_reason
                    delta = getattr(chunk.choices[0], "delta", None)
                    content = getattr(delta, "content", "") or ""
                else:
                    content = ""
                if content:
                    yield ("chunk", content)

            if last_finish_reason == "length":
                raise RuntimeError("json_validate_failed: response truncated by max_tokens")
                
            return
        except Exception as exc:
            if _should_try_next_model(exc):
                # Check for direct daily limit/quota failures
                exc_msg = str(exc).lower()
                if "quota" in exc_msg or "daily limit" in exc_msg:
                    raise RuntimeError("This AI provider's daily limit is reached — please try again after midnight UTC")
                
                print(f"[WARN] {model_name} unavailable ({exc}), falling back to next model.")
                _mark_in_memory_blocked(model_id)
                await _mark_model_rate_limited(model_id, limits["rpm"])
                await _release_tokens(model_id, estimated_total_tokens)
                last_exc = exc
                continue
            await _release_tokens(model_id, estimated_total_tokens)
            raise
            
    raise last_exc or RuntimeError("All models exhausted.")


async def run_generator_pipeline_stream(
    idea: str, config: dict
) -> AsyncGenerator[tuple[str, str], None]:
    """Streaming entrypoint with single-call fast-path or staged fallback."""
    prompt_size_estimate = len(build_user_prompt(idea, config)) // 4
    SINGLE_CALL_THRESHOLD = 1500

    if prompt_size_estimate < SINGLE_CALL_THRESHOLD:
        # Fast path
        async for event in _run_stage_stream(idea, config, BLUEPRINT_SYSTEM_PROMPT, min_usable_output=4500):
            yield event
        return

    # Slow path: staged generation streaming
    import asyncio
    yield ("stage", "Analyzing your requirements...")
    stage_a = await _run_stage(idea, config, STAGE_A_SYSTEM_PROMPT, min_usable_output=2000)

    yield ("stage", "Drafting the PRD and infrastructure...")
    context = {"decisions": stage_a.get("decisions", []), "techStack": stage_a.get("techStack", {})}
    
    # Run Stage B and Stage C concurrently. Stage B is the PRD, so we stream it live.
    task_c = asyncio.create_task(_run_stage(idea, config, STAGE_C_SYSTEM_PROMPT, context=context, min_usable_output=2000))
    
    async for event in _run_stage_stream(idea, config, STAGE_B_SYSTEM_PROMPT, context=context, min_usable_output=2000):
        yield event
        
    stage_c = await task_c

    yield ("stage", "Finalizing your blueprint...")
    # Merge Stage A and Stage C into one payload and yield as merge
    merged_data = {**stage_a, **stage_c}
    import json
    yield ("merge", json.dumps(merged_data))
