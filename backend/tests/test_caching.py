import pytest
from unittest.mock import AsyncMock, MagicMock
from app.services.groq_service import generate_sql, generate_endpoint_code

@pytest.mark.asyncio
async def test_generate_sql_cache_hit(monkeypatch):
    # Mock Redis client
    mock_redis = AsyncMock()
    mock_redis.get.return_value = "CREATE TABLE cached_table (id INT);"
    
    # Patch the global _redis_client inside groq_service
    monkeypatch.setattr("app.services.groq_service._redis_client", mock_redis)
    
    # Call generate_sql
    result = await generate_sql({"tables": []}, "postgresql")
    
    # Check that we got the cached value
    assert result == "CREATE TABLE cached_table (id INT);"
    # Verify Redis get was called with correct key format
    mock_redis.get.assert_called_once()
    assert mock_redis.get.call_args[0][0].startswith("cache:sql:")


@pytest.mark.asyncio
async def test_generate_sql_cache_miss(monkeypatch):
    # Mock Redis client with cache miss
    mock_redis = AsyncMock()
    mock_redis.get.return_value = None
    
    # Patch the global _redis_client inside groq_service
    monkeypatch.setattr("app.services.groq_service._redis_client", mock_redis)
    
    # Mock the LLM client
    mock_llm = MagicMock()
    mock_chat = AsyncMock()
    mock_chat.create.return_value = MagicMock(
        choices=[MagicMock(message=MagicMock(content="CREATE TABLE new_table (id INT);"))]
    )
    mock_llm.chat.completions = mock_chat
    
    # Patch _get_async_client to return mock_llm
    monkeypatch.setattr("app.services.groq_service._get_async_client", lambda: mock_llm)
    
    # Call generate_sql
    result = await generate_sql({"tables": []}, "postgresql")
    
    # Verify the results and that cache was populated
    assert result == "CREATE TABLE new_table (id INT);"
    mock_redis.get.assert_called_once()
    mock_redis.set.assert_called_once()
    # Check key and TTL
    assert mock_redis.set.call_args[0][0].startswith("cache:sql:")
    assert mock_redis.set.call_args[0][1] == "CREATE TABLE new_table (id INT);"
    assert mock_redis.set.call_args[1]["ex"] == 86400
