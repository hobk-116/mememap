# HTTP API

**English** · [Tiếng Việt](../vi/API.md)

All API routes are served by `server.py` on the same origin as the pages. Routes require the `mememap_session` cookie except registration/login/logout and `GET /api/me`, as detailed below. JSON request bodies use `Content-Type: application/json`; the server accepts request bodies up to 15 MiB.

## Authentication and profiles

| Method and path | Auth | Purpose |
| --- | --- | --- |
| `GET /api/me` | Optional | Returns `{authenticated, user}`. Signed-in user includes name, username, avatar, meme count, and aura. |
| `POST /api/register` | No | Body: `{name, username, password}`. Creates an account and session. Returns `201`. |
| `POST /api/login` | No | Body: `{username, password}`. Creates a session. |
| `POST /api/logout` | Optional | Deletes the current session and expires the cookie. |
| `GET /api/profiles/{username}` | Yes | Returns public profile details to a signed-in viewer, including `is_self`. |
| `POST /api/profile/avatar` | Yes | Body: `{image}` where image is a base64 data URL for JPEG, PNG, or WebP. Converts and stores as WebP. |

Registration constraints enforced by the backend: display name 1–60 characters; username 3–24 characters and ASCII letters, numbers, dots, or underscores, with an alphanumeric first and last character; password 8–256 printable ASCII characters. The username `admin` is reserved.

## Pins and voting

| Method and path | Auth | Purpose |
| --- | --- | --- |
| `GET /api/pins` | Yes | Returns `{pins, can_delete_pins}`. Pin records include coordinates, title, story, image URL, username, aura, viewer vote, ownership, deletion permission, and timestamp. |
| `POST /api/pins` | Yes | Body: `{lat, lng, title, story, image?}`. Creates a pin and returns `201` with `{pin}`. |
| `POST /api/pins/{id}/vote` | Yes | Body: `{value: 1}` or `{value: -1}`. Same vote toggles off; opposite vote switches the vote. Owners cannot vote on their own pins. |
| `DELETE /api/pins/{id}` | Admin | Deletes a pin. |
| `GET /api/leaderboard?city=hanoi` | Yes | Returns up to 100 users ranked by aura, then pin count. Currently only `hanoi` is supported. |

Meme images are optional. Accepted data URL types are `image/jpeg`, `image/png`, and `image/webp`; source files are limited to 10 MiB. New files are stored under `/uploads/memes/` as WebP. Avatars use `/uploads/profiles/` and are limited to 512 × 512 pixels after conversion.

## Page and media routes

| Method and path | Purpose |
| --- | --- |
| `GET /` or `GET /index.html` | Serves the landing/auth page. |
| `GET /landing.html` | Serves the map to signed-in users; otherwise redirects to `/?login=required`. |
| `GET /assets/default-profile-picture.png` | Public legacy default avatar. |
| `GET /assets/default-profile-picture.webp` | Public default avatar for new accounts. |
| `GET /assets/icon.svg` | Public alternate SVG app icon; current page header uses the PNG icon. |
| `GET /assets/icon-128x.png` | Public header icon. |
| `GET /assets/icon-64x.png` | Public browser-tab icon. |
| `GET /uploads/{memes,profiles}/{random-id}.{ext}` | Serves uploaded media to signed-in users. |

The server intentionally allow-lists the asset paths above; it does not provide a general-purpose static-file route.

It also serves the frontend assets `assets/css/{shared,home,map,admin}.css` and `assets/js/{shared,api,home,map-layout,map-copy,map-pins,map-composer,map-profile,map-leaderboard,map,admin}.js`. They are public and use `Cache-Control: no-cache` so updates are revalidated. Profile uploads retain a private immutable cache keyed by their random URL. Meme uploads use `private, no-store`; each request checks that the meme is visible or the viewer is an admin. Missing, deleted and unauthorized hidden images return 404.

## Moderation and reports

All `/api/admin/*` routes require an authenticated administrator. Responses use JSON and are not cached. `/api/me` includes `user.is_admin`; public pin lists exclude hidden memes even for admins. Hidden memes and their votes are excluded from public profile totals and the leaderboard; restoring them restores their contribution. Voting on hidden memes returns 404.

| Method and path | Parameters / payload | Result |
| --- | --- | --- |
| `GET /api/admin/overview` | `days=1`, `7` (default), or `30` | `{stats:{new_pins,new_users,pending_reports,image_bytes},alerts,days}`. New counts use trailing days; pending reports and image storage are current totals. |
| `GET /api/admin/pins` | `q`, `status=all/visible/hidden`, `image=all/yes/no`, `since`, `until`, `sort=newest/oldest/aura_desc/aura_asc`, `page` | `{pins,total,page,pages}`. Rows include owner, coordinates, content, image, aura, hidden state/reason/time, and `signals`. |
| `POST /api/admin/pins/{id}/moderate` | `{action:"hide"/"restore",reason}` | `{pin}`; hiding requires a reason. No-op visibility changes create no audit entry. |
| `DELETE /api/pins/{id}` | Optional `{reason}` for legacy clients; dashboard requires a reason | Permanently removes meme, votes and stored meme image, preserves audit snapshots, resolves outstanding reports. |
| `POST /api/pins/{id}/reports` | `{reason,detail}`; any authenticated member | 201 `{report:{id,pin_id,status:"pending"}}`. Reasons: `spam`, `harassment`, `inappropriate`, `misleading`, `other`; `other` requires detail. |
| `GET /api/admin/reports` | `status=pending/reviewing/resolved`, `page` | `{reports,total,page,pages}`; groups by meme, with reasons, report count, current content and individual reports. Deleted memes retain title/author snapshots and `pin_deleted:true`. |
| `POST /api/admin/reports/{pin_id}` | `{action:"review"/"dismiss"/"hide",reason}` | `{updated,pin_id,affected}`. Changes unresolved reports; hide also hides the meme. Dismiss/hide require a reason. |
| `GET /api/admin/users` | `q`, `status=all/restricted`, `since`, `until`, `page` | `{users,total,page,pages}`; public meme/aura totals, admin flag, current post/vote restrictions and `signals`. |
| `POST /api/admin/users/{id}/restrictions` | `{scope:"post"/"vote"/"both",action:"restrict"/"lift",duration_hours,reason}` | `{user}`. Durations: 1, 24, 168, 720 hours; lift ignores duration. Reason required. Admin accounts cannot be restricted. |
| `GET /api/admin/audit` | `action`, `actor`, `target_type=pin/user`, `target_id`, `page` | `{entries,total,page,pages}`; each entry has actor username, target snapshot, action, reason and timestamp. |

List pages contain at most 20 records and report at least one page even when empty. Search is a literal substring (SQL wildcard characters are escaped). `since` and `until` use UTC calendar dates (`YYYY-MM-DD`), with the end date inclusive. Timestamps are Unix seconds. Reasons/details are at most 500 characters and search terms at most 120.

A member may have one unresolved report per meme (409 `report_already_open`), and submit up to 10 reports per rolling hour (429 `report_rate_limited`). Restriction checks happen server-side: 403 `post_restricted` or `vote_restricted` also returns `until` and `reason`. Expired restrictions stop applying automatically. 403 `protected_admin` prevents restricting an admin.

Audit action codes: `hide_pin`, `restore_pin`, `delete_pin`, `review_reports`, `dismiss_reports`, `resolve_reports`, `restrict_post`, `restrict_vote`, `lift_post`, `lift_vote`. Audit inserts are committed with their related database action. Update/delete triggers protect audit rows from accidental edits; audit and report snapshots survive permanent meme deletion.

Activity alerts use `posting_burst`, `duplicate_content`, and `vote_burst` with counts and time windows. They do not moderate automatically. See the exact rules in [operator guide](RUNNING.md#moderation-dashboard).

## Common errors

Errors are JSON objects with an `error` field. Relevant values include `invalid_request`, `authentication_required`, `invalid_credentials`, `username_exists`, `invalid_username`, `invalid_image`, `image_too_large`, `webp_conversion_failed`, `outside_map_bounds`, `cannot_vote_own_pin`, `pin_not_found`, and `unsupported_city`. HTTP status codes distinguish malformed input (`400`), unauthenticated access (`401`), forbidden actions (`403`), missing records (`404`), conflicts (`409`), and server/storage failures (`500`).

The map accepts pins only inside the backend rectangle: latitude `20.09` through `21.89` and longitude `104.83` through `106.76`. The leaderboard currently accepts only `city=hanoi` and ranks users by aura, then number of pins, then username.

## Map configuration and profile totals

`GET /api/map-config` requires login (401 otherwise) and returns the following object. `bounds` contains southwest/northeast corners; coordinates use latitude, longitude order:

```json
{
  "bounds": [[20.09, 104.83], [21.89, 106.76]],
  "center": [20.9893, 105.7953],
  "zoom": 18,
  "min_zoom": 11,
  "max_zoom": 19,
  "style": "https://tiles.openfreemap.org/styles/liberty",
  "tiles": {
    "url": "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    "attribution": "&copy; <a href=\"https://www.openstreetmap.org/copyright\">OpenStreetMap contributors</a>"
  }
}
```

`style` is an additive field used by MapLibre; `tiles` is retained for legacy clients, but the current page does not request those raster tiles. Coordinates remain latitude/longitude. Zoom values keep the legacy 256 px tile scale: the current MapLibre client subtracts one from `zoom`, `min_zoom` and `max_zoom` for its 512 px world tile scale (initial zoom 17). Authentication, posting bounds and leaderboard scopes are unchanged.

`meme_count` and `aura` in `/api/me` and `/api/profiles/{username}` cover all visible pins belonging to the author. Filtering the frontend feed does not change these totals. Map configuration does not grant access or determine local/guest status.
