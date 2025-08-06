from fastapi import HTTPException, Request

from backend.util.cache import get_cached_user_info


class AuthenticatedRequest:
    """Wrapper class that provides authenticated request context"""
    def __init__(self, request: Request, user_info: dict):
        self.request = request
        self.user_info = user_info
        self.access_token = user_info["access_token"]

    def get_user_id(self):
        """Get the user ID from Stack Auth user info"""
        return self.user_info.get("id")

    def get_user_email(self):
        """Get the user email from Stack Auth user info"""
        return self.user_info.get("email")

    def get_user_name(self):
        """Get the user name from Stack Auth user info"""
        return self.user_info.get("name") or self.user_info.get("email")

async def authenticate_account_request(request: Request):
    """
    Middleware function that authenticates all account requests.
    Returns an AuthenticatedRequest object with user info and access token.
    """
    # Get access token from Stack Auth header
    access_token = request.headers.get("x-stack-access-token")

    if not access_token:
        raise HTTPException(status_code=401, detail="No access token provided")

    # Get user info from cache (with automatic validation if needed)
    user_info = get_cached_user_info(access_token)

    if not user_info:
        raise HTTPException(status_code=401, detail="Invalid or expired access token")

    return AuthenticatedRequest(request, user_info)
