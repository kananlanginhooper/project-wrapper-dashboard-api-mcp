from fastapi import APIRouter

from app.core.config import get_settings
from app.schemas.config import AppConfig, LoginConfig

router = APIRouter(tags=["config"])


@router.get("/api/config", response_model=AppConfig, summary="Runtime config for the UI")
def app_config() -> AppConfig:
    s = get_settings()
    return AppConfig(
        apiBase=s.base_path + "api/",
        basePath=s.base_path,
        publicUrl=s.public_url.rstrip("/"),
        frameParents=s.frame_ancestor_list,
        login=LoginConfig(enabled=s.login_enabled, issuer=s.oidc_issuer, clientId=s.oidc_client_id),
    )
