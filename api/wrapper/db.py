"""The tab table (Postgres). Used when DB_HOST is set; otherwise the wrapper reads config/tabs.json.

One database serves every environment (laptop dev and the server read the same rows), but an app's address differs
per environment, so URLs live in their own table keyed by TABS_ENV ("laptop", "server", ...), with "default" as
the fallback for a tab that has the same address everywhere.
"""
import os

import psycopg
from psycopg.rows import dict_row

SCHEMA = """
CREATE TABLE IF NOT EXISTS tab (
    id          text PRIMARY KEY CHECK (id ~ '^[a-z0-9][a-z0-9-]{0,39}$'),
    title       text NOT NULL CHECK (title <> ''),
    sort_order  integer NOT NULL DEFAULT 1000,
    description text NOT NULL DEFAULT '',
    enabled     boolean NOT NULL DEFAULT true,
    updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS tab_url (
    tab_id      text NOT NULL REFERENCES tab(id) ON DELETE CASCADE ON UPDATE CASCADE,
    env         text NOT NULL DEFAULT 'default',
    url         text NOT NULL CHECK (url ~ '^https?://[^/]+'),
    PRIMARY KEY (tab_id, env)
);
"""

QUERY = """
SELECT t.id, t.title, t.sort_order AS "order", t.description,
       COALESCE(e.url, d.url) AS url
FROM tab t
LEFT JOIN tab_url e ON e.tab_id = t.id AND e.env = %(env)s
LEFT JOIN tab_url d ON d.tab_id = t.id AND d.env = 'default'
WHERE t.enabled
ORDER BY t.sort_order, lower(t.title)
"""


def enabled():
    return bool(os.environ.get("DB_HOST"))


def env():
    return os.environ.get("TABS_ENV", "default")


def connect():
    return psycopg.connect(
        host=os.environ["DB_HOST"], port=int(os.environ.get("DB_PORT", "5432")),
        dbname=os.environ.get("DB_NAME", "home_dashboards"), user=os.environ.get("DB_USER", "home_dashboards"),
        password=os.environ.get("DB_PASSWORD", ""), connect_timeout=5, row_factory=dict_row,
        application_name="home-dashboards",
    )


def migrate():
    with connect() as c:
        c.execute(SCHEMA)


def load():
    """(tabs, problems) in the same shape as the file source; a tab with no URL for this environment is skipped."""
    with connect() as c:
        rows = c.execute(QUERY, {"env": env()}).fetchall()
    tabs = [r for r in rows if r["url"]]
    problems = [f"{r['id']}: no url for env {env()!r} or 'default'" for r in rows if not r["url"]]
    return tabs, problems


def upsert(tab_id, title=None, order=None, description=None, enabled=None, urls=None):
    """Create a tab, or change only the fields given (None keeps what's there)."""
    with connect() as c:
        exists = c.execute("SELECT 1 FROM tab WHERE id = %s", (tab_id,)).fetchone()
        if not exists and not title:
            raise ValueError(f"{tab_id} is new: a title is required")
        p = {"id": tab_id, "title": title, "order": order, "description": description, "enabled": enabled}
        if exists:
            c.execute("""UPDATE tab SET title = COALESCE(%(title)s, title), sort_order = COALESCE(%(order)s, sort_order),
                           description = COALESCE(%(description)s, description), enabled = COALESCE(%(enabled)s, enabled),
                           updated_at = now()
                         WHERE id = %(id)s""", p)
        else:
            c.execute("""INSERT INTO tab (id, title, sort_order, description, enabled)
                         VALUES (%(id)s, %(title)s, COALESCE(%(order)s, 1000), COALESCE(%(description)s, ''),
                                 COALESCE(%(enabled)s, true))""", p)
        for e, url in (urls or {}).items():
            c.execute("""INSERT INTO tab_url (tab_id, env, url) VALUES (%s, %s, %s)
                         ON CONFLICT (tab_id, env) DO UPDATE SET url = excluded.url""", (tab_id, e, url))


def remove(tab_id):
    with connect() as c:
        return c.execute("DELETE FROM tab WHERE id = %s", (tab_id,)).rowcount


def all_rows():
    with connect() as c:
        tabs = c.execute("SELECT id, title, sort_order, description, enabled FROM tab ORDER BY sort_order, id").fetchall()
        urls = c.execute("SELECT tab_id, env, url FROM tab_url ORDER BY tab_id, env").fetchall()
    for t in tabs:
        t["urls"] = {u["env"]: u["url"] for u in urls if u["tab_id"] == t["id"]}
    return tabs
