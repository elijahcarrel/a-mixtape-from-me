from typing import List, Dict, Any
from abc import ABC, abstractmethod

class SpotifyArtist:
    def __init__(self, name: str):
        self.name = name

    def to_dict(self) -> Dict[str, Any]:
        return {"name": self.name}

class SpotifyAlbumImage:
    def __init__(self, url: str, width: int, height: int):
        self.url = url
        self.width = width
        self.height = height

    def to_dict(self) -> Dict[str, Any]:
        return {"url": self.url, "width": self.width, "height": self.height}

class SpotifyAlbum:
    def __init__(self, name: str, images: List[SpotifyAlbumImage]):
        self.name = name
        self.images = images

    def to_dict(self) -> Dict[str, Any]:
        return {
            "name": self.name,
            "images": [img.to_dict() for img in self.images]
        }

class SpotifyTrack:
    def __init__(self, id: str, name: str, artists: List[SpotifyArtist], album: SpotifyAlbum, uri: str):
        self.id = id
        self.name = name
        self.artists = artists
        self.album = album
        self.uri = uri

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "artists": [artist.to_dict() for artist in self.artists],
            "album": self.album.to_dict(),
            "uri": self.uri
        }

class SpotifySearchResult:
    def __init__(self, items: List[SpotifyTrack]):
        self.items = items

    def to_dict(self) -> Dict[str, Any]:
        return {"items": [track.to_dict() for track in self.items]}

class AbstractSpotifyClient(ABC):
    @abstractmethod
    def search_tracks(self, query: str) -> Dict[str, SpotifySearchResult]:
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