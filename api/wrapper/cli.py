"""Manage the tab table:  docker compose exec wrapper python -m wrapper.cli <command>

  migrate                                  create the tables if they don't exist (the server also does this at start)
  list                                     every tab with its URL per environment
  set ID [--title T] [--order N] [--description D] [--enable|--disable] [--url ENV=URL ...]
                                           a new tab needs --title; for an existing one only the given fields change
  remove ID
  import FILE --env ENV                    copy a tabs.json file into the table, its URLs under ENV
"""
import argparse
import json
import sys

from . import db, tabs


def main(argv=None):
    p = argparse.ArgumentParser(prog="wrapper.cli")
    sub = p.add_subparsers(dest="cmd", required=True)
    sub.add_parser("migrate")
    sub.add_parser("list")
    s = sub.add_parser("set")
    s.add_argument("id")
    s.add_argument("--title")
    s.add_argument("--order", type=int)
    s.add_argument("--description")
    on = s.add_mutually_exclusive_group()
    on.add_argument("--enable", dest="enabled", action="store_const", const=True)
    on.add_argument("--disable", dest="enabled", action="store_const", const=False)
    s.add_argument("--url", action="append", default=[], metavar="ENV=URL")
    r = sub.add_parser("remove")
    r.add_argument("id")
    i = sub.add_parser("import")
    i.add_argument("file")
    i.add_argument("--env", required=True)
    a = p.parse_args(argv)

    if not db.enabled():
        sys.exit("DB_HOST isn't set: the wrapper is using its tabs file, edit that instead")
    db.migrate()
    if a.cmd == "list":
        for t in db.all_rows():
            state = "" if t["enabled"] else "  (disabled)"
            print(f"{t['sort_order']:>5}  {t['id']:<16} {t['title']}{state}")
            for e, u in t["urls"].items():
                print(f"{'':>7}{e:<10} {u}")
    elif a.cmd == "set":
        urls = dict(u.split("=", 1) for u in a.url)
        for u in urls.values() or ["http://placeholder/"]:
            if err := tabs.check({"id": a.id, "title": a.title or "-", "url": u}):
                sys.exit(err)
        try:
            db.upsert(a.id, a.title, a.order, a.description, a.enabled, urls)
        except ValueError as e:
            sys.exit(str(e))
        print(f"saved {a.id}")
    elif a.cmd == "remove":
        print("removed" if db.remove(a.id) else f"no tab {a.id}")
    elif a.cmd == "import":
        with open(a.file, encoding="utf-8") as f:
            rows = json.load(f)
        for row in rows:
            if err := tabs.check(row):
                print(f"skipped {row.get('id')}: {err}")
                continue
            db.upsert(row["id"], row["title"], int(row.get("order", 1000)), row.get("description", ""),
                      row.get("enabled", True), {a.env: row["url"]})
            print(f"imported {row['id']}")


if __name__ == "__main__":
    main()
