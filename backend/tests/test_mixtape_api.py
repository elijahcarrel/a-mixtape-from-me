import httpx
from fastapi.testclient import TestClient

from backend.routers import auth
from backend.tests.assertion_utils import (
    assert_response_created,
    assert_response_not_found,
    assert_response_success,
)


# --- TESTS ---
def mixtape_payload(tracks: list) -> dict:
    return {
        "name": "Test Mixtape",
        "intro_text": "Intro!",
        "subtitle1": "Subtitle 1",
        "subtitle2": "Subtitle 2",
        "subtitle3": "Subtitle 3",
        "is_public": True,
        "tracks": tracks
    }

def test_create_and_get_mixtape(client: tuple[TestClient, str, dict]) -> None:
    test_client, token, _ = client
    tracks = [
        {"track_position": 1, "track_text": "First", "spotify_uri": "spotify:track:track1"},
        {"track_position": 2, "track_text": "Second", "spotify_uri": "spotify:track:track2"}
    ]
    # Create
    resp = test_client.post("/api/mixtape", json=mixtape_payload(tracks), headers={"x-stack-access-token": token})
    assert_response_created(resp)
    public_id = resp.json()["public_id"]
    # Get
    resp = test_client.get(f"/api/mixtape/{public_id}", headers={"x-stack-access-token": token})
    assert_response_success(resp)
    data = resp.json()
    assert data["name"] == "Test Mixtape"
    assert data["subtitle1"] == "Subtitle 1"
    assert data["subtitle2"] == "Subtitle 2"
    assert data["subtitle3"] == "Subtitle 3"
    assert data["is_public"] is True
    assert len(data["tracks"]) == 2
    assert data["tracks"][0]["track_position"] == 1
    assert data["tracks"][1]["track_position"] == 2
    # Check TrackDetails present
    expected_names = ["Mock Song One", "Another Track"]
    for t, expected_name in zip(data["tracks"], expected_names, strict=False):
        assert "track" in t
        assert t["track"]["id"] == f"{t['track']['uri'].replace('spotify:track:', '')}"
        assert t["track"]["name"] == expected_name

def test_edit_mixtape_add_remove_modify_tracks(client: tuple[TestClient, str, dict]) -> None:
    test_client, token, _ = client
    # Create
    tracks = [
        {"track_position": 1, "track_text": "A", "spotify_uri": "spotify:track:track1"},
        {"track_position": 2, "track_text": "B", "spotify_uri": "spotify:track:track2"}
    ]
    resp = test_client.post("/api/mixtape", json=mixtape_payload(tracks), headers={"x-stack-access-token": token})
    assert_response_created(resp)
    public_id = resp.json()["public_id"]
    # Edit: remove track 2, add track 3, modify track 1
    new_tracks = [
        {"track_position": 1, "track_text": "A-modified", "spotify_uri": "spotify:track:track1"},
        {"track_position": 3, "track_text": "C", "spotify_uri": "spotify:track:track3"}
    ]
    resp = test_client.put(f"/api/mixtape/{public_id}", json=mixtape_payload(new_tracks), headers={"x-stack-access-token": token})
    assert_response_success(resp)
    version = resp.json()["version"]
    assert version == 2
    # Get and verify
    resp = test_client.get(f"/api/mixtape/{public_id}", headers={"x-stack-access-token": token})
    assert_response_success(resp)
    data = resp.json()
    assert len(data["tracks"]) == 2
    assert {t["track_position"] for t in data["tracks"]} == {1, 3}
    assert any(t["track_text"] == "A-modified" for t in data["tracks"])
    assert any(t["track_text"] == "C" for t in data["tracks"])
    for t in data["tracks"]:
        assert "track" in t
        assert t["track"]["id"] == f"{t['track']['uri'].replace('spotify:track:', '')}"

def test_duplicate_track_position_rejected(client: tuple[TestClient, str, dict]) -> None:
    test_client, token, _ = client
    tracks = [
        {"track_position": 1, "track_text": "A", "spotify_uri": "spotify:track:track1"},
        {"track_position": 1, "track_text": "B", "spotify_uri": "spotify:track:track2"}
    ]
    resp = test_client.post("/api/mixtape", json=mixtape_payload(tracks), headers={"x-stack-access-token": token})
    # Should not create mixtape with duplicate track positions
    assert resp.status_code in [422, 400], f"Expected 422 or 400, got {resp.status_code}. Response: {resp.text}"

def test_get_nonexistent_mixtape(client: tuple[TestClient, str, dict]) -> None:
    test_client, token, _ = client
    resp = test_client.get("/api/mixtape/00000000-0000-0000-0000-000000000000", headers={"x-stack-access-token": token})
    assert_response_not_found(resp)

def test_list_my_mixtapes_pagination_and_search(client: tuple[TestClient, str, dict]) -> None:
    test_client, token, _ = client
    # Create 5 mixtapes with varying names
    names = ["Mock Song One", "Another Track", "Third Song", "Fourth Track", "Fifth Track"]
    track_ids = ["track1", "track2", "track3", "track4", "track5"]
    public_ids = []
    for i, name in enumerate(names):
        resp = test_client.post(
            "/api/mixtape/",
            json={"name": name, "intro_text": "", "is_public": True, "tracks": [{"track_position": 1, "track_text": name, "spotify_uri": f"spotify:track:{track_ids[i]}"}]},
            headers={"x-stack-access-token": token},
        )
        assert_response_created(resp)
        public_ids.append(resp.json()["public_id"])
    # Test limit
    resp = test_client.get("/api/mixtape?limit=2", headers={"x-stack-access-token": token})
    assert_response_success(resp)
    data = resp.json()
    assert len(data) == 2
    # Test offset
    resp2 = test_client.get("/api/mixtape?limit=2&offset=2", headers={"x-stack-access-token": token})
    assert_response_success(resp2)
    data2 = resp2.json()
    assert len(data2) == 2
    # Test q (partial match, case-insensitive)
    resp3 = test_client.get("/api/mixtape?q=mock", headers={"x-stack-access-token": token})
    assert_response_success(resp3)
    data3 = resp3.json()
    # Should match 'Mock Song One'
    found_names = {d["name"].lower() for d in data3}
    assert "mock song one" in found_names
    # Test q with no matches
    resp4 = test_client.get("/api/mixtape?q=nomatch", headers={"x-stack-access-token": token})
    assert_response_success(resp4)
    data4 = resp4.json()
    assert data4 == []

def test_public_mixtape_viewable_by_unauthenticated_user(client: tuple[TestClient, str, dict]) -> None:
    test_client, token, _ = client
    tracks = [
        {"track_position": 1, "track_text": "First", "spotify_uri": "spotify:track:track1"}
    ]
    # Create public mixtape
    resp = test_client.post("/api/mixtape", json=mixtape_payload(tracks), headers={"x-stack-access-token": token})
    assert_response_created(resp)
    public_id = resp.json()["public_id"]
    # Unauthenticated GET should succeed
    resp = test_client.get(f"/api/mixtape/{public_id}")
    assert_response_success(resp)
    # Make mixtape private
    resp = test_client.put(f"/api/mixtape/{public_id}", json={"name": "Test Mixtape", "intro_text": "Intro!", "is_public": False, "tracks": tracks}, headers={"x-stack-access-token": token})
    assert_response_success(resp)
    # Unauthenticated GET should now fail (401)
    resp = test_client.get(f"/api/mixtape/{public_id}")
    assert resp.status_code == 401

def test_only_owner_can_edit_mixtape(client: tuple[TestClient, str, dict], app) -> None:
    test_client, token, user = client
    tracks = [
        {"track_position": 1, "track_text": "First", "spotify_uri": "spotify:track:track1"}
    ]
    # Create mixtape as user1
    resp = test_client.post("/api/mixtape", json=mixtape_payload(tracks), headers={"x-stack-access-token": token})
    assert_response_created(resp)
    public_id = resp.json()["public_id"]
    # Register a second user
    mock_auth = app.dependency_overrides[auth.get_stack_auth_backend]()
    user2 = {"id": "user456", "email": "other@example.com", "name": "Other User"}
    token2 = mock_auth.register_user(user2)
    # Try to edit as user2
    resp = test_client.put(f"/api/mixtape/{public_id}", json={"name": "Hacked", "intro_text": "Hacked!", "is_public": True, "tracks": tracks}, headers={"x-stack-access-token": token2})
    assert resp.status_code == 401
    # Try to edit as unauthenticated
    resp = test_client.put(f"/api/mixtape/{public_id}", json={"name": "Hacked", "intro_text": "Hacked!", "is_public": True, "tracks": tracks})
    assert resp.status_code == 401

def test_create_anonymous_mixtape(client: tuple[TestClient, str, dict]) -> None:
    test_client, token, _ = client
    tracks = [
        {"track_position": 1, "track_text": "First", "spotify_uri": "spotify:track:track1"}
    ]
    # Create anonymous mixtape (no auth header)
    resp = test_client.post("/api/mixtape", json=mixtape_payload(tracks))
    assert_response_created(resp)
    public_id = resp.json()["public_id"]
    # Verify it's viewable by anyone
    resp = test_client.get(f"/api/mixtape/{public_id}")
    assert_response_success(resp)
    data = resp.json()
    assert data["name"] == "Test Mixtape"
    assert data["is_public"] is True

def test_claim_anonymous_mixtape(client: tuple[TestClient, str, dict]) -> None:
    test_client, token, _ = client
    tracks = [
        {"track_position": 1, "track_text": "First", "spotify_uri": "spotify:track:track1"}
    ]
    # Create anonymous mixtape
    resp = test_client.post("/api/mixtape", json=mixtape_payload(tracks))
    assert_response_created(resp)
    public_id = resp.json()["public_id"]
    # Claim it
    resp = test_client.post(f"/api/mixtape/{public_id}/claim", headers={"x-stack-access-token": token})
    assert_response_success(resp)
    version = resp.json()["version"]
    assert version == 2
    # Verify it now appears in user's list
    resp = test_client.get("/api/mixtape", headers={"x-stack-access-token": token})
    assert_response_success(resp)
    data = resp.json()
    assert len(data) == 1
    assert data[0]["public_id"] == public_id

def test_cannot_claim_already_claimed_mixtape(client: tuple[TestClient, str, dict]) -> None:
    test_client, token, _ = client
    tracks = [
        {"track_position": 1, "track_text": "First", "spotify_uri": "spotify:track:track1"}
    ]
    # Create anonymous mixtape
    resp = test_client.post("/api/mixtape", json=mixtape_payload(tracks))
    assert_response_created(resp)
    public_id = resp.json()["public_id"]
    # Claim it
    resp = test_client.post(f"/api/mixtape/{public_id}/claim", headers={"x-stack-access-token": token})
    assert_response_success(resp)
    # Try to claim it again
    resp = test_client.post(f"/api/mixtape/{public_id}/claim", headers={"x-stack-access-token": token})
    assert resp.status_code == 400
    assert "already claimed" in resp.json()["detail"]

def test_edit_anonymous_mixtape(client: tuple[TestClient, str, dict]) -> None:
    test_client, token, _ = client
    tracks = [
        {"track_position": 1, "track_text": "First", "spotify_uri": "spotify:track:track1"}
    ]
    # Create anonymous mixtape
    resp = test_client.post("/api/mixtape", json=mixtape_payload(tracks))
    assert_response_created(resp)
    public_id = resp.json()["public_id"]
    # Edit it without authentication (should work for anonymous mixtapes)
    new_tracks = [
        {"track_position": 1, "track_text": "Modified", "spotify_uri": "spotify:track:track1"},
        {"track_position": 2, "track_text": "New", "spotify_uri": "spotify:track:track2"}
    ]
    resp = test_client.put(f"/api/mixtape/{public_id}", json={"name": "Modified Mixtape", "intro_text": "Modified!", "is_public": True, "tracks": new_tracks})
    assert_response_success(resp)
    version = resp.json()["version"]
    assert version == 2
    # Verify changes
    resp = test_client.get(f"/api/mixtape/{public_id}")
    assert_response_success(resp)
    data = resp.json()
    assert data["name"] == "Modified Mixtape"
    assert len(data["tracks"]) == 2

def test_anonymous_mixtapes_not_in_user_list(client: tuple[TestClient, str, dict]) -> None:
    test_client, token, _ = client
    tracks = [
        {"track_position": 1, "track_text": "First", "spotify_uri": "spotify:track:track1"}
    ]
    # Create anonymous mixtape
    resp = test_client.post("/api/mixtape", json=mixtape_payload(tracks))
    assert_response_created(resp)
    # Verify it doesn't appear in user's list
    resp = test_client.get("/api/mixtape", headers={"x-stack-access-token": token})
    assert_response_success(resp)
    data = resp.json()
    assert len(data) == 0

def test_claim_then_edit_restricted(client: tuple[TestClient, str, dict], app) -> None:
    test_client, token, user = client
    tracks = [
        {"track_position": 1, "track_text": "First", "spotify_uri": "spotify:track:track1"}
    ]
    # Create anonymous mixtape
    resp = test_client.post("/api/mixtape", json=mixtape_payload(tracks))
    assert_response_created(resp)
    public_id = resp.json()["public_id"]
    # Claim it
    resp = test_client.post(f"/api/mixtape/{public_id}/claim", headers={"x-stack-access-token": token})
    assert_response_success(resp)
    # Register a second user
    mock_auth = app.dependency_overrides[auth.get_stack_auth_backend]()
    user2 = {"id": "user456", "email": "other@example.com", "name": "Other User"}
    token2 = mock_auth.register_user(user2)
    # Try to edit as user2 (should fail)
    resp = test_client.put(f"/api/mixtape/{public_id}", json={"name": "Hacked", "intro_text": "Hacked!", "is_public": True, "tracks": tracks}, headers={"x-stack-access-token": token2})
    assert resp.status_code == 401
    # Try to edit as unauthenticated (should fail)
    resp = test_client.put(f"/api/mixtape/{public_id}", json={"name": "Hacked", "intro_text": "Hacked!", "is_public": True, "tracks": tracks})
    assert resp.status_code == 401

def test_anonymous_mixtape_must_be_public(client: tuple[TestClient, str, dict]) -> None:
    test_client, token, _ = client
    tracks = [
        {"track_position": 1, "track_text": "First", "spotify_uri": "spotify:track:track1"}
    ]
    # Try to create anonymous private mixtape (should fail)
    payload = {
        "name": "Test Mixtape",
        "intro_text": "Intro!",
        "is_public": False,  # This should cause the error
        "tracks": tracks
    }
    resp = test_client.post("/api/mixtape", json=payload)
    assert resp.status_code == 400
    assert "Anonymous mixtapes must be public" in resp.json()["detail"]
    # Verify anonymous public mixtape still works
    payload["is_public"] = True
    resp = test_client.post("/api/mixtape", json=payload)
    assert_response_created(resp)

def test_anonymous_mixtape_cannot_be_made_private_via_put(client: tuple[TestClient, str, dict]) -> None:
    test_client, token, _ = client
    tracks = [
        {"track_position": 1, "track_text": "First", "spotify_uri": "spotify:track:track1"}
    ]
    # Create anonymous mixtape
    resp = test_client.post("/api/mixtape", json=mixtape_payload(tracks))
    assert_response_created(resp)
    public_id = resp.json()["public_id"]
    # Try to make it private via PUT (should fail)
    payload = {
        "name": "Test Mixtape",
        "intro_text": "Intro!",
        "is_public": False,  # This should cause the error
        "tracks": tracks
    }
    resp = test_client.put(f"/api/mixtape/{public_id}", json=payload)
    assert resp.status_code == 400
    assert "Only claimed mixtapes can be made private; unclaimed mixtapes must remain public" in resp.json()["detail"]
    # Verify making it public still works
    payload["is_public"] = True
    resp = test_client.put(f"/api/mixtape/{public_id}", json=payload)
    assert_response_success(resp)

def test_concurrent_put_requests_processed_sequentially(client: tuple[TestClient, str, dict]) -> None:
    """Simulate two concurrent PUT requests and verify they are processed in order.

    We use the test pause mechanism in backend.service.mixtape to block the first request
    while it holds a row-level lock. The second request should wait until the
    first completes. After unblocking, we expect the second request's data to
    be the final state in the database and the mixtape version to increment
    sequentially.
    """
    import threading  # Local import to avoid affecting other tests
    import time

    from backend.routers import (
        mixtape as mixtape_router,
    )

    test_client, token, _ = client

    # Create initial mixtape
    create_tracks = [
        {"track_position": 1, "track_text": "First", "spotify_uri": "spotify:track:track1"}
    ]
    resp_create = test_client.post(
        "/api/mixtape",
        json={
            "name": "Initial Mixtape",
            "intro_text": "Intro",
            "is_public": True,
            "tracks": create_tracks,
        },
        headers={"x-stack-access-token": token},
    )
    assert_response_created(resp_create)
    public_id = resp_create.json()["public_id"]

    # Enable test pause mechanism before issuing PUT requests
    mixtape_router._TEST_PAUSE_EVENT = threading.Event()
    mixtape_router._TEST_PAUSE_ENABLED = True

    results: list[tuple[str, httpx.Response]] = []

    def send_update(name: str, track_text: str) -> None:  # noqa: D401 – simple verb
        update_tracks = [
            {"track_position": 1, "track_text": track_text, "spotify_uri": "spotify:track:track1"}
        ]
        resp = test_client.put(
            f"/api/mixtape/{public_id}",
            json={
                "name": name,
                "intro_text": "Intro",
                "is_public": True,
                "tracks": update_tracks,
            },
            headers={"x-stack-access-token": token},
        )
        results.append((name, resp))

    # Start first update thread (will acquire lock and then pause)
    t1 = threading.Thread(target=send_update, args=("FirstUpdate", "A"), daemon=True)
    t1.start()

    time.sleep(0.5)  # Give t1 time to reach the pause
    assert t1.is_alive(), "First update should be waiting due to test pause"

    # Start second update thread (should block on SELECT FOR UPDATE)
    t2 = threading.Thread(target=send_update, args=("SecondUpdate", "B"), daemon=True)
    t2.start()

    time.sleep(0.5)
    assert t2.is_alive(), "Second update should be blocked by row lock"

    # Unblock the first request, allowing both to finish sequentially
    mixtape_router._TEST_PAUSE_ENABLED = False
    assert mixtape_router._TEST_PAUSE_EVENT is not None  # mypy reassurance
    mixtape_router._TEST_PAUSE_EVENT.set()

    t1.join(timeout=5)
    t2.join(timeout=5)

    assert not t1.is_alive() and not t2.is_alive(), "Both updates should have completed"

    # Validate both responses were successful and the second update prevailed
    for _name, resp in results:
        assert_response_success(resp)

    versions = [resp.json().get("version") for _, resp in results]
    assert len(versions) == 2 and sorted(versions) == versions, "Versions should increment sequentially"

    # Final GET should reflect the second update
    resp_final = test_client.get(f"/api/mixtape/{public_id}", headers={"x-stack-access-token": token})
    assert_response_success(resp_final)
    data_final = resp_final.json()
    assert data_final["name"] == "SecondUpdate", "Latest update should win"

    # Clean up test pause globals to avoid side effects on other tests
    mixtape_router._TEST_PAUSE_EVENT = None
    mixtape_router._TEST_PAUSE_ENABLED = False

    # TODO: Once version history endpoint exists, assert that version 2 has
    #       name == "FirstUpdate" and version 3 has name == "SecondUpdate".

# --- UNDO/REDO TESTS ---

def test_undo_mixtape_basic(client: tuple[TestClient, str, dict]) -> None:
    """Test basic undo functionality."""
    test_client, token, _ = client

    # Create mixtape
    tracks = [
        {"track_position": 1, "track_text": "First", "spotify_uri": "spotify:track:track1"}
    ]
    resp = test_client.post("/api/mixtape", json=mixtape_payload(tracks), headers={"x-stack-access-token": token})
    assert_response_created(resp)
    public_id = resp.json()["public_id"]

    # Edit mixtape
    new_tracks = [
        {"track_position": 1, "track_text": "Modified", "spotify_uri": "spotify:track:track1"},
        {"track_position": 2, "track_text": "New", "spotify_uri": "spotify:track:track2"}
    ]
    resp = test_client.put(f"/api/mixtape/{public_id}", json={"name": "Modified Mixtape", "intro_text": "Modified!", "is_public": True, "tracks": new_tracks}, headers={"x-stack-access-token": token})
    assert_response_success(resp)

    # Undo should restore to original state
    resp = test_client.post(f"/api/mixtape/{public_id}/undo", headers={"x-stack-access-token": token})
    assert_response_success(resp)
    data = resp.json()

    assert data["name"] == "Test Mixtape"
    assert data["intro_text"] == "Intro!"
    assert len(data["tracks"]) == 1
    assert data["tracks"][0]["track_text"] == "First"
    assert data["can_undo"] is False  # Can't undo further
    assert data["can_redo"] is True   # Can redo

def test_redo_mixtape_basic(client: tuple[TestClient, str, dict]) -> None:
    """Test basic redo functionality."""
    test_client, token, _ = client

    # Create and edit mixtape
    tracks = [
        {"track_position": 1, "track_text": "First", "spotify_uri": "spotify:track:track1"}
    ]
    resp = test_client.post("/api/mixtape", json=mixtape_payload(tracks), headers={"x-stack-access-token": token})
    assert_response_created(resp)
    public_id = resp.json()["public_id"]

    new_tracks = [
        {"track_position": 1, "track_text": "Modified", "spotify_uri": "spotify:track:track1"}
    ]
    resp = test_client.put(f"/api/mixtape/{public_id}", json={"name": "Modified Mixtape", "intro_text": "Modified!", "is_public": True, "tracks": new_tracks}, headers={"x-stack-access-token": token})
    assert_response_success(resp)

    # Undo
    resp = test_client.post(f"/api/mixtape/{public_id}/undo", headers={"x-stack-access-token": token})
    assert_response_success(resp)

    # Redo should restore to modified state
    resp = test_client.post(f"/api/mixtape/{public_id}/redo", headers={"x-stack-access-token": token})
    assert_response_success(resp)
    data = resp.json()

    assert data["name"] == "Modified Mixtape"
    assert data["intro_text"] == "Modified!"
    assert len(data["tracks"]) == 1
    assert data["tracks"][0]["track_text"] == "Modified"
    assert data["can_undo"] is True   # Can undo again
    assert data["can_redo"] is False  # Can't redo further

def test_undo_redo_chain(client: tuple[TestClient, str, dict]) -> None:
    """Test a chain of undo/redo operations."""
    test_client, token, _ = client

    # Create mixtape
    tracks = [
        {"track_position": 1, "track_text": "First", "spotify_uri": "spotify:track:track1"}
    ]
    resp = test_client.post("/api/mixtape", json=mixtape_payload(tracks), headers={"x-stack-access-token": token})
    assert_response_created(resp)
    public_id = resp.json()["public_id"]

    # Edit 1: Add track
    new_tracks = [
        {"track_position": 1, "track_text": "First", "spotify_uri": "spotify:track:track1"},
        {"track_position": 2, "track_text": "Second", "spotify_uri": "spotify:track:track2"}
    ]
    resp = test_client.put(f"/api/mixtape/{public_id}", json={"name": "Two Tracks", "intro_text": "Two!", "is_public": True, "tracks": new_tracks}, headers={"x-stack-access-token": token})
    assert_response_success(resp)

    # Edit 2: Change name
    resp = test_client.put(f"/api/mixtape/{public_id}", json={"name": "Final Name", "intro_text": "Two!", "is_public": True, "tracks": new_tracks}, headers={"x-stack-access-token": token})
    assert_response_success(resp)

    # Undo 1: Should go back to "Two Tracks"
    resp = test_client.post(f"/api/mixtape/{public_id}/undo", headers={"x-stack-access-token": token})
    assert_response_success(resp)
    data = resp.json()
    assert data["name"] == "Two Tracks"
    assert data["can_undo"] is True
    assert data["can_redo"] is True

    # Undo 2: Should go back to "Test Mixtape"
    resp = test_client.post(f"/api/mixtape/{public_id}/undo", headers={"x-stack-access-token": token})
    assert_response_success(resp)
    data = resp.json()
    assert data["name"] == "Test Mixtape"
    assert data["can_undo"] is False
    assert data["can_redo"] is True

    # Redo 1: Should go to "Two Tracks"
    resp = test_client.post(f"/api/mixtape/{public_id}/redo", headers={"x-stack-access-token": token})
    assert_response_success(resp)
    data = resp.json()
    assert data["name"] == "Two Tracks"
    assert data["can_undo"] is True
    assert data["can_redo"] is True

    # Redo 2: Should go to "Final Name"
    resp = test_client.post(f"/api/mixtape/{public_id}/redo", headers={"x-stack-access-token": token})
    assert_response_success(resp)
    data = resp.json()
    assert data["name"] == "Final Name"
    assert data["can_undo"] is True
    assert data["can_redo"] is False

def test_edit_breaks_redo_chain(client: tuple[TestClient, str, dict]) -> None:
    """Test that editing after undo breaks the redo chain."""
    test_client, token, _ = client

    # Create and edit mixtape
    tracks = [
        {"track_position": 1, "track_text": "First", "spotify_uri": "spotify:track:track1"}
    ]
    resp = test_client.post("/api/mixtape", json=mixtape_payload(tracks), headers={"x-stack-access-token": token})
    assert_response_created(resp)
    public_id = resp.json()["public_id"]

    new_tracks = [
        {"track_position": 1, "track_text": "Modified", "spotify_uri": "spotify:track:track1"}
    ]
    resp = test_client.put(f"/api/mixtape/{public_id}", json={"name": "Modified Mixtape", "intro_text": "Modified!", "is_public": True, "tracks": new_tracks}, headers={"x-stack-access-token": token})
    assert_response_success(resp)

    # Undo
    resp = test_client.post(f"/api/mixtape/{public_id}/undo", headers={"x-stack-access-token": token})
    assert_response_success(resp)
    assert resp.json()["can_redo"] is True

    # Edit again - this should break the redo chain
    resp = test_client.put(f"/api/mixtape/{public_id}", json={"name": "New Edit", "intro_text": "New!", "is_public": True, "tracks": tracks}, headers={"x-stack-access-token": token})
    assert_response_success(resp)

    # Should not be able to redo anymore
    resp = test_client.get(f"/api/mixtape/{public_id}", headers={"x-stack-access-token": token})
    assert_response_success(resp)
    data = resp.json()
    assert data["can_redo"] is False
    assert data["can_undo"] is True

def test_cannot_undo_new_mixtape(client: tuple[TestClient, str, dict]) -> None:
    """Test that a newly created mixtape cannot be undone."""
    test_client, token, _ = client

    tracks = [
        {"track_position": 1, "track_text": "First", "spotify_uri": "spotify:track:track1"}
    ]
    resp = test_client.post("/api/mixtape", json=mixtape_payload(tracks), headers={"x-stack-access-token": token})
    assert_response_created(resp)
    public_id = resp.json()["public_id"]

    # Try to undo - should fail
    resp = test_client.post(f"/api/mixtape/{public_id}/undo", headers={"x-stack-access-token": token})
    assert resp.status_code == 400
    assert "Cannot undo: no previous version available" in resp.json()["detail"]

def test_cannot_redo_mixtape_without_undo(client: tuple[TestClient, str, dict]) -> None:
    """Test that a mixtape cannot be redone without first undoing."""
    test_client, token, _ = client

    tracks = [
        {"track_position": 1, "track_text": "First", "spotify_uri": "spotify:track:track1"}
    ]
    resp = test_client.post("/api/mixtape", json=mixtape_payload(tracks), headers={"x-stack-access-token": token})
    assert_response_created(resp)
    public_id = resp.json()["public_id"]

    # Try to redo - should fail
    resp = test_client.post(f"/api/mixtape/{public_id}/redo", headers={"x-stack-access-token": token})
    assert resp.status_code == 400
    assert "Cannot redo: no later version available" in resp.json()["detail"]

def test_undo_redo_anonymous_mixtape(client: tuple[TestClient, str, dict]) -> None:
    """Test undo/redo on anonymous mixtapes."""
    test_client, token, _ = client

    # Create anonymous mixtape
    tracks = [
        {"track_position": 1, "track_text": "First", "spotify_uri": "spotify:track:track1"}
    ]
    resp = test_client.post("/api/mixtape", json=mixtape_payload(tracks))
    assert_response_created(resp)
    public_id = resp.json()["public_id"]

    # Edit anonymous mixtape
    new_tracks = [
        {"track_position": 1, "track_text": "Modified", "spotify_uri": "spotify:track:track1"}
    ]
    resp = test_client.put(f"/api/mixtape/{public_id}", json={"name": "Modified Mixtape", "intro_text": "Modified!", "is_public": True, "tracks": new_tracks})
    assert_response_success(resp)

    # Undo should work
    resp = test_client.post(f"/api/mixtape/{public_id}/undo")
    assert_response_success(resp)
    data = resp.json()
    assert data["name"] == "Test Mixtape"
    assert data["can_redo"] is True

    # Redo should work
    resp = test_client.post(f"/api/mixtape/{public_id}/redo")
    assert_response_success(resp)
    data = resp.json()
    assert data["name"] == "Modified Mixtape"

def test_undo_redo_private_mixtape_requires_auth(client: tuple[TestClient, str, dict], app) -> None:
    """Test that undo/redo on private mixtapes requires authentication."""
    test_client, token, user = client

    # Create private mixtape
    tracks = [
        {"track_position": 1, "track_text": "First", "spotify_uri": "spotify:track:track1"}
    ]
    resp = test_client.post("/api/mixtape", json={"name": "Private Mixtape", "intro_text": "Private!", "is_public": False, "tracks": tracks}, headers={"x-stack-access-token": token})
    assert_response_created(resp)
    public_id = resp.json()["public_id"]

    # Edit to create undo history
    new_tracks = [
        {"track_position": 1, "track_text": "Modified", "spotify_uri": "spotify:track:track1"}
    ]
    resp = test_client.put(f"/api/mixtape/{public_id}", json={"name": "Modified Private", "intro_text": "Modified!", "is_public": False, "tracks": new_tracks}, headers={"x-stack-access-token": token})
    assert_response_success(resp)

    # Register a second user
    mock_auth = app.dependency_overrides[auth.get_stack_auth_backend]()
    user2 = {"id": "user456", "email": "other@example.com", "name": "Other User"}
    token2 = mock_auth.register_user(user2)

    # Try to undo as user2 - should fail
    resp = test_client.post(f"/api/mixtape/{public_id}/undo", headers={"x-stack-access-token": token2})
    assert resp.status_code == 401

    # Try to undo as unauthenticated - should fail
    resp = test_client.post(f"/api/mixtape/{public_id}/undo")
    assert resp.status_code == 401

    # Undo as owner should work
    resp = test_client.post(f"/api/mixtape/{public_id}/undo", headers={"x-stack-access-token": token})
    assert_response_success(resp)

def test_undo_redo_preserves_tracks(client: tuple[TestClient, str, dict]) -> None:
    """Test that undo/redo correctly restores track information."""
    test_client, token, _ = client

    # Create mixtape with tracks
    tracks = [
        {"track_position": 1, "track_text": "First Track", "spotify_uri": "spotify:track:track1"},
        {"track_position": 2, "track_text": "Second Track", "spotify_uri": "spotify:track:track2"}
    ]
    resp = test_client.post("/api/mixtape", json=mixtape_payload(tracks), headers={"x-stack-access-token": token})
    assert_response_created(resp)
    public_id = resp.json()["public_id"]

    # Edit tracks
    new_tracks = [
        {"track_position": 1, "track_text": "Modified First", "spotify_uri": "spotify:track:track1"},
        {"track_position": 3, "track_text": "New Third", "spotify_uri": "spotify:track:track3"}
    ]
    resp = test_client.put(f"/api/mixtape/{public_id}", json={"name": "Modified Mixtape", "intro_text": "Modified!", "is_public": True, "tracks": new_tracks}, headers={"x-stack-access-token": token})
    assert_response_success(resp)

    # Undo should restore original tracks
    resp = test_client.post(f"/api/mixtape/{public_id}/undo", headers={"x-stack-access-token": token})
    assert_response_success(resp)
    data = resp.json()

    assert len(data["tracks"]) == 2
    assert data["tracks"][0]["track_position"] == 1
    assert data["tracks"][0]["track_text"] == "First Track"
    assert data["tracks"][1]["track_position"] == 2
    assert data["tracks"][1]["track_text"] == "Second Track"

    # Verify track details are present
    for track in data["tracks"]:
        assert "track" in track
        assert track["track"]["id"] == f"{track['track']['uri'].replace('spotify:track:', '')}"

def test_undo_redo_concurrent_requests(client: tuple[TestClient, str, dict]) -> None:
    """Test that concurrent undo/redo requests are handled correctly."""
    import threading
    import time

    from backend.routers import mixtape as mixtape_router

    test_client, token, _ = client

    # Create and edit mixtape
    tracks = [
        {"track_position": 1, "track_text": "First", "spotify_uri": "spotify:track:track1"}
    ]
    resp = test_client.post("/api/mixtape", json=mixtape_payload(tracks), headers={"x-stack-access-token": token})
    assert_response_created(resp)
    public_id = resp.json()["public_id"]

    new_tracks = [
        {"track_position": 1, "track_text": "Modified", "spotify_uri": "spotify:track:track1"}
    ]
    resp = test_client.put(f"/api/mixtape/{public_id}", json={"name": "Modified Mixtape", "intro_text": "Modified!", "is_public": True, "tracks": new_tracks}, headers={"x-stack-access-token": token})
    assert_response_success(resp)

    # Enable test pause mechanism
    mixtape_router._TEST_PAUSE_EVENT = threading.Event()
    mixtape_router._TEST_PAUSE_ENABLED = True

    results: list[tuple[str, httpx.Response]] = []

    def send_undo() -> None:
        resp = test_client.post(f"/api/mixtape/{public_id}/undo", headers={"x-stack-access-token": token})
        results.append(("undo", resp))

    def send_redo() -> None:
        resp = test_client.post(f"/api/mixtape/{public_id}/redo", headers={"x-stack-access-token": token})
        results.append(("redo", resp))

    # Start undo thread (will acquire lock and then pause)
    t1 = threading.Thread(target=send_undo, daemon=True)
    t1.start()

    time.sleep(0.5)  # Give t1 time to reach the pause
    assert t1.is_alive(), "First undo should be waiting due to test pause"

    # Start redo thread (should block on SELECT FOR UPDATE)
    t2 = threading.Thread(target=send_redo, daemon=True)
    t2.start()

    time.sleep(0.5)
    assert t2.is_alive(), "Second redo should be blocked by row lock"

    # Unblock the first request
    mixtape_router._TEST_PAUSE_ENABLED = False
    assert mixtape_router._TEST_PAUSE_EVENT is not None
    mixtape_router._TEST_PAUSE_EVENT.set()

    t1.join(timeout=5)
    t2.join(timeout=5)

    assert not t1.is_alive() and not t2.is_alive(), "Both operations should have completed"

    # Validate responses
    for _name, resp in results:
        assert_response_success(resp)

    # Assert that the mixtape is back to the updated state.
    resp = test_client.get(f"/api/mixtape/{public_id}", headers={"x-stack-access-token": token})
    assert_response_success(resp)
    data = resp.json()
    assert data["name"] == "Modified Mixtape"
    assert data["intro_text"] == "Modified!"
    assert len(data["tracks"]) == 1
    assert data["tracks"][0]["track_text"] == "Modified"
    assert data["can_undo"] is True
    assert data["can_redo"] is False

    # Clean up test pause globals
    mixtape_router._TEST_PAUSE_EVENT = None
    mixtape_router._TEST_PAUSE_ENABLED = False
