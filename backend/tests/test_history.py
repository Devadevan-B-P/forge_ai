import pytest

@pytest.fixture(autouse=True)
def mock_pipeline(monkeypatch):
    """Mocks the core LLM pipeline generator call."""
    async def dummy_run(*args, **kwargs):
        return {"mocked_key": "mocked_value"}
    monkeypatch.setattr("app.routers.blueprint.run_generator_pipeline", dummy_run)

def test_history_crud_and_idor(client, mock_db):
    # Register user A and user B
    signup_a = {
        "email": "user_a@example.com",
        "password": "Password123",
        "name": "User A"
    }
    signup_b = {
        "email": "user_b@example.com",
        "password": "Password123",
        "name": "User B"
    }
    res_a = client.post("/api/auth/signup", json=signup_a)
    assert res_a.status_code == 201, f"Signup A failed: {res_a.status_code} - {res_a.text}"
    token_a = res_a.json()["access_token"]
    res_b = client.post("/api/auth/signup", json=signup_b)
    assert res_b.status_code == 201, f"Signup B failed: {res_b.status_code} - {res_b.text}"
    token_b = res_b.json()["access_token"]

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
    assert res_create.status_code == 200
    project_id = res_create.json()["id"]

    # Verify project list for User A contains the project
    res_list_a = client.get("/api/history", headers=headers_a)
    assert res_list_a.status_code == 200
    assert len(res_list_a.json()) == 1
    assert res_list_a.json()[0]["id"] == project_id

    # Verify project list for User B is empty (scoping test)
    res_list_b = client.get("/api/history", headers=headers_b)
    assert res_list_b.status_code == 200
    assert len(res_list_b.json()) == 0

    # User B tries to view User A's project (IDOR prevention check)
    res_view_b = client.get(f"/api/history/{project_id}", headers=headers_b)
    assert res_view_b.status_code == 404

    # User A views their own project
    res_view_a = client.get(f"/api/history/{project_id}", headers=headers_a)
    assert res_view_a.status_code == 200
    assert res_view_a.json()["idea"] == "An ecommerce platform"

    # User B tries to rename User A's project (IDOR check)
    res_rename_b = client.patch(f"/api/history/{project_id}/rename", json={"name": "Attacked Project Name"}, headers=headers_b)
    assert res_rename_b.status_code == 404

    # User A renames their project
    res_rename_a = client.patch(f"/api/history/{project_id}/rename", json={"name": "My Custom Project Name"}, headers=headers_a)
    assert res_rename_a.status_code == 200
    assert res_rename_a.json() == {"success": True}

    # Verify User A's project list shows the updated custom name
    res_list_a_rename = client.get("/api/history", headers=headers_a)
    assert res_list_a_rename.status_code == 200
    assert res_list_a_rename.json()[0]["name"] == "My Custom Project Name"

    # User B tries to delete User A's project (IDOR prevention check)
    res_del_b = client.delete(f"/api/history/{project_id}", headers=headers_b)
    assert res_del_b.status_code == 404

    # User A deletes their own project
    res_del_a = client.delete(f"/api/history/{project_id}", headers=headers_a)
    assert res_del_a.status_code == 200
    assert res_del_a.json() == {"success": True}

    # Verify User A's project is deleted
    res_list_a_after = client.get("/api/history", headers=headers_a)
    assert len(res_list_a_after.json()) == 0
