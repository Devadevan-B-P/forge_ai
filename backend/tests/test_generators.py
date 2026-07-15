import pytest

@pytest.fixture(autouse=True)
def mock_generators(monkeypatch):
    """Mocks the generator LLM service functions to avoid network calls."""
    async def dummy_sql(*args, **kwargs):
        return "CREATE TABLE test_table (id INT);"
    async def dummy_endpoint(*args, **kwargs):
        return "def get_test(): return {'ok': True}"
    monkeypatch.setattr("app.routers.generators.generate_sql", dummy_sql)
    monkeypatch.setattr("app.routers.generators.generate_endpoint_code", dummy_endpoint)

@pytest.fixture(autouse=True)
def mock_pipeline(monkeypatch):
    """Mocks the core LLM pipeline generator call."""
    async def dummy_run(*args, **kwargs):
        return {"mocked_key": "mocked_value"}
    monkeypatch.setattr("app.routers.blueprint.run_generator_pipeline", dummy_run)

def test_generator_idor(client, mock_db):
    # Register user A and user B
    signup_a = {
        "email": "gen_a@example.com",
        "password": "Password123",
        "name": "User Gen A"
    }
    signup_b = {
        "email": "gen_b@example.com",
        "password": "Password123",
        "name": "User Gen B"
    }
    token_a = client.post("/api/auth/signup", json=signup_a).json()["access_token"]
    token_b = client.post("/api/auth/signup", json=signup_b).json()["access_token"]

    headers_a = {"Authorization": f"Bearer {token_a}"}
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # User A generates a project blueprint (creates history item)
    blueprint_req = {
        "idea": "An ecommerce platform",
        "config": {
            "style": "Microservices",
            "database": "PostgreSQL",
            "backend": "FastAPI",
            "frontend": "React",
            "cloud": "AWS",
            "size": "Medium"
        },
        "history_id": None
    }
    res_create = client.post("/api/blueprint/generate", json=blueprint_req, headers=headers_a)
    project_id = res_create.json()["id"]

    # User B tries to save SQL code to User A's project (IDOR Prevention check)
    sql_req = {
        "database": {"tables": []},
        "dialect": "postgresql",
        "history_id": project_id
    }
    res_sql_b = client.post("/api/generate/sql", json=sql_req, headers=headers_b)
    assert res_sql_b.status_code == 404, f"SQL B failed: {res_sql_b.status_code} - {res_sql_b.json()}"

    # User A saves SQL code to their own project
    res_sql_a = client.post("/api/generate/sql", json=sql_req, headers=headers_a)
    assert res_sql_a.status_code == 200
    assert res_sql_a.json()["code"] == "CREATE TABLE test_table (id INT);"
    assert res_sql_a.json()["language"] == "sql"

    # User B tries to save API code to User A's project (IDOR Prevention check)
    ep_req = {
        "endpoint": {"method": "GET", "route": "/api/users"},
        "framework": "fastapi",
        "history_id": project_id,
        "endpoint_key": "GET_/api/users"
    }
    res_ep_b = client.post("/api/generate/endpoint", json=ep_req, headers=headers_b)
    assert res_ep_b.status_code == 404

    # User A saves API code to their own project
    res_ep_a = client.post("/api/generate/endpoint", json=ep_req, headers=headers_a)
    assert res_ep_a.status_code == 200
    assert "get_test" in res_ep_a.json()["code"]

    # Generate code without history project ID (no-history path)
    sql_req_no_hist = {
        "database": {"tables": []},
        "dialect": "postgresql",
        "history_id": None
    }
    res_sql_nohist = client.post("/api/generate/sql", json=sql_req_no_hist, headers=headers_a)
    assert res_sql_nohist.status_code == 200
