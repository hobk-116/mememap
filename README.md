# MemeMap

**English** · [Tiếng Việt](README.vi.md)

MemeMap is a bilingual (Vietnamese/English) community map for posting memes and short stories at places around Hà Nội. It includes accounts, user profiles, aura voting, a city leaderboard, and a moderation dashboard.

## Project contents

- `index.html` — landing, instructions, registration/login, and the signed-in user's profile.
- `landing.html` — the interactive MapLibre GL JS map and its menus, pin composer, profiles, Memerboard, and admin dashboard.
- `server.py` — HTTP adapter: routing, cookies, request parsing and responses.
- `mememap/` — account, profile, pin and moderation services; configuration, migrations, media and geographical scopes.
- `assets/` — bundled profile images and app icons. The UI uses `icon-128x.png`; the browser tab uses `icon-64x.png`. New accounts use the WebP default avatar; existing accounts may still refer to the PNG.
- `assets/css/` and `assets/js/` — shared components and separate home/map styles and scripts. See the architecture guide for responsibilities.
- `archive/` — unchanged original Sticky Note and historical HTML page, with a bilingual archive index. These are source references, not runtime-data backups.
- `docs/en/` and `docs/vi/` — matching architecture, API, operation, backup, deployment, testing and recommendations documents; earlier notes are under each language's `history/` folder.
- `tests/` — backend and browser regressions using disposable data.

## Run locally

Requirements: Python 3.10+ and `cwebp` on `PATH`. `cwebp` is used by the server when it must convert an uploaded JPEG/PNG to WebP. The browser may convert the image first, but server conversion is the Safari fallback.

On macOS with Homebrew:

```sh
brew install webp
python3 server.py
```

Then open [http://localhost:8000](http://localhost:8000). The server defaults to `0.0.0.0:8000`, so other devices on the same reachable network can use `http://<computer-ip>:8000`.

Optional settings:

```sh
MEMEMAP_HOST=127.0.0.1 MEMEMAP_PORT=8000 python3 server.py
```

See [local operation](docs/en/RUNNING.md), [backups](docs/en/BACKUP.md) and [Cloudflare Tunnel deployment](docs/en/DEPLOYMENT.md) for host settings, data protection, LAN access and public HTTPS.

## Main capabilities

- Create an account and sign in with a username.
- Add a map pin with a title, text, and optional static JPG/JPEG/PNG/WebP image. New uploaded images are stored as WebP.
- View profiles, change the profile picture, and see meme and aura totals.
- Vote `+1` or `-1` aura on another user's pin. Owners cannot vote on their own pins.
- View the Hà Nội Memerboard and report a meme for review.
- Admins can search memes, hide or restore them, process reports, and temporarily restrict posting or voting. Moderation actions are recorded in an audit history.
- The admin overview shows activity totals and rule-based spam alerts for human review.
- Browse in Vietnamese or English.
- The map refreshes pins every 10 seconds while the page is visible.

## Data and configuration

- SQLite database: `mememap.sqlite3` in the repository root, created at first startup.
- Uploaded media: `uploads/memes/` and `uploads/profiles/`, created as needed.
- Both are runtime data and are ignored by Git. Back them up together; the database stores paths to uploaded files.
- Map center, posting bounds and OpenFreeMap style are configured in `mememap/regions.py` and supplied to the frontend through authenticated `GET /api/map-config`. Leaderboard bounds are declared separately in the same module; see [architecture](docs/en/ARCHITECTURE.md).
- Restart the server after backend updates. Versioned migrations preserve existing data; back up the database and media together before upgrading. Runtime paths can be configured through the environment variables in the operations guide.

## Documentation

- [English documentation index](docs/en/README.md)
- [Vietnamese documentation index](docs/vi/README.md)
- [Changelog](CHANGELOG.md) · [Tiếng Việt](CHANGELOG.vi.md)
- [Version history — 0.0.x](docs/en/history/VERSIONS.md) · [Tiếng Việt](docs/vi/history/VERSIONS.md)
- [Agent instructions](AGENTS.md) · [Vietnamese guide](docs/vi/AGENTS_GUIDE_vi.md)
- [Architecture and data model](docs/en/ARCHITECTURE.md)
- [HTTP API reference](docs/en/API.md)
- [Local operation](docs/en/RUNNING.md)
- [Backups and recovery](docs/en/BACKUP.md)
- [Cloudflare Tunnel deployment](docs/en/DEPLOYMENT.md)
- [Testing](docs/en/TESTING.md)
- [Development recommendations and merged Sticky Note](docs/en/RECOMMENDATIONS.md)
- [Refactor history](docs/en/history/REFACTOR_2026-10-02.md)
- [Archived original files](archive/README.md)

## Project status

This is an actively evolving prototype. The current map and Memerboard support Hà Nội. The HTTP server is intentionally small and is not a hardened production application. Review the security and map-provider notes in the [deployment guide](docs/en/DEPLOYMENT.md) before exposing it beyond a trusted test environment.

## Frontend-only showcase

The Vercel showcase uses the same HTML/CSS UI with a browser-only data adapter in `assets/js/api.js`. User actions are stored in `sessionStorage` for the current browser tab. It is a visual/demo deployment and does not persist accounts, pins, votes or media on a server. Deploy the repository as a static Vercel project; no Python runtime or SQLite database is needed for this mode.
