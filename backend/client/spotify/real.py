import base64
import os
import threading
from collections import OrderedDict

import requests

from .client import (
    AbstractSpotifyClient,
    SpotifyAlbum,
    SpotifyAlbumImage,
    SpotifyArtist,
    SpotifySearchResult,
    SpotifyTrack,
)


class SpotifyClient(AbstractSpotifyClient):
    def __init__(self):
        self.client_id = os.environ["SPOTIFY_CLIENT_ID"]
        self.client_secret = os.environ["SPOTIFY_CLIENT_SECRET"]
        self.track_cache_size = int(os.environ.get("SPOTIFY_TRACK_CACHE_SIZE", 500))
        self.track_cache = OrderedDict()  # track_id -> SpotifyTrack
        self._cache_lock = threading.Lock()

    def get_spotify_access_token(self):
        auth_string = f"{self.client_id}:{self.client_secret}"
        auth_bytes = auth_string.encode("utf-8")
        auth_b64 = str(base64.b64encode(auth_bytes), "utf-8")
        url = "https://accounts.spotify.com/api/token"
        headers = {
            "Authorization": f"Basic {auth_b64}",
            "Content-Type": "application/x-www-form-urlencoded"
        }
        data = {"grant_type": "client_credentials"}
        response = requests.post(url, headers=headers, data=data)
        if response.status_code == 200:
            return response.json()["access_token"]
        else:
            raise Exception("Failed to get Spotify access token")

    def spotify_api_request(self, endpoint: str, **kwargs):
        access_token = self.get_spotify_access_token()
        headers = {"Authorization": f"Bearer {access_token}"}
        if "headers" in kwargs:
            headers.update(kwargs["headers"])
        kwargs["headers"] = headers
        response = requests.get(f"https://api.spotify.com/v1{endpoint}", **kwargs)
        if response.status_code != 200:
            raise Exception(f"Spotify API error: {response.text}")
        return response.json()

    def search_tracks(self, query: str):
        data = self.spotify_api_request(f"/search?q={query}&type=track&limit=5")
        items = []
        for item in data.get("tracks", {}).get("items", []):
            track = SpotifyTrack(
                id=item["id"],
                name=item["name"],
                artists=[SpotifyArtist(name=a["name"]) for a in item.get("artists", [])],
                album=SpotifyAlbum(
                    name=item["album"]["name"],
                    images=[SpotifyAlbumImage(url=img["url"], width=img["width"], height=img["height"]) for img in item["album"].get("images", [])]
                ),
                uri=item["uri"]
            )
            items.append(track)
        return {"tracks": SpotifySearchResult(items)}

    def get_track(self, track_id: str):
        with self._cache_lock:
            if track_id in self.track_cache:
                track = self.track_cache.pop(track_id)
                self.track_cache[track_id] = track  # Mark as most recently used
                return track
        # Not in cache, fetch from API (do not hold lock during network call)
        item = self.spotify_api_request(f"/tracks/{track_id}")
        track = SpotifyTrack(
            id=item["id"],
            name=item["name"],
            artists=[SpotifyArtist(name=a["name"]) for a in item.get("artists", [])],
            album=SpotifyAlbum(
                name=item["album"]["name"],
                images=[SpotifyAlbumImage(url=img["url"], width=img["width"], height=img["height"]) for img in item["album"].get("images", [])]
            ),
            uri=item["uri"]
        )
        with self._cache_lock:
            self.track_cache[track_id] = track
            if len(self.track_cache) > self.track_cache_size:
                self.track_cache.popitem(last=False)  # Remove least recently used
        return track

    # --- Playlist helpers ---
    def create_playlist(self, title: str, description: str, track_uris: list[str]):
        """Create a new playlist for a configured user and populate it with tracks.

        Environment variables required:
        * SPOTIFY_PLAYLIST_OAUTH_TOKEN – OAuth token with playlist-modify-public/private scopes.
        * SPOTIFY_PLAYLIST_USER_ID    – Spotify user id that will own the playlist.
        """

        oauth_token = os.environ.get("SPOTIFY_PLAYLIST_OAUTH_TOKEN")
        user_id = os.environ.get("SPOTIFY_PLAYLIST_USER_ID")
        if not oauth_token or not user_id:
            raise Exception("Missing SPOTIFY_PLAYLIST_OAUTH_TOKEN or SPOTIFY_PLAYLIST_USER_ID env vars")

        headers = {
            "Authorization": f"Bearer {oauth_token}",
            "Content-Type": "application/json",
        }

        payload = {
            "name": title,
            "description": description or "",
            "public": True,
        }

        resp = requests.post(
            f"https://api.spotify.com/v1/users/{user_id}/playlists", json=payload, headers=headers
        )
        if resp.status_code not in (200, 201):
            raise Exception(f"Failed to create playlist: {resp.text}")

        playlist_data = resp.json()
        playlist_id = playlist_data["id"]
        playlist_uri = playlist_data["uri"]

        # Populate tracks (replace – tracks list expected to be small)
        if track_uris:
            resp2 = requests.put(
                f"https://api.spotify.com/v1/playlists/{playlist_id}/tracks",
                json={"uris": track_uris},
                headers=headers,
            )
            if resp2.status_code not in (200, 201):
                raise Exception(f"Failed to add tracks to playlist: {resp2.text}")

        return playlist_uri

    def update_playlist(self, playlist_uri: str, title: str, description: str, track_uris: list[str]):
        oauth_token = os.environ.get("SPOTIFY_PLAYLIST_OAUTH_TOKEN")
        if not oauth_token:
            raise Exception("Missing SPOTIFY_PLAYLIST_OAUTH_TOKEN env var")

        headers = {
            "Authorization": f"Bearer {oauth_token}",
            "Content-Type": "application/json",
        }

        # Extract playlist id from URI (spotify:playlist:ID)
        parts = playlist_uri.split(":")
        if len(parts) != 3 or parts[1] != "playlist":
            raise ValueError("Invalid playlist URI")
        playlist_id = parts[2]

        # Update metadata
        payload_meta = {"name": title, "description": description or ""}
        resp = requests.put(
            f"https://api.spotify.com/v1/playlists/{playlist_id}",
            json=payload_meta,
            headers=headers,
        )
        if resp.status_code not in (200, 201):
            raise Exception(f"Failed to update playlist details: {resp.text}")

        # Replace tracks
        resp2 = requests.put(
            f"https://api.spotify.com/v1/playlists/{playlist_id}/tracks",
            json={"uris": track_uris},
            headers=headers,
        )
        if resp2.status_code not in (200, 201):
            raise Exception(f"Failed to update playlist tracks: {resp2.text}")

        return playlist_uri

def get_spotify_client():
    return SpotifyClient()
