from fastapi import Depends, HTTPException, Request

from backend.client.stack_auth import AbstractStackAuthBackend, get_stack_auth_backend
from backend.auth_middleware.user_cache import get_cached_user_info

class AuthenticatedUser:
    """Wrapper class that provides authenticated request context"""
    # TODO: figure out the type of user_info or import it from a stack auth library, it should not just be a dict.
    def __init__(self, user_info: dict):
        self.user_info = user_info
        self.access_token = user_info["access_token"]

    def get_user_id(self)->str:
        """Get the user ID from Stack Auth user info"""
        # TODO: only one of these is correct; figure out which it is.
        return self.user_info.get("user_id") or self.user_info.get("id")

    def get_user_email(self)->str:
        """Get the user email from Stack Auth user info"""
        return self.user_info.get("email")

    def get_user_name(self)->str:
        """Get the user name from Stack Auth user info"""
        # TODO: should this fall back to email or no?
        return self.user_info.get("name") or self.user_info.get("email")


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
