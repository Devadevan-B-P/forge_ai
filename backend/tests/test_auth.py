import pytest

def test_signup(client, mock_db):
    signup_data = {
        "email": "testuser@example.com",
        "password": "Password123",
        "name": "Test User"
    }
    response = client.post("/api/auth/signup", json=signup_data)
    assert response.status_code == 201
    
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert "user" in data
    user = data["user"]
    assert user["email"] == "testuser@example.com"
    assert user["name"] == "Test User"
    assert "id" in user
    assert "password_hash" not in user
    assert "password" not in user

def test_signup_duplicate(client, mock_db):
    signup_data = {
        "email": "testuser@example.com",
        "password": "Password123",
        "name": "Test User"
    }
    # Second signup should fail
    response = client.post("/api/auth/signup", json=signup_data)
    assert response.status_code == 409
    assert "exists" in response.json()["detail"]

def test_login(client, mock_db):
    login_data = {
        "email": "testuser@example.com",
        "password": "Password123"
    }
    response = client.post("/api/auth/login", json=login_data)
    assert response.status_code == 200
    
    data = response.json()
    assert "access_token" in data
    assert "user" in data
    user = data["user"]
    assert user["email"] == "testuser@example.com"
    assert "password_hash" not in user
    
    # Invalid password login
    response = client.post("/api/auth/login", json={
        "email": "testuser@example.com",
        "password": "WrongPassword"
    })
    assert response.status_code == 401

def test_me(client, mock_db):
    # Log in first to get token
    login_data = {
        "email": "testuser@example.com",
        "password": "Password123"
    }
    login_resp = client.post("/api/auth/login", json=login_data)
    token = login_resp.json()["access_token"]
    
    headers = {"Authorization": f"Bearer {token}"}
    response = client.get("/api/auth/me", headers=headers)
    assert response.status_code == 200
    
    data = response.json()
    assert data["email"] == "testuser@example.com"
    assert data["name"] == "Test User"
    assert "password_hash" not in data
