# Local operation

**English** · [Tiếng Việt](../vi/RUNNING.md) · [Documentation index](README.md)

For public access, use [Cloudflare Tunnel deployment](DEPLOYMENT.md). Data protection and check commands are in [backups](BACKUP.md) and [testing](TESTING.md).

## Requirements

- Python 3.10 or newer.
- `cwebp` available on `PATH` for reliable conversion of JPEG/PNG uploads, including Safari fallback uploads. On macOS with Homebrew: `brew install webp`.

The application has no package manager manifest or third-party Python dependency. Leaflet and map tiles are loaded by the browser from external services, so browser access to those services is required for the map to render.

## Start and stop

From the repository directory:

```sh
python3 server.py
```

Open `http://localhost:8000`. Stop the server with `Ctrl+C` in the terminal where it is running.

Restart after changes to `server.py` or modules in `mememap/`, including the asset allow-list. HTML/CSS/JavaScript changes are read from disk and normally require a browser reload only. All active page assets must be served through this server; opening the HTML as a local file or using a static preview server does not supply authentication or the API.

The default bind address is `0.0.0.0` and default port is `8000`. To override them for one run:

```sh
MEMEMAP_HOST=127.0.0.1 MEMEMAP_PORT=8000 python3 server.py
```

For another device on the same LAN, open `http://<computer-lan-ip>:8000`. The host firewall must allow inbound connections to the chosen port. Tailscale access depends on both devices being connected and allowed by the tailnet's access rules.

## Environment variables

| Variable | Default | Meaning |
| --- | --- | --- |
| `MEMEMAP_HOST` | `0.0.0.0` | Address for the HTTP server to bind. |
| `MEMEMAP_PORT` | `8000` | TCP port for the HTTP server. |
| `MEMEMAP_DB_PATH` | `mememap.sqlite3` | Database path; relative paths resolve from the repo. |
| `MEMEMAP_UPLOADS_PATH` | `uploads` | Media directory; relative paths resolve from the repo. |
| `MEMEMAP_SECURE_COOKIE` | `0` | Set to `1` to add `Secure` to session cookies over HTTPS. |

## Admin account provisioning

There is no admin creation screen or bootstrap credential in the repository. First register and sign in normally with the account that should administer pins. Stop the server, then run this from the repository directory, replacing `your_username` with that account's username:

```sh
sqlite3 mememap.sqlite3 "UPDATE users SET is_admin = 1 WHERE username = 'your_username' COLLATE NOCASE;"
```

Restart the server and sign back in. To verify or revoke the role:

```sh
sqlite3 mememap.sqlite3 "SELECT username, is_admin FROM users WHERE username = 'your_username' COLLATE NOCASE;"
sqlite3 mememap.sqlite3 "UPDATE users SET is_admin = 0 WHERE username = 'your_username' COLLATE NOCASE;"
```

The `admin` username is reserved during registration but is not automatically privileged. Keep the database private; anyone who can modify it can grant themselves admin access.

## Moderation dashboard

Restart the server after backend updates. `Application.initialize()` applies missing migrations recorded in `schema_migrations`: 1 — accounts/pins, 2 — moderation, 3 — upload folders. Existing databases without a version ledger are adopted without discarding data. Schema and version records commit together; legacy images are copied first and originals removed only after commit. An interruption before commit can be retried. Conflicting image contents stop migration and retain both files for review instead of overwriting. A database newer than the code is rejected. Back up database and media together before upgrading.

The Admin drawer has four sections: Overview, Memes, Reports, and Users. Action history is available from the dashboard header. Menu and Admin open independently on desktop and share one bottom sheet on mobile; moderation does not require a separate admin page.

- **Hide/restore:** find a meme in Memes, review its details, then hide it with a reason. Hidden memes disappear from the public map and public aura/meme totals. Restore makes the retained content and votes visible again. Permanent deletion removes the uploaded meme image as well, so use Hide for reversible moderation.
- **Reports:** users report memes from the meme detail view. The admin queue groups reports about the same meme. Review the evidence and either hide the meme or dismiss the report with a note. A report is a request for review; filing one does not hide the meme automatically.
- **Restrictions:** find an account in Users and restrict posting, voting, or both until the chosen expiry. Restrictions are checked on the server, even if the person keeps an old browser tab open. Removing a restriction is also recorded. Admin accounts and the acting administrator cannot be restricted from this interface.
- **History:** hide, restore, permanent deletion, report handling, and restriction changes record the acting administrator, target, timestamp, and reason. Deleting a meme does not remove the action that explains its deletion.

Hidden meme media requires an admin session and uses cache headers that require rechecking permissions. Hiding content cannot retract a copy that somebody already downloaded or captured before the action.

The dashboard does not grant or revoke administrator roles. Role provisioning remains the operator action described above.

The restriction durations offered are 1 hour, 24 hours, 7 days and 30 days. Expiry is checked on each post/vote request and needs no scheduled job. Reports are limited to one unresolved report per person per meme, and ten submissions per rolling hour.

Overview counters use the last 24 hours, 7 days or 30 days. Image storage includes the current files in both upload folders; pending report totals include reports being reviewed. Spam signals use fixed recent windows, independent of the overview counter period:

- `posting_burst`: at least 5 memes by one account in 10 minutes.
- `duplicate_content`: at least 3 memes with identical normalized title and text by one author in 24 hours (Unicode normalization, case folding, collapsed whitespace). Images are not compared.
- `vote_burst`: at least 20 successful vote actions by one account in 10 minutes, including toggles. New vote events are retained for up to 30 days and pruned on subsequent votes. Legacy votes do not acquire invented event timestamps.

Signals also appear in the meme/user lists. Review the evidence before taking action. These are simple thresholds, not an automatic abuse classifier.

## Troubleshooting

- **The map is blank:** check browser network access to the Leaflet CDN and tile host, then inspect the browser console. A tile-provider block can prevent the background map from loading while the local web server is still responding.
- **Uploads fail with a conversion error:** install `cwebp`, ensure it is on the server process's `PATH`, then restart the server.
- **Another device cannot open the page:** confirm the server is running, use the host's current LAN IP and port, and allow inbound traffic in the host firewall. `localhost` on a phone refers to the phone itself.
- **A pin or avatar has a broken image:** ensure the referenced file under `uploads/` exists and restore the database and media directory from the same backup.
