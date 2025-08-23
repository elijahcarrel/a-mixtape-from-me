import threading
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import selectinload
from sqlmodel import Session, delete

from backend.api_models.mixtape import (
    MixtapeOverview,
    MixtapeRequest,
    MixtapeResponse,
    MixtapeTrackRequest,
    MixtapeTrackResponse,
)
from backend.client.spotify import SpotifyClient, get_spotify_client
from backend.convert_client_api_models.track import (
    spotify_track_to_mixtape_track_details,
)
from backend.db_models.mixtape import Mixtape, MixtapeTrack
from backend.middleware.auth.authenticated_user import AuthenticatedUser
from backend.middleware.auth.dependency_helpers import get_optional_user, get_user
from backend.middleware.db_conn.dependency_helpers import (
    get_readonly_session,
    get_write_session,
)
from backend.query.mixtape import MixtapeQuery

router = APIRouter()

# POST /mixtape: Create a new mixtape (with tracks)
# GET /mixtape/{public_id}: Retrieve a mixtape (with tracks)
# PUT /mixtape/{public_id}: Update a mixtape (with tracks)

def parse_track(track: MixtapeTrackRequest, spotify_client: SpotifyClient)->MixtapeTrack:
    # Look up TrackDetails just to verify track is valid.
    track_id = track.spotify_uri.replace('spotify:track:', '')
    details = spotify_client.get_track(track_id)
    if not details:
        raise HTTPException(status_code=400, detail=f"Invalid Spotify URI or failed lookup for track with position {track.track_position}: {track.spotify_uri}")
    return MixtapeTrack(
        track_position=track.track_position,
        track_text=track.track_text,
        spotify_uri=track.spotify_uri,
    )



@router.post("", response_model=dict, status_code=201)
def create_mixtape(
    request: MixtapeRequest,
    session: Session = Depends(get_write_session),
    authenticated_user: AuthenticatedUser | None = Depends(get_optional_user),
    spotify_client: SpotifyClient = Depends(get_spotify_client),
):
    # Anonymous mixtapes must be public
    if authenticated_user is None and not request.is_public:
        raise HTTPException(status_code=400, detail="Anonymous mixtapes must be public")

    # For anonymous mixtapes, stack_auth_user_id will be None
    stack_auth_user_id = authenticated_user.get_user_id() if authenticated_user else None

    # Validate and enrich tracks
    tracks = [parse_track(track, spotify_client) for track in request.tracks]

    # Generate a public ID
    public_id=str(uuid4())

    mixtape = Mixtape(
        stack_auth_user_id=stack_auth_user_id,
        public_id=public_id,
        name=request.name,
        intro_text=request.intro_text,
        subtitle1=request.subtitle1,
        subtitle2=request.subtitle2,
        subtitle3=request.subtitle3,
        is_public=request.is_public,
        tracks=tracks,
    )

    mixtape.finalize()
    session.add(mixtape) # add root object if not already present.
    session.commit()

    return {"public_id": public_id}

@router.post("/{public_id}/claim", response_model=dict)
def claim_mixtape(
    public_id: str,
    session: Session = Depends(get_write_session),
    authenticated_user: AuthenticatedUser = Depends(get_user),
):
    """Claim an anonymous mixtape, making the authenticated user the owner."""
    stack_auth_user_id = authenticated_user.get_user_id()

    mixtape_query = MixtapeQuery(
        session=session,
        options=[selectinload(Mixtape.tracks)], # type: ignore[arg-type]
        for_update=True,
    )
    mixtape = mixtape_query.load_by_public_id(public_id)

    if mixtape is None:
        raise HTTPException(status_code=404, detail="Mixtape not found")

    if mixtape.stack_auth_user_id is not None:
        raise HTTPException(status_code=400, detail="Mixtape is already claimed")

    mixtape.stack_auth_user_id = stack_auth_user_id

    mixtape.finalize()
    session.add(mixtape) # add root object if not already present.
    session.commit()

    return {"version": mixtape.version}

@router.get("", response_model=list[MixtapeOverview])
def list_my_mixtapes(
    session: Session = Depends(get_readonly_session),
    authenticated_user: AuthenticatedUser = Depends(get_user),
    q: str | None = Query(None, description="Search mixtape titles (partial match)"),
    limit: int = Query(20, ge=1, le=100, description="Max results to return"),
    offset: int = Query(0, ge=0, description="Results offset for pagination"),
):
    stack_auth_user_id = authenticated_user.get_user_id()

    mixtape_query = MixtapeQuery(session=session, for_update=False, options=[])
    mixtapes = mixtape_query.list_mixtapes_for_user(stack_auth_user_id, q=q, limit=limit, offset=offset)
    return [
        MixtapeOverview(
            public_id=m.public_id,
            name=m.name,
            last_modified_time=m.last_modified_time.isoformat(),
        )
        for m in mixtapes
    ]

def load_mixtape_api_models_from_dbmodel(spotify_client: SpotifyClient, mixtape: Mixtape)->MixtapeResponse:
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
    mixtape_query = MixtapeQuery(session=session, for_update=False, options=[])
    mixtape = mixtape_query.load_by_public_id(public_id)
    # If mixtape not found, return 404.
    if mixtape is None:
        raise HTTPException(status_code=404, detail="Mixtape not found")

    # If mixtape not public, require authentication and ownership.
    if not mixtape.is_public:
        stack_auth_user_id = authenticated_user.get_user_id() if authenticated_user else None
        if not stack_auth_user_id or stack_auth_user_id != mixtape.stack_auth_user_id:
            raise HTTPException(status_code=401, detail="Not authorized to view this mixtape")

    return load_mixtape_api_models_from_dbmodel(spotify_client, mixtape)

@router.put("/{public_id}", response_model=dict)
def update_mixtape(
    public_id: str,
    request: MixtapeRequest,
    session: Session = Depends(get_write_session),
    authenticated_user: AuthenticatedUser | None = Depends(get_optional_user),
    spotify_client: SpotifyClient = Depends(get_spotify_client),
):

    mixtape_query = MixtapeQuery(
        session=session,
        options=[selectinload(Mixtape.tracks)], # type: ignore[arg-type]
        for_update=True,
    )
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

    # Wipe existing tracks so we can insert new ones.
    # TODO: we should be able to use sa_relationship_kwargs={"cascade": "all, delete-orphan"}
    # to accomplish this instead. For now, this will do.
    session.exec(
        delete(MixtapeTrack).where(MixtapeTrack.mixtape_id == mixtape.id)
    )

    # Validate and enrich tracks
    tracks = [parse_track(track, spotify_client) for track in request.tracks]

    mixtape.name=request.name
    mixtape.intro_text=request.intro_text
    mixtape.subtitle1=request.subtitle1
    mixtape.subtitle2=request.subtitle2
    mixtape.subtitle3=request.subtitle3
    mixtape.is_public=request.is_public
    mixtape.tracks=tracks

    mixtape.finalize()
    session.add(mixtape) # add root object if not already present.

    # Pause before releasing the lock for deterministic concurrency tests.
    _maybe_pause_for_tests()

    session.commit()

    return {"version": mixtape.version}

# --- TESTING CONCURRENCY SUPPORT ---
# These globals are used ONLY during tests to deterministically pause execution
# in the middle of an update/claim operation while holding a row-level lock.
# They have *no effect* in normal operation because _TEST_PAUSE_ENABLED is False
# by default and production code never toggles it.
_TEST_PAUSE_ENABLED: bool = False
_TEST_PAUSE_EVENT: threading.Event | None = None


def _maybe_pause_for_tests() -> None:
    """Block execution if the test pause flag/event is enabled.

    This allows tests to hold the row-level lock acquired by SELECT FOR UPDATE
    while another concurrent request attempts to obtain the lock. In production
    the function is a no-op.
    """
    global _TEST_PAUSE_ENABLED, _TEST_PAUSE_EVENT
    if _TEST_PAUSE_ENABLED and _TEST_PAUSE_EVENT is not None:
        # Wait until the event is set by the test to resume execution.
        _TEST_PAUSE_EVENT.wait()
