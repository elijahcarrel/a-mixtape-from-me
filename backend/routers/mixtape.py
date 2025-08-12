
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import BaseModel, Field, field_validator

from backend.client.spotify import SpotifyClient, get_spotify_client
from backend.entity import MixtapeEntity
from backend.routers.spotify import TrackDetails  # Import TrackDetails
from backend.util.auth_middleware import get_current_user, get_optional_user

router = APIRouter()

# POST /mixtape: Create a new mixtape (with tracks)
# GET /mixtape/{public_id}: Retrieve a mixtape (with tracks)
# PUT /mixtape/{public_id}: Update a mixtape (with tracks)

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
    spotify_playlist_uri: str | None = Field(None, description="Spotify playlist URI associated with this mixtape (if any)")
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
    spotify_playlist_uri: str | None
    create_time: str
    last_modified_time: str
    stack_auth_user_id: str | None
    tracks: list[MixtapeTrackResponse]

@router.post("", response_model=dict, status_code=201)
def create_mixtape(request: MixtapeRequest, request_obj: Request, user_info: dict | None = Depends(get_optional_user), spotify_client: SpotifyClient = Depends(get_spotify_client)):
    # Validate and enrich tracks
    enriched_tracks = []
    for track in request.tracks:
        try:
            # Look up TrackDetails
            track_id = track.spotify_uri.replace('spotify:track:', '')
            details = spotify_client.get_track(track_id)
            if not details:
                raise Exception("Track not found")
        except Exception:
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
        public_id = MixtapeEntity.create_in_db(session, stack_auth_user_id, request.name, request.intro_text, request.subtitle1, request.subtitle2, request.subtitle3, request.is_public, enriched_tracks)
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

@router.get("", response_model=list[dict])
def list_my_mixtapes(
    request_obj: Request,
    user_info: dict = Depends(get_current_user),
    q: str | None = Query(None, description="Search mixtape titles (partial match)"),
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
def get_mixtape(public_id: str, request_obj: Request, user_info: dict | None = Depends(get_optional_user), spotify_client: SpotifyClient = Depends(get_spotify_client)):
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
        except Exception:
            raise HTTPException(status_code=500, detail=f"Failed to fetch track details for {track['spotify_uri']}")
        enriched_tracks.append({
            "track_position": track["track_position"],
            "track_text": track.get("track_text"),
            "track": details.to_dict() if hasattr(details, 'to_dict') else details
        })
    mixtape["tracks"] = enriched_tracks
    return mixtape

# --- Spotify export endpoint ---

@router.post("/{public_id}/spotify-export", response_model=MixtapeResponse)
def export_mixtape_to_spotify(
    public_id: str,
    request_obj: Request,
    user_info: dict | None = Depends(get_optional_user),
    spotify_client: SpotifyClient = Depends(get_spotify_client),
):
    """Create or update a Spotify playlist representing this mixtape and return the mixtape data."""
    # DB session
    session = next(request_obj.app.state.get_db_dep())

    # Load mixtape with ownership info
    try:
        mixtape = MixtapeEntity.load_by_public_id(session, public_id, include_owner=True)
    except ValueError:
        raise HTTPException(status_code=404, detail="Mixtape not found")

    # Ownership / permissions: same as update_mixtape
    if mixtape["stack_auth_user_id"] is not None:
        stack_auth_user_id = (user_info or {}).get("user_id") or (user_info or {}).get("id")
        if not stack_auth_user_id or stack_auth_user_id != mixtape["stack_auth_user_id"]:
            raise HTTPException(status_code=401, detail="Not authorized to export this mixtape")

    title = mixtape["name"]
    subtitle_parts = [mixtape.get("subtitle1"), mixtape.get("subtitle2"), mixtape.get("subtitle3"), mixtape.get("intro_text")]
    description = " | ".join([part for part in subtitle_parts if part])
    # Sort track URIs by position
    track_uris = [t["spotify_uri"] for t in sorted(mixtape["tracks"], key=lambda x: x["track_position"])]

    playlist_uri: str | None = mixtape.get("spotify_playlist_uri")
    try:
        if playlist_uri:
            playlist_uri = spotify_client.update_playlist(playlist_uri, title, description, track_uris)
        else:
            playlist_uri = spotify_client.create_playlist(title, description, track_uris)
    except NotImplementedError:
        raise HTTPException(status_code=500, detail="Spotify playlist functionality not implemented in server")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    # Persist playlist URI if newly created
    if mixtape.get("spotify_playlist_uri") != playlist_uri:
        from backend.db_models import Mixtape, MixtapeAudit  # Local import to avoid cycles
        from datetime import UTC, datetime
        from sqlmodel import select

        now = datetime.now(UTC)
        stmt = select(Mixtape).where(Mixtape.public_id == public_id)
        mixtape_row = session.exec(stmt).first()
        if mixtape_row is None:
            raise HTTPException(status_code=404, detail="Mixtape not found")
        mixtape_row.spotify_playlist_uri = playlist_uri
        mixtape_row.last_modified_time = now
        mixtape_row.version += 1

        # Audit record
        audit = MixtapeAudit(
            mixtape_id=mixtape_row.id,
            public_id=public_id,
            name=mixtape_row.name,
            intro_text=mixtape_row.intro_text,
            subtitle1=mixtape_row.subtitle1,
            subtitle2=mixtape_row.subtitle2,
            subtitle3=mixtape_row.subtitle3,
            spotify_playlist_uri=playlist_uri,
            is_public=mixtape_row.is_public,
            create_time=mixtape_row.create_time,
            last_modified_time=now,
            version=mixtape_row.version,
            stack_auth_user_id=mixtape_row.stack_auth_user_id,
        )
        session.add(audit)
        session.commit()

        mixtape["spotify_playlist_uri"] = playlist_uri

    return mixtape

@router.put("/{public_id}", response_model=dict)
def update_mixtape(public_id: str, request: MixtapeRequest, request_obj: Request, user_info: dict | None = Depends(get_optional_user), spotify_client: SpotifyClient = Depends(get_spotify_client)):
    # Validate and enrich tracks
    enriched_tracks = []
    for track in request.tracks:
        try:
            # Look up TrackDetails
            track_id = track.spotify_uri.replace('spotify:track:', '')
            details = spotify_client.get_track(track_id)
            if not details:
                raise Exception("Track not found")
        except Exception:
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
        new_version = MixtapeEntity.update_in_db(session, public_id, request.name, request.intro_text, request.subtitle1, request.subtitle2, request.subtitle3, request.is_public, enriched_tracks)
    except ValueError:
        raise HTTPException(status_code=404, detail="Mixtape not found")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"version": new_version}
