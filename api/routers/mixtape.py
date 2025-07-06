from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field, field_validator
from typing import List, Optional
from api.database import get_db
from api.entity import MixtapeEntity
import psycopg2

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
    name: str = Field(..., min_length=1, max_length=255, description="Human-readable name of the playlist")
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

# Placeholder for user extraction (to be replaced with real auth)
def get_current_user_id():
    return None  # Return None for anonymous, or user_id for authenticated

@router.post("/", response_model=dict, status_code=201)
def create_mixtape(request: MixtapeRequest, db_conn=Depends(get_db)):
    user_id = get_current_user_id()  # Replace with real user extraction
    try:
        public_id = MixtapeEntity.create_in_db(db_conn, user_id, request.name, request.intro_text, request.is_public, [track.dict() for track in request.tracks])
    except psycopg2.Error as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"public_id": public_id}

@router.get("/{public_id}", response_model=MixtapeResponse)
def get_mixtape(public_id: str, db_conn=Depends(get_db)):
    try:
        mixtape = MixtapeEntity.load_by_public_id(db_conn, public_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Mixtape not found")
    return mixtape

@router.put("/{public_id}", response_model=dict)
def update_mixtape(public_id: str, request: MixtapeRequest, db_conn=Depends(get_db)):
    try:
        new_version = MixtapeEntity.update_in_db(db_conn, public_id, request.name, request.intro_text, request.is_public, [track.dict() for track in request.tracks])
    except ValueError:
        raise HTTPException(status_code=404, detail="Mixtape not found")
    except psycopg2.Error as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"version": new_version} 