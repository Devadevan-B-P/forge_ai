import pytest
from fastapi.testclient import TestClient


def test_login_enumeration_uniformity(client, mock_db):
    # Nonexistent email should return 401 Unauthorized, detail="Invalid email or password."
    resp_nonexistent = client.post("/api/auth/login", json={
        "email": "nonexistent@example.com",
        "password": "Password123"
    })
    assert resp_nonexistent.status_code == 401
    assert resp_nonexistent.json()["detail"] == "Invalid email or password."

    # Existent email with wrong password should return 401 Unauthorized
    signup_data = {
        "email": "hardening_user@example.com",
        "password": "Password123",
        "name": "Hardening User"
    }
    client.post("/api/auth/signup", json=signup_data)

    resp_wrong = client.post("/api/auth/login", json={
        "email": "hardening_user@example.com",
        "password": "WrongPassword"
    })
    assert resp_wrong.status_code == 401
    assert resp_wrong.json()["detail"] == "Invalid email or password."


def test_logout_and_revocation(client, mock_db):
    # Log in to get token
    login_resp = client.post("/api/auth/login", json={
        "email": "hardening_user@example.com",
        "password": "Password123"
    })
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Call /me -> should succeed
    me_resp = client.get("/api/auth/me", headers=headers)
    assert me_resp.status_code == 200

    # Call /logout -> should succeed
    logout_resp = client.post("/api/auth/logout", headers=headers)
    assert logout_resp.status_code == 200
    assert logout_resp.json()["detail"] == "Successfully logged out."

    # Call /me again -> should fail with 401 because token is blacklisted
    me_resp_after = client.get("/api/auth/me", headers=headers)
    assert me_resp_after.status_code == 401
    assert "revoked" in me_resp_after.json()["detail"].lower()


def test_payload_size_limit(client):
    # Send a request body larger than 100KB -> should return 413 Request Entity Too Large
    huge_data = "a" * (101 * 1024)
    resp = client.post("/api/auth/login", content=huge_data, headers={"Content-Type": "application/json"})
    assert resp.status_code == 413
    assert "Too Large" in resp.text


def test_contact_endpoint_validation(client):
    contact_data = {
        "name": "Jane Doe",
        "email": "jane@example.com",
        "subject": "Inquiry",
        "message": "Hello from tests"
    }
    # If no keys are set, it returns 501 Not Implemented
    resp = client.post("/api/contact", json=contact_data)
    assert resp.status_code in (200, 501)
