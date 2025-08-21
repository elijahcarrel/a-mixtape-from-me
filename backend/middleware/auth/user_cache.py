import hashlib
import time
from typing import Any

from backend.client.stack_auth import AbstractStackAuthBackend

# In-memory cache - can be easily replaced with Redis later
# TODO: make user_cache a type rather than just using dict[str, Any]
user_cache: dict[str, dict[str, Any]] = {}


def hash_token(token: str) -> str:
    """Create a hash of the access token for use as cache key"""
    return hashlib.sha256(token.encode()).hexdigest()

# TODO: make user_info a type rather than just using dict[str, Any]
def get_cached_user_info(access_token: str, stack_auth: AbstractStackAuthBackend) -> dict[str, Any] | None:
    """
    Get user info from cache, validating token if needed, using the provided stack_auth backend.
    Returns None if token is invalid.
    """
    token_hash = hash_token(access_token)

    if token_hash not in user_cache:
        # Try to get user info from Stack Auth
        try:
            user_info = stack_auth.get_user_with_access_token(access_token)
            if user_info and isinstance(user_info, dict):
                # Cache the user info
                user_cache[token_hash] = {
                    "access_token": access_token,
                    "user_info": user_info,
                    "cached_at": time.time()
                }
                user_info["access_token"] = access_token
                return user_info
        except Exception:
            return None

    cache_entry = user_cache[token_hash]

    # Validate the token is still valid (optional - you can remove this if you want to trust cached data)
    if not stack_auth.validate_access_token(access_token):
        # Remove invalid token from cache
        del user_cache[token_hash]
        return None

    # Return user info with the current access token
    user_info = cache_entry["user_info"].copy()
    user_info["access_token"] = cache_entry["access_token"]
    return user_info  # type: ignore[no-any-return]

def cache_user_info(access_token: str, user_info: dict[str, Any]):
    """Cache user information for a given access token"""
    token_hash = hash_token(access_token)
    user_cache[token_hash] = {
        "access_token": access_token,
        "user_info": user_info,
        "cached_at": time.time()
    }

def remove_cached_user(access_token: str):
    """Remove user from cache (e.g., on logout)"""
    token_hash = hash_token(access_token)
    if token_hash in user_cache:
        del user_cache[token_hash]
