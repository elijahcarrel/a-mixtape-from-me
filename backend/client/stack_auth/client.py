from abc import ABC, abstractmethod
from typing import Any


class AbstractStackAuthBackend(ABC):
    @abstractmethod
    def get_user_with_access_token(self, access_token: str) -> dict[str, Any] | None:
        """
        Get user information using an access token.
        Returns user info dict if valid, None if invalid.
        """
        pass

    @abstractmethod
    def validate_access_token(self, access_token: str) -> bool:
        """
        Validate if an access token is valid.
        Returns True if valid, False otherwise.
        """
        pass
