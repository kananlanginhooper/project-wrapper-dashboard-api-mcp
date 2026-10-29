"""Home dashboards: serves the Angular shell, GET /api/config and GET /api/tabs. (An MCP endpoint is planned.)"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request

from app.api.routes import config, health, tabs, ui
from app.core.config import get_settings
from app.db import session as db

log = logging.getLogger("home-dashboards")


@asynccontextmanager
async def lifespan(app: FastAPI):
    if get_settings().use_db:
        try:
            db.migrate()  # schema changes run from one place: here, at start
        except Exception as e:
            log.error("tab table migration failed: %s", e)
    yield


def create_app() -> FastAPI:
    app = FastAPI(title="Home dashboards", version="1.0.0", docs_url=None, redoc_url=None, lifespan=lifespan)

    @app.middleware("http")
    async def frame_policy(request: Request, call_next):
        response = await call_next(request)
        ancestors = " ".join(["'self'", *get_settings().frame_ancestor_list])
        response.headers.setdefault("Content-Security-Policy", f"frame-ancestors {ancestors}")
        return response

    app.include_router(config.router)
    app.include_router(tabs.router)
    app.include_router(health.router)
    app.include_router(ui.router)  # last: its catch-all serves the UI
    return app


app = create_app()
