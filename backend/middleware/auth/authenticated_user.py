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

