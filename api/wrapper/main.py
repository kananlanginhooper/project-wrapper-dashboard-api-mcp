"""Home dashboards: serves the Angular shell, GET /api/config and GET /api/tabs. (An MCP endpoint is planned.)"""
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.responses import FileResponse, HTMLResponse, JSONResponse, Response

from . import db, settings, tabs


@asynccontextmanager
async def lifespan(app):
    if db.enabled():
        try:
            db.migrate()   # schema changes run from one place: here, at start
        except Exception as e:
            print(f"tab table migration failed: {e}", flush=True)
    yield


app = FastAPI(title="Home dashboards", docs_url=None, redoc_url=None, openapi_url=None, lifespan=lifespan)
UI = Path(settings.UI_DIR).resolve()
HASHED = (".js", ".css")


@app.middleware("http")
async def frame_policy(request: Request, call_next):
    response = await call_next(request)
    response.headers.setdefault("Content-Security-Policy", "frame-ancestors " + " ".join(["'self'", *settings.FRAME_ANCESTORS]))
    return response


@app.get("/api/config")
def config():
    return {
        "apiBase": settings.UI_BASE_PATH + "api/",
        "basePath": settings.UI_BASE_PATH,
        "publicUrl": settings.PUBLIC_URL,
        "frameParents": settings.FRAME_ANCESTORS,
        "login": {"enabled": settings.LOGIN, "issuer": settings.OIDC_ISSUER, "clientId": settings.OIDC_CLIENT_ID},
    }


@app.get("/api/tabs")
def list_tabs():
    rows, problems = tabs.load()
    return JSONResponse({"tabs": rows, "problems": problems, "source": "db" if db.enabled() else "file"}, headers={"Cache-Control": "no-store"})


@app.get("/healthz")
def healthz():
    return {"ok": True}


@app.api_route("/api/{rest:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
def api_404(rest: str):
    return JSONResponse({"error": "not found"}, status_code=404)


def _index():
    """index.html with <base href> set to UI_BASE_PATH at request time, so one build works under any path prefix."""
    html = (UI / "index.html").read_text(encoding="utf-8")
    html = html.replace('<base href="/">', f'<base href="{settings.UI_BASE_PATH}">')
    return HTMLResponse(html, headers={"Cache-Control": "no-cache"})


@app.get("/{path:path}")
def ui(path: str):
    if not (UI / "index.html").is_file():
        return Response("UI not built", status_code=503, media_type="text/plain")
    f = (UI / path).resolve()
    if path and f.is_file() and f.is_relative_to(UI):
        # Angular's bundles have a content hash in their names, so they can be cached forever
        cache = "public, max-age=31536000, immutable" if f.suffix in HASHED and "-" in f.stem else "no-cache"
        return FileResponse(f, headers={"Cache-Control": cache})
    return _index()   # client-side routes (/recovery, /media, ...)
