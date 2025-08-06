import os

import requests


class StackAuthBackend:
    def __init__(self):
        self.project_id = os.environ["STACK_PROJECT_ID"]
        self.publishable_client_key = os.environ["STACK_PUBLISHABLE_CLIENT_KEY"]
        self.secret_server_key = os.environ["STACK_SECRET_SERVER_KEY"]

    def stack_auth_request(self, method, endpoint, **kwargs):
        res = requests.request(
            method,
            f'https://api.stack-auth.com{endpoint}',
            headers={
                'x-stack-access-type': 'server',
                'x-stack-project-id': self.project_id,
                'x-stack-publishable-client-key': self.publishable_client_key,
                'x-stack-secret-server-key': self.secret_server_key,
                **kwargs.pop('headers', {}),
            },
            **kwargs,
        )
        if res.status_code >= 400:
            raise Exception(f"Stack Auth API request failed with {res.status_code}: {res.text}")
        return res.json()

    def get_user_with_access_token(self, access_token):
        return self.stack_auth_request('GET', '/api/v1/users/me', headers={
            'x-stack-access-token': access_token,
        })

    def validate_access_token(self, access_token):
        try:
            user_info = self.get_user_with_access_token(access_token)
            return user_info is not None
        except Exception:
            return False

def get_stack_auth_backend():
    return StackAuthBackend()
