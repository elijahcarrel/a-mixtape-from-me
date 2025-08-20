
from fastapi import APIRouter, Depends, HTTPException

from backend.apimodel.spotify import TrackDetails
from backend.client.spotify import SpotifyClient, get_spotify_client
from backend.convert_client_apimodel.track import spotify_track_to_mixtape_track_details
from backend.middleware.auth.dependency_helpers import get_optional_user

router = APIRouter()

@router.get("/search", response_model=list[TrackDetails])
def search_tracks(query: str, user_info: dict | None = Depends(get_optional_user), spotify_client: SpotifyClient = Depends(get_spotify_client)):
    """Search for tracks using service account credentials"""
    try:
        results = spotify_client.search_tracks(query)
        return [spotify_track_to_mixtape_track_details(t) for t in results]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to search tracks: {str(e)}")

@router.get("/track/{track_id}", response_model=TrackDetails)
def get_track(track_id: str, user_info: dict | None = Depends(get_optional_user), spotify_client: SpotifyClient = Depends(get_spotify_client)):
    """Get track details using service account credentials"""
    try:
        track = spotify_client.get_track(track_id)
        return spotify_track_to_mixtape_track_details(track)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch track: {str(e)}")
