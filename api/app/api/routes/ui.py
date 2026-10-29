"""The built Angular shell: static files, and index.html (with <base href> from UI_BASE_PATH) for client routes."""

from pathlib import Path

from fastapi import APIRouter
from fastapi.responses import FileResponse, HTMLResponse, JSONResponse, Response

from app.core.config import get_settings

router = APIRouter(include_in_schema=False)
HASHED = (".js", ".css")


@router.api_route("/api/{rest:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
def api_not_found(rest: str) -> Response:
    return JSONResponse({"error": "not found"}, status_code=404)


@router.get("/{path:path}")
def ui(path: str) -> Response:
    ui_dir = Path(get_settings().ui_dir).resolve()
    if not (ui_dir / "index.html").is_file():
        return Response("UI not built", status_code=503, media_type="text/plain")
    f = (ui_dir / path).resolve()
    if path and f.is_file() and f.is_relative_to(ui_dir):
        # Angular's bundles have a content hash in their names, so they can be cached forever
        cache = "public, max-age=31536000, immutable" if f.suffix in HASHED and "-" in f.stem else "no-cache"
        return FileResponse(f, headers={"Cache-Control": cache})
    html = (ui_dir / "index.html").read_text(encoding="utf-8")
    html = html.replace('<base href="/">', f'<base href="{get_settings().base_path}">')
    return HTMLResponse(html, headers={"Cache-Control": "no-cache"})  # client-side routes (/recovery, /media, ...)
