
from fastapi import APIRouter, Depends, HTTPException

from backend.apimodel.spotify import TrackDetails
from backend.client.spotify import SpotifyClient, get_spotify_client
from backend.util.auth_middleware import get_optional_user

router = APIRouter()

@router.get("/search", response_model=list[TrackDetails])
def search_tracks(query: str, user_info: dict | None = Depends(get_optional_user), spotify_client: SpotifyClient = Depends(get_spotify_client)):
    """Search for tracks using service account credentials"""
    try:
        results = spotify_client.search_tracks(query)
        # results is now {"tracks": SpotifySearchResult}, so flatten to a list of dicts
        return [t.to_dict() for t in results["tracks"].items]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to search tracks: {str(e)}")

@router.get("/track/{track_id}", response_model=TrackDetails)
def get_track(track_id: str, user_info: dict | None = Depends(get_optional_user), spotify_client: SpotifyClient = Depends(get_spotify_client)):
    """Get track details using service account credentials"""
    try:
        track = spotify_client.get_track(track_id)
        return track.to_dict()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch track: {str(e)}")
