"""Tab table tests against a real Postgres. Skipped unless TEST_DB_HOST is set (a throwaway database: tables get
created and rows written). Run: TEST_DB_HOST=... TEST_DB_PASSWORD=... pytest tests/test_db.py"""

import os

import pytest

from app.core.config import get_settings

pytestmark = pytest.mark.skipif(not os.environ.get("TEST_DB_HOST"), reason="no TEST_DB_HOST")


@pytest.fixture
def tabs(monkeypatch):
    monkeypatch.setenv("DB_HOST", os.environ["TEST_DB_HOST"])
    monkeypatch.setenv("DB_PASSWORD", os.environ.get("TEST_DB_PASSWORD", ""))
    monkeypatch.setenv("DB_NAME", os.environ.get("TEST_DB_NAME", "home_dashboards"))
    monkeypatch.setenv("DB_USER", os.environ.get("TEST_DB_USER", "home_dashboards"))
    get_settings.cache_clear()
    from app.db import session

    session.engine.cache_clear()
    session.migrate()
    session.migrate()  # idempotent
    from app.services import tabs as svc

    for t in svc.all_rows():
        svc.remove(t.id)
    yield svc
    get_settings.cache_clear()


def test_per_env_urls_and_partial_update(tabs, monkeypatch):
    tabs.upsert("media", "Media", 40, "pics", True, {"laptop": "http://localhost:8093/", "server": "http://srv:8093/"})
    tabs.upsert("plan", "Plan", 20, urls={"default": "http://plan/"})
    tabs.upsert("media", description="photos")  # only the description changes
    tabs.upsert("media", icon="photo_library")
    with pytest.raises(ValueError):
        tabs.upsert("new-one", urls={"default": "http://x/"})  # a new tab needs a title

    monkeypatch.setenv("TABS_ENV", "server")
    get_settings.cache_clear()
    got = tabs.list_tabs()
    assert got.source == "db" and [(t.id, t.url) for t in got.tabs] == [
        ("plan", "http://plan/"),
        ("media", "http://srv:8093/"),
    ]
    assert got.tabs[1].description == "photos" and got.tabs[1].title == "Media"
    assert got.tabs[1].icon == "photo_library" and got.tabs[0].icon == ""

    monkeypatch.setenv("TABS_ENV", "phone")
    get_settings.cache_clear()
    got = tabs.list_tabs()
    assert [t.id for t in got.tabs] == ["plan"] and "media" in got.problems[0]

    tabs.upsert("plan", enabled=False)
    assert [t.id for t in tabs.list_tabs().tabs] == []
    assert tabs.remove("plan") and not tabs.remove("plan")


def test_title_order_ignores_case_and_url_change_bumps_updated_at(tabs):
    tabs.upsert("b", "beta", 10, urls={"default": "http://b/"})
    tabs.upsert("a", "Alpha", 10, urls={"default": "http://a/"})
    tabs.upsert("c", "Charlie", 10, urls={"default": "http://c/"})
    assert [t.id for t in tabs.list_tabs().tabs] == ["a", "b", "c"]

    before = {r.id: r.updated_at for r in tabs.all_rows()}["b"]
    tabs.upsert("b", urls={"default": "http://b2/"})  # URL only
    assert {r.id: r.updated_at for r in tabs.all_rows()}["b"] > before
