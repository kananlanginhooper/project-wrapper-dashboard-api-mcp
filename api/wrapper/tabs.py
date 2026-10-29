"""The tab list: which dashboards the wrapper shows, each one a standalone app in an iframe.

Source today: a JSON file (TABS_FILE), re-read on every request, so editing it adds a tab without a restart.
Planned: a database table with the same fields (id, title, url, order, description, enabled).

File format: a list of {"id": "first-app", "title": "First app", "url": "http://host:port/", "order": 10,
"description": "...", "enabled": true}. The file is per machine (laptop and server URLs differ), so it isn't committed.
"""
import json
import re
from urllib.parse import urlsplit

from . import settings

ID = re.compile(r"^[a-z0-9][a-z0-9-]{0,39}$")


def _check(row):
    if not isinstance(row, dict):
        return "not an object"
    if not ID.match(str(row.get("id", ""))):
        return "id must be lowercase letters, digits and dashes"
    if not str(row.get("title", "")).strip():
        return "title is required"
    u = urlsplit(str(row.get("url", "")))
    if u.scheme not in ("http", "https") or not u.netloc:
        return "url must be an absolute http(s) URL"
    return None


def load():
    """(tabs, problems): enabled, valid rows sorted by order then title, plus a note for every row that was skipped."""
    try:
        with open(settings.TABS_FILE, encoding="utf-8") as f:
            rows = json.load(f)
    except FileNotFoundError:
        return [], [f"no tab list at {settings.TABS_FILE}"]
    except (OSError, ValueError) as e:
        return [], [f"tab list unreadable: {e}"]
    tabs, problems, seen = [], [], set()
    for i, row in enumerate(rows if isinstance(rows, list) else []):
        err = _check(row) or ("duplicate id" if row.get("id") in seen else None)
        if err:
            problems.append(f"row {i + 1}: {err}")
            continue
        seen.add(row["id"])
        if row.get("enabled", True):
            tabs.append({"id": row["id"], "title": row["title"].strip(), "url": row["url"],
                         "order": int(row.get("order", 1000)), "description": row.get("description", "")})
    tabs.sort(key=lambda t: (t["order"], t["title"].lower()))
    return tabs, problems
