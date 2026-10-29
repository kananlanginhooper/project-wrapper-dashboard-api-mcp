"""Every setting comes from the environment (.env); nothing about a host, port or scheme is hard-coded."""
import os


def _list(name):
    return os.environ.get(name, "").replace(",", " ").split()


PUBLIC_URL = os.environ.get("PUBLIC_URL", "http://localhost:8097").rstrip("/")
_base = os.environ.get("UI_BASE_PATH", "/").strip("/")
UI_BASE_PATH = f"/{_base}/" if _base else "/"          # "/" or "/dash/"
FRAME_ANCESTORS = _list("FRAME_ANCESTORS")             # who may frame the wrapper itself (normally nobody)
UI_DIR = os.environ.get("UI_DIR", "/app/ui")
TABS_FILE = os.environ.get("TABS_FILE", "/config/tabs.json")
LOGIN = os.environ.get("LOGIN", "off").lower() in ("on", "1", "true", "yes")
OIDC_ISSUER = os.environ.get("OIDC_ISSUER", "")
OIDC_CLIENT_ID = os.environ.get("OIDC_CLIENT_ID", "")
