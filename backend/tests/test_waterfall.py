import pytest
import json
import groq as groq_sdk
from unittest.mock import AsyncMock, MagicMock
from app.services.pipeline import run_generator_pipeline, run_generator_pipeline_stream

# A dummy valid JSON payload for the models to return
DUMMY_BLUEPRINT = {
    "promptAnalysis": {"industry": "Tech"},
    "decisions": [],
    "prd": {"executiveSummary": "test"},
    "overview": "test overview",
    "features": {"user": [], "admin": [], "system": []},
    "techStack": {},
    "database": {"tables": [], "relationships": []},
    "apis": [],
    "folderStructure": {"backend": [], "frontend": []},
    "awsArchitecture": {"flow": []},
    "dockerArchitecture": {"containers": [], "flow": []},
    "timeline": [],
    "security": [],
    "scalability": [],
    "futureEnhancements": [],
    "monitoring": {"tracing": "", "metrics": [], "dashboards": [], "healthChecks": []},
    "estimatedCost": {"aws": "", "development": "", "duration": ""},
    "aiRecommendations": {},
    "mermaid": {"erDiagram": "", "architectureDiagram": "", "flowDiagram": "", "sequenceDiagram": "", "deploymentDiagram": ""}
}

class MockDelta:
    def __init__(self, content):
        self.content = content

class MockChoice:
    def __init__(self, content, is_stream=False):
        if is_stream:
            self.delta = MockDelta(content)
        else:
            self.message = MagicMock(content=content)

class MockResponse:
    def __init__(self, content, is_stream=False):
        self.choices = [MockChoice(content, is_stream)]

@pytest.fixture(autouse=True)
def clear_cooldowns():
    """Clear local memory cooldown flags between tests to prevent test pollution."""
    from app.services.pipeline import _in_memory_blocked_until
    _in_memory_blocked_until.clear()

@pytest.mark.asyncio
async def test_waterfall_all_succeed(monkeypatch):
    """If Qwen succeeds on the first try, it should return its result directly without fallbacks."""
    mock_client = MagicMock()
    mock_create = AsyncMock(return_value=MockResponse(json.dumps(DUMMY_BLUEPRINT)))
    mock_client.chat.completions.create = mock_create
    
    monkeypatch.setattr("app.services.pipeline._get_async_client", lambda: mock_client)
    
    # We pass a very small prompt so it doesn't get proactively skipped
    res = await run_generator_pipeline("Simple app idea", {})
    assert res == DUMMY_BLUEPRINT
    # Verify it was called with 'qwen/qwen3-32b'
    assert mock_create.call_count == 1
    assert mock_create.call_args[1]["model"] == "qwen/qwen3-32b"

@pytest.mark.asyncio
async def test_waterfall_rate_limit_fallback(monkeypatch):
    """If model 1 (Qwen) raises a rate limit error, it should try model 2 (GPT-OSS)."""
    mock_client = MagicMock()
    
    calls = []
    async def mock_create_fn(**kwargs):
        model = kwargs["model"]
        calls.append(model)
        if model == "qwen/qwen3-32b":
            raise groq_sdk.RateLimitError(
                message="Rate limit hit",
                response=MagicMock(headers={"retry-after": "1"}),
                body={}
            )
        return MockResponse(json.dumps(DUMMY_BLUEPRINT))

    mock_client.chat.completions.create = AsyncMock(side_effect=mock_create_fn)
    monkeypatch.setattr("app.services.pipeline._get_async_client", lambda: mock_client)
    
    res = await run_generator_pipeline("Simple app idea", {})
    assert res == DUMMY_BLUEPRINT
    assert len(calls) == 2
    assert calls[0] == "qwen/qwen3-32b"
    assert calls[1] == "openai/gpt-oss-120b"

@pytest.mark.asyncio
async def test_waterfall_request_too_large_fallback(monkeypatch):
    """If model 1 (Qwen) and model 2 (GPT-OSS) fail with TPM errors, it should try model 3 (Llama)."""
    mock_client = MagicMock()
    
    calls = []
    async def mock_create_fn(**kwargs):
        model = kwargs["model"]
        calls.append(model)
        if model in ("qwen/qwen3-32b", "openai/gpt-oss-120b"):
            # Mock a 413 APIStatusError
            raise groq_sdk.APIStatusError(
                message="Request too large",
                response=MagicMock(status_code=413),
                body={}
            )
        return MockResponse(json.dumps(DUMMY_BLUEPRINT))

    mock_client.chat.completions.create = AsyncMock(side_effect=mock_create_fn)
    monkeypatch.setattr("app.services.pipeline._get_async_client", lambda: mock_client)
    
    res = await run_generator_pipeline("Simple app idea", {})
    assert res == DUMMY_BLUEPRINT
    assert len(calls) == 3
    assert calls[0] == "qwen/qwen3-32b"
    assert calls[1] == "openai/gpt-oss-120b"
    assert calls[2] == "llama-3.3-70b-versatile"

@pytest.mark.asyncio
async def test_waterfall_proactive_token_skip(monkeypatch):
    """A massive prompt that exceeds the Qwen TPM budget should proactively skip Qwen and GPT-OSS, going straight to Llama."""
    mock_client = MagicMock()
    mock_create = AsyncMock(return_value=MockResponse(json.dumps(DUMMY_BLUEPRINT)))
    mock_client.chat.completions.create = mock_create
    monkeypatch.setattr("app.services.pipeline._get_async_client", lambda: mock_client)
    
    # 25000 chars // 4 = ~6250 tokens
    # - Qwen: limit is 6000. 6250 > 6000 -> Skips proactively.
    # - GPT-OSS: limit is 8000. 8000 - 6250 = 1750 remaining < 2000 min_usable -> Skips proactively.
    # - Llama: limit is 12000. 12000 - 6250 = 5750 remaining >= 2000 min_usable -> Succeeds (caps active_max_tokens to 5750).
    massive_prompt = "x" * 25000
    res = await run_generator_pipeline(massive_prompt, {})
    assert res == DUMMY_BLUEPRINT
    # Verify it skipped Qwen and GPT-OSS entirely and only called Llama
    assert mock_create.call_count == 1
    assert mock_create.call_args[1]["model"] == "llama-3.3-70b-versatile"
    assert mock_create.call_args[1]["max_tokens"] == 5689

@pytest.mark.asyncio
async def test_waterfall_stream_fallback(monkeypatch):
    """Tests the streaming waterfall path fallback behavior."""
    mock_client = MagicMock()
    
    # Helper class to mock asynchronous generator stream returned by client
    class AsyncStream:
        def __init__(self, text):
            self.text = text
            self.index = 0

        def __aiter__(self):
            return self

        async def __anext__(self):
            if self.index >= len(self.text):
                raise StopAsyncIteration
            val = MockResponse(self.text[self.index], is_stream=True)
            self.index += 1
            return val

    calls = []
    async def mock_create_fn(**kwargs):
        model = kwargs["model"]
        calls.append(model)
        if model == "qwen/qwen3-32b":
            raise groq_sdk.RateLimitError("Rate limit", response=MagicMock(headers={}), body={})
        return AsyncStream(json.dumps(DUMMY_BLUEPRINT))

    mock_client.chat.completions.create = AsyncMock(side_effect=mock_create_fn)
    monkeypatch.setattr("app.services.pipeline._get_async_client", lambda: mock_client)
    
    events = []
    async for event_type, payload in run_generator_pipeline_stream("Simple app", {}):
        events.append((event_type, payload))
        
    # Qwen should have failed and switched to GPT-OSS
    assert len(calls) == 2
    assert calls[0] == "qwen/qwen3-32b"
    assert calls[1] == "openai/gpt-oss-120b"
    
    # First model event should announce Qwen3 32B, then GPT-OSS 120B, then chunks
    assert events[0] == ("model", "Qwen3 32B")
    assert events[1] == ("model", "GPT-OSS 120B")
    assert any(e[0] == "chunk" for e in events)
