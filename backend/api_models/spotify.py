from pydantic import BaseModel


class TrackArtist(BaseModel):
    name: str

class TrackAlbumImage(BaseModel):
    url: str
    width: int
    height: int

class TrackAlbum(BaseModel):
    name: str
    images: list[TrackAlbumImage]

class TrackDetails(BaseModel):
    id: str
    name: str
    artists: list[TrackArtist]
    album: TrackAlbum
    uri: str
