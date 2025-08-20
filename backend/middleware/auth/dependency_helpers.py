from fastapi import Depends, HTTPException, Request

from backend.client.stack_auth import AbstractStackAuthBackend, get_stack_auth_backend
from backend.middleware.auth.authenticated_user import AuthenticatedUser
from backend.middleware.auth.user_cache import get_cached_user_info

async def get_user(request: Request, stack_auth: AbstractStackAuthBackend = Depends(get_stack_auth_backend))->AuthenticatedUser:
    """
    Middleware function that extracts the access token from headers and returns the current user.
    Can be used as a dependency in FastAPI endpoints.
    """
    # Get access token from Stack Auth header
    access_token = request.headers.get("x-stack-access-token")

    if not access_token:
        raise HTTPException(status_code=401, detail="No access token provided")

    # Get user info from cache (with automatic validation if needed)
    user_info = get_cached_user_info(access_token, stack_auth)

    if user_info is None:
        raise HTTPException(status_code=401, detail="Invalid or expired access token")

    return AuthenticatedUser(user_info)

async def get_optional_user(request: Request, stack_auth: AbstractStackAuthBackend = Depends(get_stack_auth_backend))->AuthenticatedUser | None:
    """
    Like get_user, but returns None if no access token is provided.
    If a token is provided but invalid, raises 401.
    """
    access_token = request.headers.get("x-stack-access-token")
    if not access_token:
        return None

    user_info = get_cached_user_info(access_token, stack_auth)
    if user_info is None:
        raise HTTPException(status_code=401, detail="Invalid or expired access token")

    return AuthenticatedUser(user_info)
