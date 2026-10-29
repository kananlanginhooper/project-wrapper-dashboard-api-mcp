"""The tab list: from the Postgres tab table when DB_HOST is set, otherwise from a JSON file (TABS_FILE).

Both are read on every request, so a new row or a file edit adds a tab without a restart. The file is per machine
(laptop and server URLs differ), so it isn't committed. Format: a list of
{"id": "first-app", "title": "First app", "url": "http://host:port/", "order": 10,
 "description": "...", "enabled": true}
"""

import json
import re
from urllib.parse import urlsplit

from sqlalchemy import select

from app.core.config import get_settings
from app.db import session as db
from app.db.models import TabRow, TabUrlRow
from app.schemas.tabs import TAB_ID, Tab, TabList

_ID = re.compile(TAB_ID)


def check(row: dict) -> str | None:
    """Why a tab row is invalid, or None."""
    if not isinstance(row, dict):
        return "not an object"
    if not _ID.match(str(row.get("id", ""))):
        return "id must be lowercase letters, digits and dashes"
    if not str(row.get("title", "")).strip():
        return "title is required"
    u = urlsplit(str(row.get("url", "")))
    if u.scheme not in ("http", "https") or not u.netloc:
        return "url must be an absolute http(s) URL"
    return None


def list_tabs() -> TabList:
    if not get_settings().use_db:
        return _from_file()
    try:
        return _from_db()
    except Exception as e:  # a database hiccup shows in the nav instead of taking the wrapper down
        return TabList(tabs=[], problems=[f"tab table unreachable: {type(e).__name__}"], source="db")


def _from_file() -> TabList:
    path = get_settings().tabs_file
    try:
        with open(path, encoding="utf-8") as f:
            rows = json.load(f)
    except FileNotFoundError:
        return TabList(tabs=[], problems=[f"no tab list at {path}"], source="file")
    except (OSError, ValueError) as e:
        return TabList(tabs=[], problems=[f"tab list unreadable: {e}"], source="file")
    tabs, problems, seen = [], [], set()
    for i, row in enumerate(rows if isinstance(rows, list) else []):
        err = check(row) or ("duplicate id" if row.get("id") in seen else None)
        if err:
            problems.append(f"row {i + 1}: {err}")
            continue
        seen.add(row["id"])
        if row.get("enabled", True):
            tabs.append(
                Tab(
                    id=row["id"],
                    title=row["title"].strip(),
                    url=row["url"],
                    order=int(row.get("order", 1000)),
                    description=row.get("description", ""),
                )
            )
    tabs.sort(key=lambda t: (t.order, t.title.lower()))
    return TabList(tabs=tabs, problems=problems, source="file")


def _from_db() -> TabList:
    env = get_settings().tabs_env
    with db.session() as s:
        rows = s.scalars(select(TabRow).where(TabRow.enabled).order_by(TabRow.sort_order, TabRow.title)).all()
        tabs, problems = [], []
        for r in rows:
            urls = {u.env: u.url for u in r.urls}
            url = urls.get(env) or urls.get("default")
            if not url:
                problems.append(f"{r.id}: no url for env {env!r} or 'default'")
                continue
            tabs.append(Tab(id=r.id, title=r.title, url=url, order=r.sort_order, description=r.description))
    return TabList(tabs=tabs, problems=problems, source="db")


def upsert(
    tab_id: str,
    title: str | None = None,
    order: int | None = None,
    description: str | None = None,
    enabled: bool | None = None,
    urls: dict[str, str] | None = None,
) -> None:
    """Create a tab, or change only the fields given (None keeps what's there)."""
    with db.session() as s:
        row = s.get(TabRow, tab_id)
        if row is None:
            if not title:
                raise ValueError(f"{tab_id} is new: a title is required")
            row = TabRow(id=tab_id, title=title)
            s.add(row)
        for field, value in (
            ("title", title),
            ("sort_order", order),
            ("description", description),
            ("enabled", enabled),
        ):
            if value is not None:
                setattr(row, field, value)
        s.flush()
        for env, url in (urls or {}).items():
            s.merge(TabUrlRow(tab_id=tab_id, env=env, url=url))


def remove(tab_id: str) -> bool:
    with db.session() as s:
        row = s.get(TabRow, tab_id)
        if row is None:
            return False
        s.delete(row)
        return True


def all_rows() -> list[TabRow]:
    with db.session() as s:
        return list(s.scalars(select(TabRow).order_by(TabRow.sort_order, TabRow.id)).all())
