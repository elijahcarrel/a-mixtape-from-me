from pydantic import BaseModel, Field, field_validator

from backend.api_models.spotify import TrackDetails


class MixtapeTrackRequest(BaseModel):
    track_position: int = Field(..., gt=0, description="Unique position of the track within the mixtape (1-based index)")
    track_text: str | None = Field(None, description="Optional text to display next to the track")
    spotify_uri: str = Field(..., min_length=1, max_length=255, description="Spotify URI of the track")

class MixtapeTrackResponse(BaseModel):
    track_position: int = Field(..., gt=0, description="Unique position of the track within the mixtape (1-based index)")
    track_text: str | None = Field(None, description="Optional text to display next to the track")
    track: TrackDetails = Field(..., description="Details about the track, such as name, artist, and Spotify URI.")

class MixtapeRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, description="Human-readable name of the mixtape")
    intro_text: str | None = Field(None, description="Optional intro text")
    subtitle1: str | None = Field(None, max_length=60, description="First subtitle line (max 60 characters)")
    subtitle2: str | None = Field(None, max_length=60, description="Second subtitle line (max 60 characters)")
    subtitle3: str | None = Field(None, max_length=60, description="Third subtitle line (max 60 characters)")
    is_public: bool = Field(False, description="Whether the mixtape is public")
    tracks: list[MixtapeTrackRequest] = Field(..., description="List of tracks in the mixtape")

    @field_validator('tracks')
    @classmethod
    def unique_track_positions(cls, v):
        positions = [t.track_position for t in v]
        if len(positions) != len(set(positions)):
            raise ValueError('Track positions must be unique within a mixtape')
        return v

    @field_validator('subtitle1', 'subtitle2', 'subtitle3')
    @classmethod
    def strip_newlines(cls, v):
        if v is not None:
            return v.replace('\n', ' ').replace('\r', ' ')
        return v

class MixtapeResponse(BaseModel):
    public_id: str
    name: str
    intro_text: str | None
    subtitle1: str | None
    subtitle2: str | None
    subtitle3: str | None
    is_public: bool
    create_time: str
    last_modified_time: str
    stack_auth_user_id: str | None
    tracks: list[MixtapeTrackResponse]
    can_undo: bool = Field(description="Whether this mixtape can be undone")
    can_redo: bool = Field(description="Whether this mixtape can be redone")

class MixtapeOverview(BaseModel):
    public_id: str
    name: str
    last_modified_time: str

