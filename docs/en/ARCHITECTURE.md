# Architecture

**English** · [Tiếng Việt](../vi/ARCHITECTURE.md)

## Request flow

The project is a small same-origin web application. `server.py` serves the HTML pages and JSON API from one host and port; browser `fetch()` calls use the session cookie. The front end is plain HTML, CSS, and JavaScript, with MapLibre GL JS 6.13.0 loaded as an ES module from unpkg and the Liberty vector style/tiles loaded from OpenFreeMap.

```text
Browser
  ├── / or /index.html  → index.html (landing, auth, own profile)
  ├── /landing.html     → authenticated interactive map
  ├── /api/*            → JSON API in server.py
  ├── /assets/*         → allow-listed profile images and app icons
  └── /uploads/*        → authenticated uploaded media

server.py → mememap.app.Application → services → SQLite (mememap.sqlite3) + uploads/{memes,profiles}/
```

The HTML pages provide markup and load separate styles/scripts. MapLibre GL JS is the only map library used by the map page. There is no build step.

| File | Responsibility |
| --- | --- |
| `assets/css/shared.css` | Typography tokens, popup animation, profile components |
| `assets/css/home.css` | Main page layout and account form |
| `assets/css/map.css` | Map, desktop drawers, mobile sheets, pin composer and leaderboard |
| `assets/css/admin.css` | Admin tabs, filters, result lists, summaries, history and moderation popup |
| `assets/js/shared.js` | Image processing and Safari fallback, username suggestion, popup close lifecycle and mobile double-tap guard |
| `assets/js/home.js` | Account UI and main-page profile |
| `assets/js/map.js` | Initialize MapLibre, compose modules and page events |
| `assets/js/api.js` | Shared API client, JSON, errors, expired sessions and cancellation |
| `assets/js/map-pins.js` | Pin loading, markers, popups and votes |
| `assets/js/map-composer.js` | Location selection, image preparation and posting |
| `assets/js/map-profile.js` | Profiles, avatars, logout and backend totals |
| `assets/js/map-leaderboard.js` | Memerboard loading and rendering |
| `assets/js/map-copy.js` | Vietnamese/English map copy |
| `assets/js/map-layout.js` | Shared drawer state, sheet drag gestures, fixed pin/map geometry, temporary selection pin and resize |
| `assets/js/admin.js` | Admin dashboard data and interactions, moderation actions, user reports and localized feedback |
| `mememap/{auth,profiles,pins,moderation}.py` | Business services independent of HTTP handlers |
| `mememap/{app,config,database,migrations,media,regions,errors}.py` | Application composition, settings and foundation services |
| `moderation.py` | Compatibility imports for existing local tools |

The layout controller owns an independent set of open drawers and the shared sheet height. It preserves the geographic point underneath the fixed pin when drawer geometry changes. Normal map panning keeps the pin fixed on screen; choosing a meme location moves it to the selected point whenever the fixed pin is available. It remains available at every mobile sheet level, including `peek`. Only on desktop, with all drawers closed, selection uses a separate temporary MapLibre DOM marker with its own appearance animation. This marker stays at the chosen coordinates, is hidden while any drawer is open, and is removed when the composer closes or saves. Desktop closed-drawer selection does not change the fixed pin's position or layout anchor. Desktop drawers support left and right placement through the `side` setting; the pin is centered between the open panels. On mobile, Menu and Admin occupy the same bottom sheet, with only one active at a time. Switching preserves the geographic anchor, each view's content state and that view's last height level. Dragging updates its height and the map from an absolute geographic anchor. Desktop drawers remain independent. Resizing from desktop to mobile keeps the most recently opened drawer active at the default level, or `peek` if both were closed.

## Pages


### Mobile sheet interactions

On mobile, the placement hint and attribution follow the active sheet’s rendered top edge, including free dragging, release snapping and Memerboard transitions. A sheet ResizeObserver synchronizes their positions before paint; the hint reserves 16 px plus attribution height, and attribution ends 4 px above the sheet. The placement pin keeps its existing geographic-anchor alignment.

At widths up to 600 px, `map-layout.js` owns three sheet levels and their shared action rules:

| Level | Height and presentation |
| --- | --- |
| `peek` | Fits the eyebrow and main heading, with Admin's history button retained; side and bottom insets are 16 px. The whole visible sheet is a drag handle. It replaces full hiding but is not the initial level. |
| `default` | 230 px, limited by the expanded height on short screens; insets are 8 px. This is the initial level and the level when reopening the same closed view. |
| `expanded` | 76% of the cached viewport height, capped at 640 px; insets are 8 px. |

Release snapping follows the drag direction. Crossing one third of the distance from the starting level to its neighbor selects that neighbor. Continuing across the default level by at least one third of the next interval can skip directly between `peek` and `expanded`. Below the default height, insets interpolate from 8 to 16 px. The peek level shows Hà Nội and “Chuyện quanh đây.” in Menu, or the Admin eyebrow and “Quản trị” with the history/back button. Content below the heading is clipped and hidden after the transition. The toggle counts this level as closed, but the mobile fixed placement pin stays visible and usable above the sheet; no separate temporary marker is needed.

Menu/Admin mobile headers keep the same padding and heading margins throughout dragging and snapping. The Admin history button is positioned independently of the eyebrow row, so its presence never changes that row's height. Opening history from the preview expands the sheet. Both footers stay absolutely positioned and use the same `--sheet-collapse` progress to translate down and out of the panel between `default` and `peek`. During dragging the translation follows the finger; after release it shares the sheet's transition duration/easing. Footer visibility changes only after the closing transition, rather than using `display:none` mid-motion. A footer `ResizeObserver` reserves its actual height above the Admin results; hidden history tabs reserve zero space. Preview content is inert immediately to prevent keyboard or pointer activation while it exits, without changing its layout.

The shared `sheetRules.actions` define height changes used by `setOpen` and `applyAction(id, action)`: closing the active Menu/Admin goes to `peek`, reopening that same active view goes to `default`, search/filter and every Admin tab go to `expanded`, and Menu pin selection returns to `default`. Switching between sibling Menu/Admin buttons saves the departing view's level and restores the destination's own level, including `peek`; a view's first opening uses `default`. This page-local memory applies only to sibling switches and is separate from subview return memory. Clicking the active Admin tab also expands without resetting its filters. The four Admin tabs occupy the mobile footer. `setExpanded` remains a convenience wrapper for search/pin actions; desktop drawers retain their existing behavior.

Focusing or typing in Menu/Admin search fields and selecting a filter expand the active sheet through delegated events, including dynamically rendered Admin fields. Starting a drag is supported through the Menu search row, Admin filter form, and leaderboard city selector. Plain areas start dragging after 4 px; interactive controls require 8 px of predominantly vertical movement. Movement is observed even if the pointer leaves the handle before capture. Taps retain their normal input/button behavior; a completed drag suppresses its incidental click. Result lists continue to scroll independently.

Opening Memerboard with `setSubview(id, view, {onReady})` expands the sheet for 250 ms and calls `onReady` immediately to start its 280 ms horizontal slide at the same time, restoring the original animation speed. If already expanded, only the slide is needed. There is no delayed reveal to cancel. Only the Memerboard return button calls `setSubview(id, null, {restore:true})` to restore the saved main-view level. Sibling Menu/Admin switches preserve this separate return level and the open subview. Closing/reopening the active Menu resets the return level to `default`; other exits use `{restore:false}`. Future subviews can reuse this interface. On mobile, the leaderboard heading and city selector remain outside the scrollable results. Selecting a pin from the Menu collapses to `default` before opening its popup; voting and moderation controls do not collapse it. The placement hint is centered and fits its text within the available width.

Mobile UI surfaces use `touch-action: manipulation` and a shared single-touch fallback that suppresses a second tap on the same UI element within 300 ms. This covers both pages' buttons, sheets and popups, including MapLibre popup content. Editable fields and the map's gesture surface are excluded from the fallback; multi-touch clears its tap state. Map pinch zoom remains available. Chromium emulation does not establish native Safari/iOS behavior.

On desktop and mobile, the unchanged fixed placement button lives in a screen overlay at `z-index:650`, above MapLibre DOM markers (`600`) and below meme popups (`700`). It stays at screen coordinates during panning and zooming without compensating an engine pane. These elements remain inside the map's isolated stacking context, below the app header, sheets and screen buttons. The existing green emoji markers, dark red placement pin (`#d62f1f`), popup content and drawer/sheet behavior are retained. Only desktop hides/disables the fixed button when all drawers are closed; mobile keeps it above the heading-only preview.

Mobile page height is held at its pre-keyboard value while a sheet input is focused, and through keyboard closing while the visual viewport remains over 120 px shorter. The sheet expands immediately on input focus so its search field is higher before the keyboard opens. The page does not lift its footer above the keyboard; the keyboard may cover lower results and the footer until dismissed. Normal viewport resizing resumes afterward, and width changes still update the responsive layout. The mobile document is fixed with outer scrolling disabled, while result lists retain scrolling. Keyboard detection is heuristic because the [visual viewport](https://developer.mozilla.org/en-US/docs/Web/API/VisualViewport) can change independently of the layout viewport. Chromium viewport simulations do not establish native Safari/iOS/Android keyboard behavior; verify those devices before release.

### `index.html`

The entry page provides bilingual instructions and account registration/login. After authentication it offers the map link and the signed-in user's profile panel. The default profile image for newly created accounts is `assets/default-profile-picture.webp`.

On both pages, opening the signed-in user's profile from the header profile icon shows a sign-out row. Profiles opened through pins, the leaderboard or Admin do not show that row, even when the profile belongs to the viewer. Sign-out actions ask for confirmation in the selected language; canceling preserves the session. Signing out from the map returns to the home page.

### `landing.html`

The Menu and Admin toggles sit on the same row below the top action bar. Both use the same button shape and corner radius; Admin is visible only to admins. On desktop, Menu and Admin open and close independently and may be visible together. On desktop, the panels' top edges align with the toggle row; the buttons sit beside the inner edges of their open panels and return to the outer screen edges when closed. Panels narrow on smaller windows when both are open, leaving room for the buttons between them. On mobile, the buttons stay below the top bar and switch between Menu and Admin in one bottom sheet, restoring each sibling view's own last level. Pressing the active view's button reduces it to the heading-only peek level; pressing it again reopens at default height. Zoom controls are positioned below the button row on mobile, while attribution remains at the bottom of the map.

The map page starts at latitude `20.9893`, longitude `105.7953`, legacy/API zoom `18` (MapLibre zoom `17`). It provides map browsing, pin creation, pin details, user profile views, aura votes, the Hà Nội Memerboard, and an admin dashboard. The map's current bounds are also enforced by the backend when creating pins: latitude `20.09`–`21.89` and longitude `104.83`–`106.76`.

Selecting a pin from the Menu's pin list moves the map to that pin and opens its popup. The zoom becomes the higher of the current zoom and the default `zoom` supplied by `/api/map-config`, converted by subtracting one: closer views are preserved, while wider views are raised to the configured default. The pin controller receives that default from the page composition rather than hard-coding a zoom level.

The dashboard initially opens Overview and exposes Memes, Reports, and Users as sibling tabs. History is a subview with a back action. Tabs and filters are held in page memory, not saved across page reloads. Administrative reads are enabled only for an admin session; signed-in members use the reporting form from a meme. `admin.js` and `admin.css` are loaded on the map page, while the home page remains separate. The dashboard and its action popup support both Vietnamese and English and share the existing popup animation.

Popup HTML is cached per marker, so an unchanged feed refresh reuses both the marker and its content; votes and language/content changes still update the active popup.

Pins are fetched at page load and refreshed every 10 seconds while the tab is visible. The leaderboard is refreshed on the same interval while its panel is open. The browser stores the language choice in `localStorage`; the one-time welcome-guide flag after registration uses `sessionStorage`.

MapLibre 6.13.0 and its CSS are pinned on unpkg; the ESM library resolves its matching worker through a Blob URL. `/api/map-config` adds the OpenFreeMap Liberty `style` URL; the legacy `tiles` field remains for compatibility. API latitude/longitude values are converted to longitude/latitude only at the MapLibre boundary. Subtracting one from legacy zoom values preserves the Mercator pixel scale (512 px versus 256 px world tiles). Rotation and pitch gestures are disabled to retain the flat map UI. Attribution comes from the style sources through MapLibre's attribution control. It is placed above the mobile sheet and inside the available desktop map area; the hint reserves its height without moving the placement pin. The app does not bundle map data. Module/CSS/initialization, style/tile/worker and WebGL context-loss errors show bilingual map feedback; reload after checking connectivity/browser support. Page teardown clears the refresh timer and removes the map. Check [MapLibre](https://maplibre.org/maplibre-gl-js/docs/) and [OpenFreeMap](https://openfreemap.org/quick_start/) documentation before changing the pinned dependencies or hosting policy.

The UI header icon is `assets/icon-128x.png`; the tab icon is `assets/icon-64x.png`. Both are explicitly allow-listed in the server's asset route.

### Archived page

The historical page is preserved as [`archive/index_old.html`](../../archive/index_old.html). It is a reference snapshot, not a current entry page, and is not served by the application.

## Backend and persistence

`server.py` uses a `MemeMapHTTPServer` subclass of Python's `ThreadingHTTPServer`, `BaseHTTPRequestHandler`, `sqlite3`, and other standard-library modules. Its connection backlog is 128 rather than the small standard-library default, to accommodate simultaneous page asset connections. This is a connection queue, not a request rate limit. It creates or migrates the database on startup.

| Table | Purpose |
| --- | --- |
| `users` | Display name, internal email field, username, avatar path, admin flag, password hash/salt, creation time, scoped restriction expiry/reason |
| `sessions` | Hashed session token, user reference, expiry |
| `pins` | Owner, coordinates, title, story, optional image path, creation time, moderation visibility |
| `pin_votes` | One `-1` or `+1` vote per user per pin, with timing information for activity signals |
| `pin_reports` | Reporter and meme snapshots, reason/details, review status and resolution; survives meme deletion |
| `admin_audit` | Immutable action records with actor/target snapshots and reason; survives meme deletion |
| `vote_events` | Successful vote action timestamps for burst detection, pruned after 30 days on subsequent votes |
| `schema_migrations` | Applied migration version, name and timestamp |

Passwords are stored as PBKDF2-derived hashes with per-user random salts. Session tokens are random; only their SHA-256 hashes are stored. Sessions last 30 days. User-uploaded files receive random names and are split between meme and profile folders. The database and uploads directory must be backed up as a pair.

Existing account avatar paths are backfilled to the PNG default when needed; newly registered accounts use the WebP default. On startup, the server migrates legacy upload paths into the separated folders.

## Image handling

- Accepted input: static JPEG/JPG, PNG, and WebP; animated images are not supported by the current upload forms/API.
- Maximum source upload: 10 MiB for a meme image and for an avatar.
- New uploaded media is encoded/stored as WebP. If the browser cannot encode WebP, the server invokes `cwebp`.
- Avatars are resized in the browser so their longest edge is at most 512 pixels and are checked against that limit by the server.
- Meme images are resized in the browser so their longest edge is at most 1600 pixels before submission. They are not currently resized to a fixed maximum output byte size.
- Browser canvas conversion targets WebP quality 0.82. If the browser cannot encode WebP, it submits PNG for server-side WebP conversion, preserving transparency. Browser and server checks reject animated WebP/APNG inputs.
- Uploaded files are served only to signed-in users. Default profile assets are public.

## Authentication and admin access

Registration and login use usernames. The database retains a legacy `email` column internally, populated with a reserved placeholder for newly registered accounts; the current UI does not collect an email address.

Admin privileges are represented by `users.is_admin`. Every administrative API checks that flag on the server. There is no public admin bootstrap endpoint; admin provisioning is an operator/database action. Do not publish credentials or grant the flag to untrusted accounts.

New registration reserves the username `admin`; that name alone does not grant admin privileges. See the operator instructions in [local operation](RUNNING.md#admin-account-provisioning) to grant the flag to an existing account.

### Moderation behavior

Hiding a meme retains its row, votes, and image so an administrator can restore it. Hidden memes are excluded from the ordinary map feed, profile meme/aura totals, and leaderboard. They cannot receive votes. The admin meme list remains the place to review hidden content and its reason. Permanent deletion removes the meme, its votes, and stored image; the action history retains a snapshot identifying the deleted content.

Reports are submitted by signed-in users and grouped by meme in the admin queue. Review state and the eventual decision are stored. A duplicate report from the same person for the same meme does not create another queue entry.

Posting and voting restrictions are separate, have a reason and expiry, and are checked by the server for each attempted write. Expiry takes effect without a scheduled cleanup job. Restricting oneself or another administrator is rejected. A restriction does not prevent signing in or reading the map.

Activity alerts use simple rules over stored actions. They are review signals, not proof of abuse, and do not automatically hide content or restrict accounts. The dashboard's time windows and exact thresholds are documented in [operator guide](RUNNING.md#moderation-dashboard).

## Product notes

Current priorities and the merged Sticky Note are tracked in [development recommendations](RECOMMENDATIONS.md). Add new supported cities consistently to both the map/client behavior and backend city bounds/leaderboard configuration.

The Hà Nội leaderboard rectangle (`Regions.leaderboards`) is narrower than the map's permitted pin rectangle (`Regions.posting`). A pin allowed near the outer map edge may therefore be excluded from that city leaderboard. The current profile location is a fixed Hà Nội label, not reverse-geocoded data.

## Foundation contracts after refactoring

`Application(Settings(...))` owns instance-specific database, media storage and services. `create_server()` attaches that instance to an HTTP server; tests can call services directly or run servers with independent data. Services take data and an actor and return results or `RequestError`; the adapter handles status, cookies and JSON.

`migrations.py` applies ordered migrations under `BEGIN IMMEDIATE`; schema changes and version records commit together. A schema newer than the application is rejected. Legacy images are copied before commit and originals removed only after success. Conflicting destination contents stop migration for operator review, preserving both files.

Home, map modules and Admin use `api.js`. `ApiError` retains the error code, HTTP status and details such as restriction reasons. Only `authentication_required` invokes the login redirect; `invalid_credentials` remains a form error. Cancellation is preserved and writes are not automatically retried.

Profile meme/aura totals come from all visible pins belonging to the author in the database, never from the currently loaded map feed. Profile refreshes discard obsolete responses after switching or closing the profile. The feed still loads all pins every 10 seconds; pagination and geographic filtering are not implemented yet.

`regions.py` supplies the current scopes. The frontend reads `/api/map-config`; pin creation enforces the same posting bounds on the backend. Posting and Hà Nội leaderboard rectangles remain deliberately distinct to preserve existing behavior. They are not administrative polygons or community permissions.

Future community work must separate geography from membership: at most one community per level, with home ward and school chosen independently. The backend will determine local/guest for each community, and both require login. This refactor does not add memberships, polygons, local/guest permissions or Android/iOS apps. The current map uses MapLibre/OpenFreeMap; community features remain separate proposals.
