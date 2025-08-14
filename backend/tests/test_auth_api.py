# TODO: rather than importing all intermediate fixtures, we should find a way to just import the top-level one we use (client).
from backend.tests.fixtures import client, app, engine, auth_token_and_user

def test_me_endpoint(client):
    test_client, token, fake_user = client
    response = test_client.get("/api/auth/me", headers={"x-stack-access-token": token})
    assert response.status_code == 200
    assert response.json()["id"] == fake_user["id"]
    assert response.json()["email"] == fake_user["email"]


def test_verify_endpoint(client):
    test_client, token, fake_user = client
    response = test_client.get("/api/auth/verify", headers={"x-stack-access-token": token})
    assert response.status_code == 200
    data = response.json()
    assert data["valid"] is True
    assert data["user"]["id"] == fake_user["id"]


def test_me_unauthorized(client):
    test_client, _, _ = client
    response = test_client.get("/api/auth/me")
    assert response.status_code == 401
    assert "No access token" in response.text
