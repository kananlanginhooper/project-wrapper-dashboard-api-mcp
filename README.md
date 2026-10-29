# Home dashboards (project-wrapper-dashboard-api-mcp)

One top nav over many dashboards. Every tab is a **standalone app shown in an iframe**: the wrapper knows nothing about what's inside it.

- **`ui/`**: the Angular shell, which holds the nav and one full-size iframe per tab.
- **`api/`**: a FastAPI back end. It serves the built shell plus `GET /api/config` and `GET /api/tabs`.
- **Docker:** `docker compose up -d --build` runs everything, with `restart: unless-stopped`.

**Planned:**
- An MCP server, so assistants can list and open dashboards.
- Login through the companion IdP, [OpenID-Connect-Python-Auth-for-private-sites](https://github.com/kananlanginhooper/OpenID-Connect-Python-Auth-for-private-sites).

## Run it

```bash
cp .env.example .env
cp config/tabs.example.json config/tabs.json   # then list your dashboards
docker network create --subnet <subnet your database allows> homelab   # once per machine; shared by all the dashboards
docker compose up -d --build
```

Open http://localhost:8097/. `config/tabs.json` is re-read on every request, so editing it adds a tab without a restart. A new tab appears in an open wrapper within 30 seconds.

For UI work: `cd ui && npm ci && npx ng serve`. Run the API on 8097 next to it.

## Code layout

It follows the group template. Details and before/after screenshots are in [docs/refactor/](docs/refactor/README.md).
- **UI:** `ui/src/app/{core,shared,features}`, Angular Material + the shared theme in `ui/src/styles/theme.scss`, types generated from the API's OpenAPI (`npm run api-types`), `npx ng lint`.
- **API:** `api/app/{core,api/routes,schemas,services,db}`, Alembic migrations, tests with `pytest` (`pip install -r api/requirements-dev.txt`; `ruff check`).

## Demo (GitHub Pages)

`cd ui && npm run build:demo` writes a back-end-free demo to `docs/`:
- the shell, built for `/project-wrapper-dashboard-api-mcp/`
- a static `api/tabs` and `api/config`
- an About page

Its tabs are other projects' public demos, each running on mock data. They're listed in [`ui/demo/tabs.json`](ui/demo/tabs.json). GitHub Pages serves `docs/` from `main`.

## Settings (`.env`)

| Variable | Meaning |
|---|---|
| `DASH_PORT`, `BIND_ADDR` | Host port, and the one IPv4 address to publish it on (default `127.0.0.1`; a LAN address to share it). Never `0.0.0.0` on a host with a public IPv6 address |
| `PUBLIC_URL` | Exactly what browsers type to reach the wrapper |
| `UI_BASE_PATH` | Path prefix (`/` or `/dash/`), written into `<base href>` at request time |
| `FRAME_ANCESTORS` | Origins allowed to frame the wrapper itself. Normally empty, which sends `frame-ancestors 'self'` |
| `FORWARDED_ALLOW_IPS` | Reverse proxies whose `X-Forwarded-*` headers are trusted |
| `LOGIN`, `OIDC_ISSUER`, `OIDC_CLIENT_ID` | Login through the IdP (off until it is live) |
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | The tab table (Postgres). Empty `DB_HOST` means the tabs file is used |
| `TABS_ENV` | Which URL each tab gets (`laptop`, `server`, ...) |

`GET /api/config` returns `{ apiBase, basePath, publicUrl, frameParents, login: { enabled, issuer, clientId } }`.

## Tabs

The tab list comes from one of two sources:
- **A Postgres table**, when `DB_HOST` is set.
- **`config/tabs.json`**, when it isn't.

### The tab table

The wrapper creates the tables at start: `tab` and `tab_url`.

An app's address usually differs per machine, so each tab has a URL per environment. The wrapper picks the row for its `TABS_ENV` (for example `laptop` or `server`), falling back to `default`. That lets the laptop and the server share one database.

```bash
docker compose exec wrapper python -m app.cli list
docker compose exec wrapper python -m app.cli set media --title "Media library" --order 40 --url laptop=http://localhost:8093/ --url server=http://host:8093/
docker compose exec wrapper python -m app.cli set media --disable          # only the given fields change
docker compose exec wrapper python -m app.cli import /config/tabs.json --env laptop
docker compose exec wrapper python -m app.cli remove media
```

If the database is unreachable, the nav says so and the wrapper keeps running.

### The tabs file

`config/tabs.json` is a list of tabs:

```json
{ "id": "media", "title": "Media library", "url": "http://host:port/", "order": 40, "description": "nav tooltip", "enabled": true }
```

- `id` is the wrapper path (`/media`): lowercase letters, digits and dashes.
- `url` is the app's own address. It differs per machine, which is why the file isn't committed.
- Invalid rows are skipped and listed under `problems` in `GET /api/tabs`.

## Making an app work as a tab

1. **The app is complete on its own**, with its own server, port and deploy. The wrapper only frames it.
2. **It allows the wrapper to frame it:** `Content-Security-Policy: frame-ancestors 'self' <wrapper origins>`. List every wrapper origin (laptop and server) in the app's `FRAME_ANCESTORS`. A `X-Frame-Options: DENY/SAMEORIGIN` header blocks it.
3. **No hard-coded hosts:** the app loads its runtime config from its own `/api/config` and calls only relative `/api/...`.
4. **Login stays inside the iframe:** the app is its own OIDC client (Authorization Code + PKCE), so a signed-in IdP session sends it straight back without a prompt.
5. **Messages to the wrapper** use `postMessage` to the exact wrapper origin, never `*`.
6. Links with `target="_top"` leave the wrapper, which is fine. The nav's ↗ opens any tab on its own.

## License

GPL-3.0
