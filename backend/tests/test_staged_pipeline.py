import pytest
import json
import asyncio
import groq as groq_sdk
from unittest.mock import AsyncMock, MagicMock
from app.services.pipeline import run_generator_pipeline, run_generator_pipeline_stream, _get_async_client

# Dummy stage responses
STAGE_A_DUMMY = {
    "promptAnalysis": {"projectName": "StagedAppName", "industry": "StagedTech"},
    "decisions": [{"component": "Auth", "userRequirement": "secure", "recommendation": "JWT", "alternatives": [], "reason": "standard"}],
    "overview": "Staged overview",
    "features": {"user": [], "admin": [], "system": []},
    "techStack": {"backend": ["FastAPI"]},
    "database": {"tables": []},
    "apis": [],
    "folderStructure": {"backend": [], "frontend": []}
}

STAGE_B_DUMMY = {
    "prd": {
        "documentMetadata": {"ownership": "PM", "deploymentTarget": "AWS", "versionStatus": "Draft"},
        "executiveSummary": "PRD summary",
        "userStories": [],
        "businessRules": [],
        "acceptanceCriteria": [],
        "uxDesign": {"interfaceOverview": "overview", "layoutDescription": "desc"},
        "businessFlow": [],
        "systemFlow": []
    }
}

STAGE_C_DUMMY = {
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

# The fast-path monolithic return
MONOLITHIC_DUMMY = {**STAGE_A_DUMMY, **STAGE_B_DUMMY, **STAGE_C_DUMMY}


class MockChoice:
    def __init__(self, content, finish_reason="stop", is_stream=False):
        self.finish_reason = finish_reason
        if is_stream:
            self.delta = MagicMock(content=content)
        else:
            self.message = MagicMock(content=content)


class MockResponse:
    def __init__(self, content, finish_reason="stop", is_stream=False):
        self.choices = [MockChoice(content, finish_reason, is_stream)]


@pytest.fixture(autouse=True)
def clear_cooldowns():
    from app.services.pipeline import _in_memory_blocked_until
    _in_memory_blocked_until.clear()


@pytest.mark.asyncio
async def test_small_prompt_runs_fast_path(monkeypatch):
    """A small prompt is below SINGLE_CALL_THRESHOLD and should run a single waterfall stage."""
    mock_client = MagicMock()
    mock_create = AsyncMock(return_value=MockResponse(json.dumps(MONOLITHIC_DUMMY)))
    mock_client.chat.completions.create = mock_create
    monkeypatch.setattr("app.services.pipeline._get_async_client", lambda: mock_client)

    res = await run_generator_pipeline("Small idea", {})
    assert res == MONOLITHIC_DUMMY
    assert mock_create.call_count == 1


@pytest.mark.asyncio
async def test_large_prompt_runs_staged_concurrent(monkeypatch):
    """A large prompt is above threshold, triggering Stage A followed by Stage B and C concurrently."""
    mock_client = MagicMock()
    
    in_flight = set()

    async def mock_create_fn(**kwargs):
        messages = kwargs["messages"]
        system_role = messages[0]["content"]

        if "promptAnalysis" in system_role:
            return MockResponse(json.dumps(STAGE_A_DUMMY))
        elif "prd" in system_role:
            in_flight.add("B")
            # Briefly yield control to let Stage C start and establish concurrency
            await asyncio.sleep(0.05)
            # Both B and C must have been in-flight concurrently
            assert "C" in in_flight
            return MockResponse(json.dumps(STAGE_B_DUMMY))
        elif "awsArchitecture" in system_role:
            in_flight.add("C")
            await asyncio.sleep(0.05)
            assert "B" in in_flight
            return MockResponse(json.dumps(STAGE_C_DUMMY))
        else:
            raise ValueError("Unknown stage prompt system role")

    mock_client.chat.completions.create = AsyncMock(side_effect=mock_create_fn)
    monkeypatch.setattr("app.services.pipeline._get_async_client", lambda: mock_client)

    # Large prompt: size ~1600 tokens
    large_prompt = "x" * 6400
    res = await run_generator_pipeline(large_prompt, {})

    # The returned dict must be the merged result of Stage A, B, and C
    assert res["promptAnalysis"]["industry"] == "StagedTech"
    assert res["prd"]["executiveSummary"] == "PRD summary"
    assert "awsArchitecture" in res


@pytest.mark.asyncio
async def test_finish_reason_length_causes_retry(monkeypatch):
    """If model 1 (Qwen) returns finish_reason="length", it should fail and retry/fallback to the next model."""
    """If model 1 (Llama) returns finish_reason="length", it should fail and retry/fallback to the next model."""
    mock_client = MagicMock()
    calls = []

    async def mock_create_fn(**kwargs):
        model = kwargs["model"]
        calls.append(model)
        if model == "llama-3.3-70b-versatile":
            # Return truncated response with finish_reason length
            return MockResponse(json.dumps(MONOLITHIC_DUMMY), finish_reason="length")
        return MockResponse(json.dumps(MONOLITHIC_DUMMY), finish_reason="stop")
 
    mock_client.chat.completions.create = AsyncMock(side_effect=mock_create_fn)
    monkeypatch.setattr("app.services.pipeline._get_async_client", lambda: mock_client)
 
    res = await run_generator_pipeline("Small idea", {})
    assert res == MONOLITHIC_DUMMY
    # It must have called both Llama and GPT-OSS (waterfall fallback)
    assert len(calls) == 2
    assert calls[0] == "llama-3.3-70b-versatile"
    assert calls[1] == "openai/gpt-oss-120b"
