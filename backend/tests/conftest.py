import pytest
import asyncio
from unittest.mock import MagicMock
from fastapi.testclient import TestClient

# Mock DB structures
class AsyncMockCursor:
    def __init__(self, data):
        self.data = data
        self.index = 0

    def sort(self, *args, **kwargs):
        # Simplistic sort (mostly for created_at sorting by descending order)
        reverse = kwargs.get("direction", -1) == -1
        try:
            self.data.sort(key=lambda x: x.get("created_at"), reverse=reverse)
        except Exception:
            pass
        return self

    def __aiter__(self):
        return self

    async def __anext__(self):
        if self.index >= len(self.data):
            raise StopAsyncIteration
        val = self.data[self.index]
        self.index += 1
        return val

class MockCollection:
    def __init__(self):
        self.storage = {}

    async def find_one(self, filter, projection=None):
        for item in self.storage.values():
            match = True
            for k, v in filter.items():
                if item.get(k) != v:
                    match = False
                    break
            if match:
                res = dict(item)
                if projection:
                    for pk, pv in projection.items():
                        if pv == 0 and pk in res:
                            res.pop(pk)
                return res
        return None

    async def insert_one(self, document):
        _id = document.get("_id")
        self.storage[_id] = document
        return MagicMock(inserted_id=_id)

    async def update_one(self, filter, update):
        doc = None
        for item in self.storage.values():
            match = True
            for k, v in filter.items():
                if item.get(k) != v:
                    match = False
                    break
            if match:
                doc = item
                break
        
        if not doc:
            return MagicMock(matched_count=0, modified_count=0)

        if "$set" in update:
            for k, v in update["$set"].items():
                if "." in k:
                    parts = k.split(".", 1)
                    parent = parts[0]
                    child = parts[1]
                    if parent not in doc:
                        doc[parent] = {}
                    doc[parent][child] = v
                else:
                    doc[k] = v
                    
        return MagicMock(matched_count=1, modified_count=1)

    async def delete_one(self, filter):
        to_delete = []
        for _id, item in self.storage.items():
            match = True
            for k, v in filter.items():
                if item.get(k) != v:
                    match = False
                    break
            if match:
                to_delete.append(_id)
                break
        
        for _id in to_delete:
            self.storage.pop(_id)
            
        return MagicMock(deleted_count=len(to_delete))

    def find(self, filter, projection=None):
        results = []
        for item in self.storage.values():
            match = True
            for k, v in filter.items():
                if item.get(k) != v:
                    match = False
                    break
            if match:
                res = dict(item)
                if projection:
                    for pk, pv in projection.items():
                        if pv == 0 and pk in res:
                            res.pop(pk)
                results.append(res)
        return AsyncMockCursor(results)

class MockDB:
    def __init__(self):
        self.collections = {
            "users": MockCollection(),
            "history": MockCollection()
        }

    def __getitem__(self, name):
        if name not in self.collections:
            self.collections[name] = MockCollection()
        return self.collections[name]

# Shared database instance for the test session
_mock_db = MockDB()

@pytest.fixture(autouse=True)
def mock_get_db(monkeypatch):
    """Automatically patches get_db to return the mock DB."""
    def dummy_get_db():
        return _mock_db
    monkeypatch.setattr("app.core.database.get_db", dummy_get_db)
    return _mock_db

@pytest.fixture(autouse=True)
def configure_test_env(monkeypatch):
    """Enforces settings for tests."""
    monkeypatch.setenv("JWT_SECRET_KEY", "test-secret-key-1234567890-test-secret-key")
    monkeypatch.setenv("GROQ_API_KEY", "test-groq-key")
    
    # Enable testing mode in settings to bypass rate limit
    from app.core.config import settings as app_settings
    monkeypatch.setattr(app_settings, "testing", True)
    
    # Prevent database connect/disconnect attempts during FastAPI lifespan startup/shutdown
    async def dummy_async():
        pass
    monkeypatch.setattr("app.core.database.connect_db", dummy_async)
    monkeypatch.setattr("app.core.database.close_db", dummy_async)

@pytest.fixture
def mock_db():
    return _mock_db

@pytest.fixture
def client():
    # Set up test env before importing main to avoid config validation errors
    import os
    os.environ["JWT_SECRET_KEY"] = "test-secret-key-1234567890-test-secret-key"
    os.environ["GROQ_API_KEY"] = "test-groq-key"
    
    from main import app
    with TestClient(app) as c:
        yield c
