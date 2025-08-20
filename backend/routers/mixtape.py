from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session

from backend.apimodel.mixtape import MixtapeOverview, MixtapeRequest, MixtapeResponse, MixtapeTrackResponse
from backend.client.spotify import SpotifyClient, get_spotify_client
from backend.convert_client_apimodel.track import spotify_track_to_mixtape_track_details
from backend.db_conn.dependency_helpers import get_readonly_session, get_write_session
from backend.db_models import Mixtape
from backend.entity.mixtape import MixtapeEntity
from backend.query.mixtape import MixtapeQuery
from backend.auth_middleware.auth_middleware import AuthenticatedUser, get_user, get_optional_user

router = APIRouter()

# POST /mixtape: Create a new mixtape (with tracks)
# GET /mixtape/{public_id}: Retrieve a mixtape (with tracks)
# PUT /mixtape/{public_id}: Update a mixtape (with tracks)

@router.post("", response_model=dict, status_code=201)
def create_mixtape(
    request: MixtapeRequest,
    session: Session = Depends(get_write_session),
    authenticated_user: AuthenticatedUser | None = Depends(get_optional_user),
    spotify_client: SpotifyClient = Depends(get_spotify_client),
):
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
    
    # Anonymous mixtapes must be public
    if authenticated_user is None and not request.is_public:
        raise HTTPException(status_code=400, detail="Anonymous mixtapes must be public")

    # For anonymous mixtapes, stack_auth_user_id will be None
    stack_auth_user_id = authenticated_user.get_user_id() if authenticated_user else None
    try:
        public_id = MixtapeEntity.create_in_db(session, stack_auth_user_id, request.name, request.intro_text, request.subtitle1, request.subtitle2, request.subtitle3, request.is_public, enriched_tracks)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"public_id": public_id}

@router.post("/{public_id}/claim", response_model=dict)
def claim_mixtape(
    public_id: str,
    session: Session = Depends(get_write_session),
    authenticated_user: AuthenticatedUser = Depends(get_user),
):
    """Claim an anonymous mixtape, making the authenticated user the owner."""
    stack_auth_user_id = authenticated_user.get_user_id()

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

@router.get("", response_model=list[MixtapeOverview])
def list_my_mixtapes(
    session: Session = Depends(get_readonly_session),
    authenticated_user: AuthenticatedUser = Depends(get_user),
    q: str | None = Query(None, description="Search mixtape titles (partial match)"),
    limit: int = Query(20, ge=1, le=100, description="Max results to return"),
    offset: int = Query(0, ge=0, description="Results offset for pagination"),
):
    stack_auth_user_id = authenticated_user.get_user_id()

    mixtape_query = MixtapeQuery(session=session, for_update=False)
    mixtapes = mixtape_query.list_mixtapes_for_user(stack_auth_user_id, q=q, limit=limit, offset=offset)
    return [
        MixtapeOverview(
            public_id=m.public_id, 
            name=m.name, 
            last_modified_time=m.last_modified_time.isoformat(),
        )
        for m in mixtapes
    ]

def load_mixtape_apimodel_from_dbmodel(spotify_client: SpotifyClient, mixtape: Mixtape)->MixtapeResponse:
    # Enrich tracks with TrackDetails
    enriched_tracks: list[MixtapeTrackResponse] = []
    for track in mixtape.tracks:
        try:
            track_id = track.spotify_uri.replace('spotify:track:', '')
            details = spotify_client.get_track(track_id)
            if not details:
                raise Exception("Track not found")
        except Exception:
            raise HTTPException(status_code=500, detail=f"Failed to fetch track details for {track.spotify_uri}")
        enriched_tracks.append(
            MixtapeTrackResponse(
                track_position=track.track_position,
                track_text=track.track_text,
                track=spotify_track_to_mixtape_track_details(details)
            )
        )

    return MixtapeResponse(
        public_id=mixtape.public_id,
        name=mixtape.name,
        intro_text=mixtape.intro_text,
        subtitle1=mixtape.subtitle1,
        subtitle2=mixtape.subtitle2,
        subtitle3=mixtape.subtitle3,
        is_public=mixtape.is_public,
        create_time=mixtape.create_time.isoformat(),
        last_modified_time=mixtape.last_modified_time.isoformat(),
        stack_auth_user_id=mixtape.stack_auth_user_id,
        tracks=enriched_tracks,
    )


@router.get("/{public_id}", response_model=MixtapeResponse)
def get_mixtape(
    public_id: str,
    session: Session = Depends(get_readonly_session),
    authenticated_user: AuthenticatedUser | None = Depends(get_optional_user),
    spotify_client: SpotifyClient = Depends(get_spotify_client),
):
    mixtape_query = MixtapeQuery(session=session, for_update=False)
    mixtape = mixtape_query.load_by_public_id(public_id)
    # If mixtape not found, return 404.
    if mixtape is None:
        raise HTTPException(status_code=404, detail="Mixtape not found")

    # If mixtape not public, require authentication and ownership.
    if not mixtape.is_public:
        stack_auth_user_id = authenticated_user.get_user_id() if authenticated_user else None
        if not stack_auth_user_id or stack_auth_user_id != mixtape.stack_auth_user_id:
            raise HTTPException(status_code=401, detail="Not authorized to view this mixtape")

    return load_mixtape_apimodel_from_dbmodel(spotify_client, mixtape)

@router.put("/{public_id}", response_model=dict)
def update_mixtape(
    public_id: str,
    request: MixtapeRequest,
    session: Session = Depends(get_write_session),
    authenticated_user: AuthenticatedUser | None = Depends(get_optional_user),
    spotify_client: SpotifyClient = Depends(get_spotify_client),
):
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

    mixtape_query = MixtapeQuery(session=session, for_update=True)
    mixtape = mixtape_query.load_by_public_id(public_id)

    if mixtape is None:
        raise HTTPException(status_code=404, detail="Mixtape not found")
    
    # Check ownership.
    if mixtape.stack_auth_user_id is not None:
        # For owned mixtapes, require authentication and ownership
        if authenticated_user is None:
            raise HTTPException(status_code=401, detail="Not authenticated")
        if authenticated_user.get_user_id() != mixtape.stack_auth_user_id:
            raise HTTPException(status_code=401, detail="Not authorized to edit this mixtape")

    # Anonymous mixtapes cannot be made private
    if mixtape.stack_auth_user_id is None and not request.is_public:
        raise HTTPException(status_code=400, detail="Only claimed mixtapes can be made private; unclaimed mixtapes must remain public")

    # For anonymous mixtapes (stack_auth_user_id is None), anyone can edit
    try:
        new_version = MixtapeEntity.update_in_db(session, public_id, request.name, request.intro_text, request.subtitle1, request.subtitle2, request.subtitle3, request.is_public, enriched_tracks)
    except ValueError:
        raise HTTPException(status_code=404, detail="Mixtape not found")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"version": new_version}
