import random
import string


class MockStackAuthBackend:
    def __init__(self):
        self.token_to_user = {}

    def _generate_token(self):
        return ''.join(random.choices(string.ascii_letters + string.digits, k=32))

    def register_user(self, user_info):
        token = self._generate_token()
        self.token_to_user[token] = user_info
        return token

    def get_user_with_access_token(self, access_token):
        if access_token in self.token_to_user:
            return self.token_to_user[access_token]
        raise Exception("Invalid access token")

    def validate_access_token(self, access_token):
        return access_token in self.token_to_user

def get_mock_stack_auth_backend():
    return MockStackAuthBackend()
