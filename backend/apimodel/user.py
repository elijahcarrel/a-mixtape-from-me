from pydantic import BaseModel, Field

class Me(BaseModel):
    id: str = Field(..., description="Stack Auth User ID")
    email: str = Field(..., description="Email")
    name: str = Field(..., description="Name")
    # TODO: add types for user_info. Also verify that we're not leaking sensitive information back to the client
    user_info: dict = Field(..., description="User info.")
