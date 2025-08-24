import base64
import os
import threading
import time
from collections import OrderedDict
from typing import Any

import requests

from .client import (
    AbstractSpotifyClient,
    SpotifyTrack,
)

# TODO: move the cache into the abstract spotify client so that both real and mock use the cache?

class SpotifyClient(AbstractSpotifyClient):
    def __init__(self):
        self.client_id = os.environ["SPOTIFY_CLIENT_ID"]
        self.client_secret = os.environ["SPOTIFY_CLIENT_SECRET"]
        self.refresh_token = os.environ["SPOTIFY_REFRESH_TOKEN"]

        self._user_id: str | None = None

        # Cache for track look-ups to avoid repeated API calls during a single
        # request burst.
        self.track_cache_size = int(os.environ.get("SPOTIFY_TRACK_CACHE_SIZE", 500))
        self.track_cache = OrderedDict[str, SpotifyTrack]()  # track_id -> SpotifyTrack
        self._cache_lock = threading.Lock()
        self._token_lock = threading.Lock()
        self._access_token: str | None = None
        self._token_expiration: float = 0.0

    def _get_spotify_access_token(self) -> str:
        """
        Obtain a Spotify access token using Authorization Code flow.
        A long-lived refresh token (SPOTIFY_REFRESH_TOKEN) is exchanged for a short-lived
        access token which is cached in-memory until close to expiration.
        """

        with self._token_lock:
            # Reuse cached token if still valid (leave 60-second buffer)
            if self._access_token and time.time() < self._token_expiration - 60:
                return self._access_token

            url = "https://accounts.spotify.com/api/token"
            auth_string = f"{self.client_id}:{self.client_secret}"
            auth_bytes = auth_string.encode("utf-8")
            auth_b64 = str(base64.b64encode(auth_bytes), "utf-8")
            headers = {
                "Authorization": f"Basic {auth_b64}",
                "Content-Type": "application/x-www-form-urlencoded"
            }
            data = {
                "grant_type": "refresh_token",
                "refresh_token": self.refresh_token,
            }

            response = requests.post(url, headers=headers, data=data)
            if response.status_code == 200:
                payload = response.json()
                self._access_token = str(payload["access_token"])
                expires_in = int(payload.get("expires_in", 3600))
                self._token_expiration = time.time() + expires_in
                return self._access_token
            else:
                raise Exception(f"Failed to refresh Spotify access token: {response.text}")

    def _auth_headers(self)->dict[str, str]:
        return {"Authorization": f"Bearer {self._get_spotify_access_token()}"}

    def _spotify_api_request(self, method: str, endpoint: str, **kwargs)->Any:
        """Low-level HTTP helper (raises on non-2xx)."""
        headers = self._auth_headers()
        if "headers" in kwargs:
            headers.update(kwargs["headers"])
        kwargs["headers"] = headers
        url = f"https://api.spotify.com/v1{endpoint}"
        response = requests.request(method, url, **kwargs)
        if response.status_code >= 400:
            raise Exception(f"Spotify API error {response.status_code}: {response.text}")
        if response.status_code == 204:  # No content
            return None
        return response.json()

    # --- User info ---
    def _get_user_id(self)->str:
        if self._user_id is None:
            data = self._spotify_api_request("GET", "/me")
            self._user_id = data["id"]
        return self._user_id

    def search_tracks(self, query: str)->list[SpotifyTrack]:
        data = self._spotify_api_request("GET", f"/search", params={"q": query, "type": "track", "limit": 5})
        items = []
        # TODO: why do we check for both "tracks" and "items"? Should only need one.
        for item in data.get("tracks", {}).get("items", []):
            track = SpotifyTrack.from_dict(item)
            items.append(track)
        return items

    def get_track(self, track_id: str)->SpotifyTrack:
        with self._cache_lock:
            if track_id in self.track_cache:
                track: SpotifyTrack = self.track_cache.pop(track_id)
                self.track_cache[track_id] = track  # Mark as most recently used
                return track
        # Not in cache, fetch from API (do not hold lock during network call)
        # TODO: ensure we use a single flight so that we don't fetch the same track multiple times
        # from multiple threads. In golang there's a singleflight package we could use; this surely
        # exists in Python so we just need to find it.
        item = self._spotify_api_request("GET", f"/tracks/{track_id}")
        track = SpotifyTrack.from_dict(item)

        with self._cache_lock:
            self.track_cache[track_id] = track
            if len(self.track_cache) > self.track_cache_size:
                self.track_cache.popitem(last=False)  # Remove least recently used
        return track

    # --- Playlist methods ---
    def _playlist_id_from_uri(self, playlist_uri: str) -> str:
        return playlist_uri.split(":")[-1]

    def create_playlist(self, title: str, description: str, track_uris: list[str]) -> str:
        user_id = self._get_user_id()
        payload = {"name": title, "description": description, "public": True}
        data = self._spotify_api_request("POST", f"/users/{user_id}/playlists", json=payload)
        playlist_id = data["id"]

        if track_uris:
            self._spotify_api_request("PUT", f"/playlists/{playlist_id}/tracks", json={"uris": track_uris})

        return data["uri"]

    def update_playlist(self, playlist_uri: str, title: str, description: str, track_uris: list[str]) -> None:
        playlist_id = self._playlist_id_from_uri(playlist_uri)
        # Change details
        self._spotify_api_request("PUT", f"/playlists/{playlist_id}", json={"name": title, "description": description, "public": True})

        # Replace tracks (PUT replaces)
        self._spotify_api_request("PUT", f"/playlists/{playlist_id}/tracks", json={"uris": track_uris})

def get_spotify_client():
    return SpotifyClient()
