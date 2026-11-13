# GitHub, branches and parallel map versions

**English** · [Tiếng Việt](../vi/GIT_WORKFLOW.md) · [Documentation index](README.md)

This is the execution plan for a later GitHub upload and MapLibre + OpenFreeMap migration. Writing this guide does not commit/push code, create branches/worktrees, start servers or migrate the map. Instructions were checked on 04/10/2026; recheck repository state before executing them.

Current migration status (07/10/2026): local branch `codex/maplibre-openfreemap` exists and the original checkout is currently on it. Migration edits are uncommitted; no second worktree, baseline tag, migration commit/push or release was created by this task. Existing unrelated uncommitted policy changes remain in the working tree. To compare versions, first preserve reviewed changes in an explicitly authorized commit, then use separate checkouts/data as below. Do not switch this dirty checkout to `main` and assume it serves the old version: uncommitted edits can follow the switch. The following upload/tag/merge commands remain instructions requiring authorization.

## Intended arrangement

| Version | Branch | Folder | Local URL | Runtime data |
| --- | --- | --- | --- | --- |
| Current Leaflet baseline | `main` | `meme-map/` | `http://127.0.0.1:8000` | `mememap-data/leaflet/` |
| MapLibre + OpenFreeMap experiment | `codex/maplibre-openfreemap` | `meme-map-maplibre/` | `http://127.0.0.1:8001` | `mememap-data/maplibre/` |

The folders above are siblings. The migration branch now exists; the second folder remains proposed. Each checkout contains a complete source snapshot. A branch alone does not supply a second running directory; [Git worktrees](https://git-scm.com/docs/git-worktree) provide separate checkouts sharing Git history. Uncommitted edits and ignored files are not copied into the new checkout.

The local repository has `main`, the migration branch and a committed modular Leaflet baseline at `41fb364` (07/10/2026 source inspection). Migration edits remain uncommitted. `origin` is configured for `https://github.com/hobk-116/mememap.git`. The configured remote does not prove which commits are currently on GitHub or that the current account has write access.

## 1. Preserve data and inspect the repository

Back up the actual database and uploads together using [the backup guide](BACKUP.md). GitHub holds source history, not a backup of accounts, posts or uploaded images. Custom runtime paths must also stay outside tracked source.

From `meme-map/`, inspect:

```sh
git status --short
git branch --show-current
git remote -v
git log -5 --oneline
git ls-files
git fetch origin
git log --oneline --graph --decorate --all -15
```

Confirm Git identity, GitHub authentication and repository visibility before uploading. Use the existing repository if access is correct; if absent, create an empty repository in the owner's account and update `origin` to its actual URL. Do not initialize another Git repository inside this one. If the fetched remote contains independent changes, reconcile them deliberately; do not force-push over teammates' work.

Review `.gitignore` and every file to be staged. It ignores `.env`/`.env.*` (except a sanitized `.env.example`), `.venv/`/`venv/`, Python caches, `.DS_Store`, `*.sqlite`/`*.sqlite3` databases and their WAL/SHM/journal sidecars, `uploads/`, root `backups/`, `node_modules/`, `.next/` and root `out/`. Next.js rules are preparation for a future migration, not an indication that Next.js is installed. Custom database filenames with other extensions, custom media/backup directories and credential files with other names still need matching rules or storage outside the repo. Ignore rules do not untrack files already committed. Keep tunnel tokens and credentials outside Git. Include the current source modules, assets, tests, paired docs and intentional archive moves.

## 2. Record and push the Leaflet baseline

Finish reviewing the current changes on `main` first. Select baseline verification using [AGENTS](../../AGENTS.md) and [testing](TESTING.md). For this broad pre-migration baseline, plan full L4 checks:

```sh
python3 -m unittest discover -s tests -p 'test_*.py' -v
node tests/test_api_client.cjs
python3 tests/run_browser.py
```

These are future execution commands, not test results from creating this L0 guide. Resolve failures or document blockers before calling the baseline verified. Then stage only the reviewed source set; `git add -A` below assumes the ignore/file review is complete:

```sh
git add -A
git diff --cached --name-status
git diff --cached --stat
git diff --cached
git commit -m "Record current Leaflet baseline"
git push -u origin main
git tag -a baseline-leaflet -m "Leaflet baseline before MapLibre migration"
git push origin baseline-leaflet
```

Create the tag only after the intended baseline commit and successful push; confirm the proposed tag does not already exist. If the push is rejected, inspect fetched history and permissions before retrying. See [GitHub's push guide](https://docs.github.com/en/get-started/using-git/pushing-commits-to-a-remote-repository). Never use force-push as the routine solution. Verify GitHub shows the new commit and required folders. A baseline tag preserves the chosen source revision even if `main` later receives fixes.

## 3. Create the migration checkout

Only after all intended baseline files are committed, from the original folder:

```sh
git worktree add -b codex/maplibre-openfreemap ../meme-map-maplibre main
git worktree list
```

Keep the original folder on `main`; open `meme-map-maplibre/` in a separate editor window for migration. If the branch already exists, inspect it and use `git worktree add ../meme-map-maplibre codex/maplibre-openfreemap` instead. An existing branch cannot normally be checked out in two worktrees simultaneously. If Codex creates the checkout, use the app's managed-worktree workflow and the path it returns; do not create a duplicate manual worktree. An exact starting ref must point to the committed baseline.

## 4. Run both versions with isolated state

Create the sibling data directories. Either use fresh test accounts in each, or copy the same consistent database/media backup into each directory while both servers are stopped. Never point the experiment at the live database or media, even if only frontend work is planned. Do not copy a live SQLite file without a consistent backup. Separate copies provide an initial comparison dataset; later changes do not automatically synchronize.

For macOS/Linux shells, terminal A from `meme-map/`:

```sh
mkdir -p ../mememap-data/leaflet
MEMEMAP_HOST=127.0.0.1 MEMEMAP_PORT=8000 MEMEMAP_SECURE_COOKIE=0 MEMEMAP_DB_PATH="$PWD/../mememap-data/leaflet/mememap.sqlite3" MEMEMAP_UPLOADS_PATH="$PWD/../mememap-data/leaflet/uploads" python3 server.py
```

Terminal B from `meme-map-maplibre/`:

```sh
mkdir -p ../mememap-data/maplibre
MEMEMAP_HOST=127.0.0.1 MEMEMAP_PORT=8001 MEMEMAP_SECURE_COOKIE=0 MEMEMAP_DB_PATH="$PWD/../mememap-data/maplibre/mememap.sqlite3" MEMEMAP_UPLOADS_PATH="$PWD/../mememap-data/maplibre/uploads" python3 server.py
```

Both servers need their own terminal/process. Stop with `Ctrl+C`. Another service already using a port must be stopped or given a different port. If the existing stable server serves real users, leave its configuration intact and use an additional test port/data set for comparison instead of replacing its data paths.

Windows PowerShell equivalent: in each checkout, set the appropriate port/data folder before starting Python. Example for the migration checkout:

```powershell
New-Item -ItemType Directory -Force ../mememap-data/maplibre
$env:MEMEMAP_HOST = "127.0.0.1"
$env:MEMEMAP_PORT = "8001"
$env:MEMEMAP_SECURE_COOKIE = "0"
$env:MEMEMAP_DB_PATH = Join-Path (Get-Location).Path "../mememap-data/maplibre/mememap.sqlite3"
$env:MEMEMAP_UPLOADS_PATH = Join-Path (Get-Location).Path "../mememap-data/maplibre/uploads"
python server.py
```

Use the project's selected Python command on that machine. For the baseline terminal, replace `maplibre` with `leaflet` and port `8001` with `8000`.

**Browser sessions:** ports do not isolate cookies. The current cookie is `mememap_session`, host-only, with `Path=/`; two servers on `127.0.0.1` can overwrite each other's login cookie despite using different ports. Use separate browser profiles or different browsers for the two versions. Two tabs in one profile, or multiple private windows sharing one private session, are insufficient. See [cookie scope](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Cookies). Separate ports isolate `localStorage` origins, but are not enough to isolate authentication.

For public/mobile testing, follow [Cloudflare Tunnel deployment](DEPLOYMENT.md): route separate HTTPS hostnames to the two localhost ports, set `MEMEMAP_SECURE_COOKIE=1` for those runs, and use the HTTPS URLs. Do not use direct public exposure, port forwarding or DDNS as the default. GitHub Pages alone cannot run this Python server or its authenticated API.

## 5. Migrate and verify on the feature branch

Planned sequence:

1. Inventory Leaflet dependencies in `landing.html`, `map.js`, `map-layout.js`, `map-pins.js`, `map-composer.js`, styles and browser tests; include Admin map previews and location controls. Define a small map interface for camera, coordinate conversion, markers, popups and events before replacing those calls.
2. Pin a reviewed MapLibre GL JS version and load its CSS/worker correctly. [MapLibre documentation](https://maplibre.org/maplibre-gl-js/docs/) describes the renderer; [OpenFreeMap's quick start](https://openfreemap.org/quick_start/) supplies the map style, currently including `https://tiles.openfreemap.org/styles/liberty`. A style URL is not a raster tile-template replacement.
3. Convert map-facing coordinates carefully: MapLibre uses longitude/latitude, while existing API fields remain `lat`/`lng`. Preserve authentication, posting bounds, permissions, saved coordinates and visible attribution. Recheck camera/zoom equivalence visually rather than assuming identical numbers across engines.
4. Port fixed-pin alignment/layering, popup interactions, Menu/Admin levels and memory, Memerboard transitions, pin selection/composer, geolocation, votes and moderation previews. Keep the baseline running for side-by-side comparison. Do not combine community/schema work with the renderer migration unless separately scoped.
5. Treat the engine migration as L4: read affected APIs/modules before and after changes; update EN/VI docs/changelogs and browser tests that currently depend on Leaflet selectors/globals. Preserve behavioral assertions. Cover map-load/worker/style failures and real iOS/Android WebGL, touch, keyboard and performance separately from emulation. Run full checks on the migration checkout using disposable fixtures, never either running comparison database.

Commit reviewable milestones in the migration folder, inspect the staged diff before each commit, then upload the feature branch:

```sh
git push -u origin codex/maplibre-openfreemap
```

Each teammate/agent uses their own checkout and feature branch. Teammates on Windows clone the repository onto local disk and pull/push through GitHub; do not have simultaneous agents edit the same SMB working folder. Configure runtime paths on each host; database/media transfer remains a separate operation.

## 6. Review, merge and retain a fallback

Open a pull request from `codex/maplibre-openfreemap` to `main` with the changes, commands/results, device coverage and known limitations. While migration is in progress, fixes on `main` can be merged into the feature branch from its checkout after fetching, resolving conflicts and rerunning affected checks. Keep test contracts aligned with the intended renderer.

Merge only after the owner selects the tested version. A GitHub merge does not update an already-running server: stop the baseline server, ensure its checkout is clean, update it with `git pull --ff-only origin main`, back up runtime data and restart using the intended configuration. Verify the public tunnel route and key flows. Keep the original baseline tag and a matching data backup; source rollback alone does not reverse future schema/data migrations. A detached checkout of `baseline-leaflet` with its own copied data/port can continue to run beside the new `main` if the old version must remain available.

Do not delete the migration checkout while its server/editor is using it or it contains uncommitted/ignored files you still need. After preserving needed files, use `git worktree remove ../meme-map-maplibre`, or archive an app-managed worktree through Codex. The remote branch, source history and external data backup are separate from worktree cleanup.
