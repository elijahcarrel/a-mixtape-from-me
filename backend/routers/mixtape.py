from fastapi import APIRouter, Depends, HTTPException, status, Request, Query
from pydantic import BaseModel, Field, field_validator
from typing import List, Optional
from sqlmodel import Session
from backend.entity import MixtapeEntity
from backend.util.auth_middleware import get_current_user

router = APIRouter()

# POST /mixtape: Create a new mixtape (with tracks)
# GET /mixtape/{public_id}: Retrieve a mixtape (with tracks)
# PUT /mixtape/{public_id}: Update a mixtape (with tracks)

# Endpoints will be implemented after db_models and entity layers are in place.

class Track(BaseModel):
    track_position: int = Field(..., gt=0, description="Unique position of the track within the mixtape (1-based index)")
    track_text: Optional[str] = Field(None, description="Optional text to display next to the track")
    spotify_uri: str = Field(..., min_length=1, max_length=255, description="Spotify URI of the track")

class MixtapeRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, description="Human-readable name of the mixtape")
    intro_text: Optional[str] = Field(None, description="Optional intro text")
    is_public: bool = Field(False, description="Whether the mixtape is public")
    tracks: List[Track] = Field(..., description="List of tracks in the mixtape")

    @field_validator('tracks')
    @classmethod
    def unique_track_positions(cls, v):
        positions = [t.track_position for t in v]
        if len(positions) != len(set(positions)):
            raise ValueError('Track positions must be unique within a mixtape')
        return v

class TrackResponse(Track):
    pass

class MixtapeResponse(BaseModel):
    public_id: str
    name: str
    intro_text: Optional[str]
    is_public: bool
    create_time: str
    last_modified_time: str
    tracks: List[TrackResponse]

@router.post("/", response_model=dict, status_code=201)
def create_mixtape(request: MixtapeRequest, request_obj: Request, user_info: dict = Depends(get_current_user)):
    # Get database session from app state
    session = next(request_obj.app.state.get_db_dep())
    stack_auth_user_id = user_info.get('user_id') or user_info.get('id')
    if not stack_auth_user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        public_id = MixtapeEntity.create_in_db(session, stack_auth_user_id, request.name, request.intro_text, request.is_public, [track.model_dump() for track in request.tracks])
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"public_id": public_id}

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
def get_mixtape(public_id: str, request_obj: Request, user_info: dict = Depends(get_current_user)):
    # Get database session from app state
    session = next(request_obj.app.state.get_db_dep())
    try:
        mixtape = MixtapeEntity.load_by_public_id(session, public_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Mixtape not found")
    return mixtape

@router.put("/{public_id}", response_model=dict)
def update_mixtape(public_id: str, request: MixtapeRequest, request_obj: Request, user_info: dict = Depends(get_current_user)):
    # Get database session from app state
    session = next(request_obj.app.state.get_db_dep())
    try:
        new_version = MixtapeEntity.update_in_db(session, public_id, request.name, request.intro_text, request.is_public, [track.model_dump() for track in request.tracks])
    except ValueError:
        raise HTTPException(status_code=404, detail="Mixtape not found")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"version": new_version} 