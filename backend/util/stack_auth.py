import requests
import os

STACK_PROJECT_ID = os.environ["STACK_PROJECT_ID"]
STACK_PUBLISHABLE_CLIENT_KEY = os.environ["STACK_PUBLISHABLE_CLIENT_KEY"]
STACK_SECRET_SERVER_KEY = os.environ["STACK_SECRET_SERVER_KEY"]

def stack_auth_request(method, endpoint, **kwargs):
    """Make a request to Stack Auth API"""
    res = requests.request(
        method,
        f'https://api.stack-auth.com{endpoint}',
        headers={
            'x-stack-access-type': 'server',
            'x-stack-project-id': STACK_PROJECT_ID,
            'x-stack-publishable-client-key': STACK_PUBLISHABLE_CLIENT_KEY,
            'x-stack-secret-server-key': STACK_SECRET_SERVER_KEY,
            **kwargs.pop('headers', {}),
        },
        **kwargs,
    )
    if res.status_code >= 400:
        raise Exception(f"Stack Auth API request failed with {res.status_code}: {res.text}")
    return res.json()

def get_user_with_access_token(access_token):
    """Get user info using Stack Auth access token"""
    return stack_auth_request('GET', '/api/v1/users/me', headers={
        'x-stack-access-token': access_token,
    })

def validate_access_token(access_token):
    """Validate if an access token is valid by attempting to get user info"""
    try:
        user_info = get_user_with_access_token(access_token)
        return user_info is not None
    except Exception:
        return False