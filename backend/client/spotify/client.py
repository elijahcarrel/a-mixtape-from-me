from abc import ABC, abstractmethod
from typing import Any


class SpotifyArtist:
    def __init__(self, name: str):
        self.name = name

    def to_dict(self) -> dict[str, Any]:
        return {"name": self.name}

class SpotifyAlbumImage:
    def __init__(self, url: str, width: int, height: int):
        self.url = url
        self.width = width
        self.height = height

    def to_dict(self) -> dict[str, Any]:
        return {"url": self.url, "width": self.width, "height": self.height}

class SpotifyAlbum:
    def __init__(self, name: str, images: list[SpotifyAlbumImage]):
        self.name = name
        self.images = images

    def to_dict(self) -> dict[str, Any]:
        return {
            "name": self.name,
            "images": [img.to_dict() for img in self.images]
        }

class SpotifyTrack:
    def __init__(self, id: str, name: str, artists: list[SpotifyArtist], album: SpotifyAlbum, uri: str):
        self.id = id
        self.name = name
        self.artists = artists
        self.album = album
        self.uri = uri

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "artists": [artist.to_dict() for artist in self.artists],
            "album": self.album.to_dict(),
            "uri": self.uri
        }

    @classmethod
    def from_dict(cls, raw_track: dict[str, Any])->"SpotifyTrack":
        return cls(
            id=raw_track["id"],
            name=raw_track["name"],
            artists=[SpotifyArtist(name=a["name"]) for a in raw_track.get("artists", [])],
            album=SpotifyAlbum(
                name=raw_track["album"]["name"],
                images=[SpotifyAlbumImage(url=img["url"], width=img["width"], height=img["height"]) for img in raw_track["album"].get("images", [])]
            ),
            uri=raw_track["uri"]
        )

class AbstractSpotifyClient(ABC):
    @abstractmethod
    def search_tracks(self, query: str) -> list[SpotifyTrack]:
        """
        Returns a dictionary with a single key 'tracks' mapping to a SpotifySearchResult.
        Example: { 'tracks': SpotifySearchResult([...]) }
        """
        pass

    @abstractmethod
    def get_track(self, track_id: str) -> SpotifyTrack:
        """
        Returns a SpotifyTrack object for the given track_id.
        """
        pass

    # --- New for playlist export ---
    @abstractmethod
    def create_playlist(self, title: str, description: str, track_uris: list[str]) -> str:
        """Create a new playlist with the given metadata and tracks. Returns playlist Spotify URI."""

    @abstractmethod
    def update_playlist(self, playlist_uri: str, title: str, description: str, track_uris: list[str]) -> None:
        """Update existing playlist metadata and replace tracks atomically."""
