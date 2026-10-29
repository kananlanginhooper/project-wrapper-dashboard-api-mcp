from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(tags=["health"])


class Health(BaseModel):
    ok: bool


@router.get("/healthz", response_model=Health, summary="Liveness for the container health check")
def healthz() -> Health:
    return Health(ok=True)
