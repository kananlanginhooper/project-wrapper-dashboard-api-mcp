# Home dashboards (project-wrapper-dashboard-api-mcp)

One top nav over many dashboards. Every tab is a **standalone app shown in an iframe**: the wrapper knows nothing about what's inside it.

- **`ui/`**: the Angular shell, which holds the nav and one full-size iframe per tab.
- **`api/`**: a FastAPI back end. It serves the built shell plus `GET /api/config` and `GET /api/tabs`.
- **Docker:** `docker compose up -d --build` runs everything, with `restart: unless-stopped`.

**Planned:**
- An MCP server, so assistants can list and open dashboards.
- Login through the companion IdP, [OpenID-Connect-Python-Auth-for-private-sites](https://github.com/kananlanginhooper/OpenID-Connect-Python-Auth-for-private-sites).
- The tab list in a database table.

## Run it

```bash
cp .env.example .env
cp config/tabs.example.json config/tabs.json   # then list your dashboards
docker compose up -d --build
```

Open http://localhost:8097/. `config/tabs.json` is re-read on every request, so editing it adds a tab without a restart. A new tab appears in an open wrapper within 30 seconds.

For UI work: `cd ui && npm ci && npx ng serve`. Run the API on 8097 next to it.

## Settings (`.env`)

| Variable | Meaning |
|---|---|
| `DASH_PORT`, `DASH_BIND` | Host port and interface |
| `PUBLIC_URL` | Exactly what browsers type to reach the wrapper |
| `UI_BASE_PATH` | Path prefix (`/` or `/dash/`), written into `<base href>` at request time |
| `FRAME_ANCESTORS` | Origins allowed to frame the wrapper itself. Normally empty, which sends `frame-ancestors 'self'` |
| `FORWARDED_ALLOW_IPS` | Reverse proxies whose `X-Forwarded-*` headers are trusted |
| `LOGIN`, `OIDC_ISSUER`, `OIDC_CLIENT_ID` | Login through the IdP (off until it is live) |

`GET /api/config` returns `{ apiBase, basePath, publicUrl, frameParents, login: { enabled, issuer, clientId } }`.

## Tabs

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
