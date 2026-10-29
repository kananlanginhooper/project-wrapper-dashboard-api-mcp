from pydantic import BaseModel


class LoginConfig(BaseModel):
    enabled: bool
    issuer: str
    clientId: str


class AppConfig(BaseModel):
    """GET /api/config: the group-standard runtime config every app serves."""

    apiBase: str
    basePath: str
    publicUrl: str
    frameParents: list[str]
    login: LoginConfig
