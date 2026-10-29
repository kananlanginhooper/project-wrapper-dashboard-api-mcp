from app.core.config import get_settings


def test_tabs_from_file_sorted_and_validated(client):
    r = client.get("/api/tabs")
    assert r.status_code == 200
    assert r.headers["cache-control"] == "no-store"
    body = r.json()
    assert body["source"] == "file"
    assert [t["id"] for t in body["tabs"]] == ["alpha", "beta"]  # sorted by order; disabled one left out
    assert body["tabs"][0] == {
        "id": "alpha",
        "title": "Alpha",
        "url": "http://localhost:4300/",
        "order": 10,
        "description": "first",
    }
    assert len(body["problems"]) == 3  # bad id, bad url, duplicate id


def test_missing_tabs_file_is_a_problem_not_an_error(client, monkeypatch):
    monkeypatch.setenv("TABS_FILE", "/nope/tabs.json")
    get_settings.cache_clear()
    body = client.get("/api/tabs").json()
    assert body["tabs"] == [] and "no tab list" in body["problems"][0]


def test_config_shape(client):
    assert client.get("/api/config").json() == {
        "apiBase": "/api/",
        "basePath": "/",
        "publicUrl": "http://localhost:8097",
        "frameParents": [],
        "login": {"enabled": False, "issuer": "", "clientId": ""},
    }


def test_frame_ancestors_header(client, monkeypatch):
    assert client.get("/api/config").headers["content-security-policy"] == "frame-ancestors 'self'"
    monkeypatch.setenv("FRAME_ANCESTORS", "http://a.test, http://b.test")
    get_settings.cache_clear()
    assert (
        client.get("/healthz").headers["content-security-policy"]
        == "frame-ancestors 'self' http://a.test http://b.test"
    )


def test_ui_routes_and_base_path(client, monkeypatch):
    assert "<app-root>" in client.get("/recovery").text
    assert client.get("/main-ABC123.js").headers["cache-control"].startswith("public, max-age=31536000")
    monkeypatch.setenv("UI_BASE_PATH", "dash")
    get_settings.cache_clear()
    assert '<base href="/dash/">' in client.get("/").text
    assert client.get("/api/config").json()["apiBase"] == "/dash/api/"


def test_unknown_api_path_is_json_404(client):
    r = client.post("/api/nope")
    assert r.status_code == 404 and r.json() == {"error": "not found"}


def test_openapi_has_typed_tabs(client):
    schemas = client.get("/openapi.json").json()["components"]["schemas"]
    assert {"Tab", "TabList", "AppConfig", "LoginConfig"} <= set(schemas)
