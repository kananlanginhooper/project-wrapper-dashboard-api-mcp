import json

import pytest
from fastapi.testclient import TestClient

from app.core.config import get_settings


@pytest.fixture
def client(tmp_path, monkeypatch):
    """The app on a tabs file in a temp dir, a fake built UI, and no database."""
    ui = tmp_path / "ui"
    ui.mkdir()
    (ui / "index.html").write_text('<html><head><base href="/"></head><body><app-root></app-root></body></html>')
    (ui / "main-ABC123.js").write_text("console.log(1)")
    tabs = tmp_path / "tabs.json"
    tabs.write_text(
        json.dumps(
            [
                {"id": "beta", "title": "Beta", "url": "http://localhost:4301/", "order": 20},
                {"id": "alpha", "title": "Alpha", "url": "http://localhost:4300/", "order": 10, "description": "first"},
                {"id": "off", "title": "Off", "url": "http://localhost:4302/", "enabled": False},
                {"id": "Bad ID", "title": "x", "url": "http://localhost/"},
                {"id": "noscheme", "title": "x", "url": "localhost:1/"},
                {"id": "alpha", "title": "Dup", "url": "http://localhost:4300/"},
            ]
        )
    )
    for k, v in {
        "UI_DIR": str(ui),
        "TABS_FILE": str(tabs),
        "DB_HOST": "",
        "UI_BASE_PATH": "/",
        "FRAME_ANCESTORS": "",
        "PUBLIC_URL": "http://localhost:8097",
        "LOGIN": "off",
    }.items():
        monkeypatch.setenv(k, v)
    get_settings.cache_clear()
    from app.main import create_app

    yield TestClient(create_app())
    get_settings.cache_clear()
