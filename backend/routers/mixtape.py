from fastapi import APIRouter, Depends, HTTPException, status, Request, Query
from pydantic import BaseModel, Field, field_validator
from typing import List, Optional
from sqlmodel import Session
from backend.entity import MixtapeEntity
from backend.util.auth_middleware import get_current_user, get_optional_user
from backend.routers.spotify import TrackDetails  # Import TrackDetails
from backend.client.spotify import get_spotify_client, SpotifyClient

router = APIRouter()

# POST /mixtape: Create a new mixtape (with tracks)
# GET /mixtape/{public_id}: Retrieve a mixtape (with tracks)
# PUT /mixtape/{public_id}: Update a mixtape (with tracks)

class MixtapeTrackRequest(BaseModel):
    track_position: int = Field(..., gt=0, description="Unique position of the track within the mixtape (1-based index)")
    track_text: Optional[str] = Field(None, description="Optional text to display next to the track")
    spotify_uri: str = Field(..., min_length=1, max_length=255, description="Spotify URI of the track")

class MixtapeTrackResponse(BaseModel):
    track_position: int
    track_text: Optional[str]
    track: TrackDetails

class MixtapeRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, description="Human-readable name of the mixtape")
    intro_text: Optional[str] = Field(None, description="Optional intro text")
    is_public: bool = Field(False, description="Whether the mixtape is public")
    tracks: List[MixtapeTrackRequest] = Field(..., description="List of tracks in the mixtape")

    @field_validator('tracks')
    @classmethod
    def unique_track_positions(cls, v):
        positions = [t.track_position for t in v]
        if len(positions) != len(set(positions)):
            raise ValueError('Track positions must be unique within a mixtape')
        return v

class MixtapeResponse(BaseModel):
    public_id: str
    name: str
    intro_text: Optional[str]
    is_public: bool
    create_time: str
    last_modified_time: str
    stack_auth_user_id: Optional[str]
    tracks: List[MixtapeTrackResponse]

@router.post("/", response_model=dict, status_code=201)
def create_mixtape(request: MixtapeRequest, request_obj: Request, user_info: dict = Depends(get_optional_user), spotify_client: SpotifyClient = Depends(get_spotify_client)):
    # Validate and enrich tracks
    enriched_tracks = []
    for track in request.tracks:
        try:
            # Look up TrackDetails
            track_id = track.spotify_uri.replace('spotify:track:', '')
            details = spotify_client.get_track(track_id)
            if not details:
                raise Exception("Track not found")
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid Spotify URI or failed lookup: {track.spotify_uri}")
        enriched_tracks.append({
            "track_position": track.track_position,
            "track_text": track.track_text,
            "spotify_uri": track.spotify_uri
        })
    # Get database session from app state
    session = next(request_obj.app.state.get_db_dep())
    stack_auth_user_id = (user_info or {}).get('user_id') or (user_info or {}).get('id')
    # Anonymous mixtapes must be public
    if user_info is None and not request.is_public:
        raise HTTPException(status_code=400, detail="Anonymous mixtapes must be public")
    # For anonymous mixtapes, stack_auth_user_id will be None
    try:
        public_id = MixtapeEntity.create_in_db(session, stack_auth_user_id, request.name, request.intro_text, request.is_public, enriched_tracks)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"public_id": public_id}

@router.post("/{public_id}/claim", response_model=dict)
def claim_mixtape(public_id: str, request_obj: Request, user_info: dict = Depends(get_current_user)):
    """Claim an anonymous mixtape, making the authenticated user the owner."""
    session = next(request_obj.app.state.get_db_dep())
    stack_auth_user_id = user_info.get('user_id') or user_info.get('id')
    if not stack_auth_user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        new_version = MixtapeEntity.claim_mixtape(session, public_id, stack_auth_user_id)
    except ValueError as e:
        if "not found" in str(e).lower():
            raise HTTPException(status_code=404, detail="Mixtape not found")
        elif "already claimed" in str(e).lower():
            raise HTTPException(status_code=400, detail="Mixtape is already claimed")
        else:
            raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"version": new_version}

@router.get("/", response_model=List[dict])
def list_my_mixtapes(
    request_obj: Request,
    user_info: dict = Depends(get_current_user),
    q: Optional[str] = Query(None, description="Search mixtape titles (partial match)"),
    limit: int = Query(20, ge=1, le=100, description="Max results to return"),
    offset: int = Query(0, ge=0, description="Results offset for pagination"),
):
    session = next(request_obj.app.state.get_db_dep())
    stack_auth_user_id = user_info.get('user_id') or user_info.get('id')
    if not stack_auth_user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    mixtapes = MixtapeEntity.list_mixtapes_for_user(session, stack_auth_user_id, q=q, limit=limit, offset=offset)
    return mixtapes

@router.get("/{public_id}", response_model=MixtapeResponse)
def get_mixtape(public_id: str, request_obj: Request, user_info: dict = Depends(get_optional_user), spotify_client: SpotifyClient = Depends(get_spotify_client)):
    # Get database session from app state
    session = next(request_obj.app.state.get_db_dep())
    try:
        mixtape = MixtapeEntity.load_by_public_id(session, public_id, include_owner=True)
    except ValueError:
        raise HTTPException(status_code=404, detail="Mixtape not found")
    # If not public, require authentication and ownership
    if not mixtape["is_public"]:
        stack_auth_user_id = (user_info or {}).get('user_id') or (user_info or {}).get('id')
        if not stack_auth_user_id or stack_auth_user_id != mixtape["stack_auth_user_id"]:
            raise HTTPException(status_code=401, detail="Not authorized to view this mixtape")
    # Enrich tracks with TrackDetails
    enriched_tracks = []
    for track in mixtape["tracks"]:
        try:
            track_id = track["spotify_uri"].replace('spotify:track:', '')
            details = spotify_client.get_track(track_id)
            if not details:
                raise Exception("Track not found")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to fetch track details for {track['spotify_uri']}")
        enriched_tracks.append({
            "track_position": track["track_position"],
            "track_text": track.get("track_text"),
            "track": details.to_dict() if hasattr(details, 'to_dict') else details
        })
    mixtape["tracks"] = enriched_tracks
    return mixtape

@router.put("/{public_id}", response_model=dict)
def update_mixtape(public_id: str, request: MixtapeRequest, request_obj: Request, user_info: dict = Depends(get_optional_user), spotify_client: SpotifyClient = Depends(get_spotify_client)):
    # Validate and enrich tracks
    enriched_tracks = []
    for track in request.tracks:
        try:
            # Look up TrackDetails
            track_id = track.spotify_uri.replace('spotify:track:', '')
            details = spotify_client.get_track(track_id)
            if not details:
                raise Exception("Track not found")
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid Spotify URI or failed lookup: {track.spotify_uri}")
        enriched_tracks.append({
            "track_position": track.track_position,
            "track_text": track.track_text,
            "spotify_uri": track.spotify_uri
        })
    # Get database session from app state
    session = next(request_obj.app.state.get_db_dep())
    # Check ownership
    try:
        mixtape = MixtapeEntity.load_by_public_id(session, public_id, include_owner=True)
    except ValueError:
        raise HTTPException(status_code=404, detail="Mixtape not found")
    # Anonymous mixtapes cannot be made private
    if mixtape["stack_auth_user_id"] is None and not request.is_public:
        raise HTTPException(status_code=400, detail="Anonymous mixtapes must remain public")
    # For anonymous mixtapes (stack_auth_user_id is None), anyone can edit
    if mixtape["stack_auth_user_id"] is not None:
        # For owned mixtapes, require authentication and ownership
        stack_auth_user_id = (user_info or {}).get('user_id') or (user_info or {}).get('id')
        if not stack_auth_user_id:
            raise HTTPException(status_code=401, detail="Not authenticated")
        if stack_auth_user_id != mixtape["stack_auth_user_id"]:
            raise HTTPException(status_code=401, detail="Not authorized to edit this mixtape")
    try:
        new_version = MixtapeEntity.update_in_db(session, public_id, request.name, request.intro_text, request.is_public, enriched_tracks)
    except ValueError:
        raise HTTPException(status_code=404, detail="Mixtape not found")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"version": new_version} 