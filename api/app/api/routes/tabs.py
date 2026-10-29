from fastapi import APIRouter, Response

from app.schemas.tabs import TabList
from app.services import tabs

router = APIRouter(tags=["tabs"])


@router.get("/api/tabs", response_model=TabList, summary="The dashboards to show, in nav order")
def list_tabs(response: Response) -> TabList:
    response.headers["Cache-Control"] = "no-store"
    return tabs.list_tabs()
