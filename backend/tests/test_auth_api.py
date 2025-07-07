import pytest
from fastapi.testclient import TestClient
import sys
import os

# Ensure the project root is in sys.path for 'backend' imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))
from backend.app_factory import create_app
from backend.util.mock_stack_auth import MockStackAuthBackend
from backend.routers import auth

@pytest.fixture
def client():
    app = create_app()
    mock_auth = MockStackAuthBackend()
    # Register a fake user
    fake_user = {"id": "user123", "email": "test@example.com", "name": "Test User"}
    token = mock_auth.register_user(fake_user)
    # Override dependency
    app.dependency_overrides[auth.get_stack_auth_backend] = lambda: mock_auth
    return TestClient(app), token, fake_user

def test_me_endpoint(client):
    test_client, token, fake_user = client
    response = test_client.get("/auth/me", headers={"x-stack-access-token": token})
    assert response.status_code == 200
    assert response.json()["id"] == fake_user["id"]
    assert response.json()["email"] == fake_user["email"]


def test_verify_endpoint(client):
    test_client, token, fake_user = client
    response = test_client.get("/auth/verify", headers={"x-stack-access-token": token})
    assert response.status_code == 200
    data = response.json()
    assert data["valid"] is True
    assert data["user"]["id"] == fake_user["id"]


def test_me_unauthorized(client):
    test_client, _, _ = client
    response = test_client.get("/auth/me")
    assert response.status_code == 401
    assert "No access token" in response.text 