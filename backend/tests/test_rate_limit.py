import pytest
from fastapi.testclient import TestClient

def test_sqlite_rate_limiting(monkeypatch):
    # Disable testing mode so rate limit middleware is active
    from app.core.config import settings as app_settings
    monkeypatch.setattr(app_settings, "testing", False)
    
    # Ensure Redis is not configured so the middleware falls back to SQLite
    monkeypatch.setattr(app_settings, "redis_url", None)
    
    # Clear out any previous database file if it exists to ensure test isolation
    import tempfile
    import os
    from pathlib import Path
    db_path = Path(tempfile.gettempdir()) / "app_rate_limit.db"
    if db_path.exists():
        try:
            os.remove(db_path)
            # Also remove WAL files if they exist
            for p in db_path.parent.glob("app_rate_limit.db*"):
                try:
                    os.remove(p)
                except Exception:
                    pass
        except Exception:
            pass

    from main import app

    with TestClient(app) as client:
        responses = []
        # Auth rate limit is 10. We perform 12 requests.
        for i in range(12):
            resp = client.post("/api/auth/login", json={
                "email": "ratelimit_user@example.com",
                "password": "WrongPassword"
            })
            print(f"Request {i}: status={resp.status_code}")
            responses.append(resp.status_code)
            
        # Check that the first 10 requests got through (404 Not Found because user does not exist)
        for code in responses[:10]:
            assert code == 404
            
        # Check that the 11th and 12th requests got blocked (429 Too Many Requests)
        assert responses[10] == 429
        assert responses[11] == 429
