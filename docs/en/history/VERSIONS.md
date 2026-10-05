# MemeMap version history — 0.0.x

**English** · [Tiếng Việt](../../vi/history/VERSIONS.md) · [Documentation index](../README.md) · [Changelog](../../../CHANGELOG.md)

Compiled on **04/10/2026**, following the owner's request to start at **0.0.1**, remain in **0.0.x**, and not advance to **0.1.0**. The last summarized milestone in this document is **0.0.38**.

## Interpretation and sources

These development milestones are numbered retrospectively from the conversation and repository documentation. They are not published releases, Git tags or individually check-outable source snapshots. Git currently contains one commit, `4ea8a00`, titled `Initial MemeMap project`, dated 01/10/2026, and no tags; there is insufficient evidence to associate each milestone below with a commit.

Small iterations toward the same goal are grouped by meaningful outcome. The order represents development at the group level; interleaved work is not presented as an exact commit sequence. Early milestones without individual completion dates are explicitly marked **date unknown**. Later dates come from the changelog/history, not release records. 04/10/2026 is this document's compilation date, not the completion date of every feature.

The existing 0.0.1–0.0.20 labels are retained. Milestones 0.0.21–0.0.38 already summarize some cross-chat work. At the owner's request, 0.0.21 starts the detailed chronology from the first editing request in **Refractor**, rather than only listing changes absent from those summaries. Overlap is a second view of the same work, not a second implementation or release. Dates for the continuation are drawn from chat records in the project timezone. All test results below are historical, not checks rerun for this documentation update.

- **S1 — Conversation:** product decisions and iterations, cross-checked against [current architecture](../ARCHITECTURE.md), [API](../API.md), both pages' copy and relevant modules so requests alone are not treated as completion evidence.
- **S2 — Refactor history:** [earlier UI and foundation work](REFACTOR_2026-10-02.md).
- **S3 — Existing changelog:** [dated changes and historical verification](../../../CHANGELOG.md).
- **S4 — Operation and planning documents:** [local operation](../RUNNING.md), [backups](../BACKUP.md), [deployment](../DEPLOYMENT.md), [testing](../TESTING.md), [Git](../GIT_WORKFLOW.md), [recommendations](../RECOMMENDATIONS.md), [earlier Admin notes](MODEL_AND_ADMIN_NOTES.md) and [archive](../../../archive/README.md).
- **S5 — Chat review on 04/10/2026:** all accessible history in the nine MemeMap-related chats listed below, with duplicate turns inherited by forks counted once. Editing/tool records and completion reports distinguish implemented changes from questions and proposals.

The changelog continues recording work by date under `Unreleased`. This document offers a milestone view; current architecture/API documentation describes the active behavior where earlier behavior has been superseded.

## Group 1 — Core product

*Versions: `0.0.1–0.0.5`.*

### 0.0.1 — Rebuilt map interface

*Date: unknown. Sources: S1 and the archived HTML page.*

- **Changed:** restarted the MemeMap interface, retaining the old page as a reference named `index_old.html`.
- **Changed:** centered the Leaflet map around Hanoi University; settled on `20.9893, 105.7953` and zoom `18` after trying other zoom levels.
- The historical page was later moved to `archive/index_old.html` at milestone 0.0.30.

### 0.0.2 — Separate home/map pages and English

*Date: unknown. Sources: S1, architecture.*

- **Changed:** `index.html` became the home/introduction/guide page; `landing.html` became the interactive map.
- **Added:** English alongside Vietnamese.
- **Added:** an in-page quick guide on the map instead of navigating back to the home page.

### 0.0.3 — Username registration and login

*Date: unknown. Sources: S1, API and account implementation.*

- **Added:** registration, login and sessions; the map entry button responds to authentication state.
- **Changed:** hid email from the form and used usernames for login; suggested usernames from display names.
- **Fixed:** Vietnamese normalization in username suggestions, including accented cases such as `ạ`, `ầ`, `ẳ`; backend username/password validation. Input hints were adjusted for registration/login modes.

### 0.0.4 — Persistent pins and aura voting

> **Major milestone — minor candidate:** Core product: accounts, pins and voting.

*Date: unknown. Sources: S1, API.*

- **Added:** stored pins with coordinates, title, content and author; displayed the author's username.
- **Added:** positive/negative aura voting, switching votes and removing a vote by selecting it again.
- **Changed:** authors cannot vote on their own pins; buttons are disabled and the backend checks permission.
- **Added:** refreshing pins/aura every 10 seconds while the page is visible.

### 0.0.5 — Hà Nội Memerboard

*Date: unknown. Sources: S1, API and leaderboard module.*

- **Added:** a leaderboard ordered by aura and pin count, initially supporting Hà Nội only.
- **Changed:** Memerboard became a Menu subview, with a back button and directional horizontal transitions.
- **Changed:** finalized the Vietnamese name as “Nông trại hào quang”; ranks 1/2/3 use gold/silver/bronze, with the default color for later ranks. These later copy/color changes are grouped with their feature.

## Group 2 — Interface and profiles

*Versions: `0.0.6–0.0.15`.*

### 0.0.6 — Fixed placement pin and map movement

*Date: unknown. Sources: S1, S2.*

- **Added:** a placement pin centered in the visible map area after accounting for the Menu.
- **Changed:** the pin stays at a screen position while the map pans; choosing a posting location moves it to that point, and closing the composer returns it to its idle state.
- **Fixed:** coordinated pin/map positioning when toggling the Menu or resizing the window, reducing chasing motion and missing-pin behavior.
- Fade and speed iterations are grouped with this flow; the latest mobile rules are recorded in 0.0.33–0.0.36.

### 0.0.7 — Draggable mobile sheets

*Date: unknown. Sources: S1, S2.*

- **Added:** a bottom sheet for the mobile Menu, scrollable results and touch control.
- **Fixed:** the sheet edge jumping to the finger at drag start and gradual eastward map drift after repeated dragging.
- **Changed:** extended the drag area to the heading, adjusted Menu/Admin buttons, the Menu label and mobile zoom placement.
- Button/sheet layouts went through several revisions; milestones 0.0.24 and 0.0.33–0.0.36 describe later replacements.

### 0.0.8 — Guide popup and meme placement actions

*Date: unknown. Sources: S1, current interface.*

- **Changed:** the top-bar quick guide opens a popup; guide content is synchronized between both pages.
- **Changed:** popups use the placement composer's shared animation; new registration opens the welcome guide.
- **Changed:** the location prompt became the “Đặt ghim mới hoặc chạm vào bản đồ” button with the same composer action; redundant placement buttons were removed during interface iterations.

### 0.0.9 — Meme images and map bounds

*Date: unknown. Sources: S1, architecture, API.*

- **Added:** server-side meme image storage, random filenames and image preparation/compression before submission.
- **Changed:** limited source images to 10 MiB, accepted static JPG/JPEG/PNG/WebP and displayed requirements below the image field; animated images remain unsupported.
- **Changed:** expanded the map from a smaller area around the default point to roughly 100 km; the backend currently uses latitude `20.09`–`21.89` and longitude `104.83`–`106.76`.
- WebP for all new images and Safari compatibility were completed in 0.0.13. These bounds form a rectangle, not an administrative boundary or an exact circle.

### 0.0.10 — Initial administrator role and panel

*Date: unknown. Sources: S1, API and architecture.*

- **Added:** administrator permission to delete users' pins, initially exposed in the pin list.
- **Added:** a separate Admin panel and a role-dependent toggle.
- **Fixed:** overlapping Menu/Admin panels or controls, drifting icons, missing pins and unintended map movement while switching panels.
- This document does not reproduce prototype passwords. Admin permission is currently checked through `is_admin`, not granted merely by the username `admin`; provisioning is documented in the operation guide.

### 0.0.11 — Bilingual guide copy and terminology

*Date: unknown. Sources: S1 and interface copy.*

- **Changed:** used “Meme” in the posting form and “đăng meme” in the guide; shortened unnecessary descriptions.
- **Changed:** “Canh tác hào quang”/“Aurafarm”, `+aura`/`−aura` formatting and “Nông trại hào quang” for Vietnamese Memerboard.
- **Changed:** used US/Vietnamese flags for language switching and shortened the location label to Hà Nội, still a fixed label.

### 0.0.12 — User profiles

*Date: unknown. Sources: S1, API.*

- **Added:** header profile icons on home/map pages; profiles show an avatar, display name, username, Hà Nội, meme count and aura.
- **Changed:** centered name/username beneath the avatar, with a bold name and smaller username; positive aura has no plus sign and negative aura retains its minus sign.
- **Added:** author profiles from pin usernames and from names/usernames in Memerboard.
- **Fixed:** profile entry on the home page, profile popups appearing beneath the map and missing avatars for other users.

### 0.0.13 — Avatar uploads, WebP and Safari

> **Major milestone — minor candidate:** Profiles and image processing.

*Date: unknown. Sources: S1, S2, architecture and API.*

- **Added:** clicking one's own avatar to select a new image; separate `uploads/memes/` and `uploads/profiles/` storage.
- **Changed:** all new uploads are stored as WebP; avatars are at most 512 × 512 px, and meme images are resized to a longest edge of 1600 px in the browser. No fixed output-byte ceiling is enforced.
- **Changed:** new accounts use the default WebP avatar; the PNG remains compatible with older account paths. Avatars share the static-image rules and 10 MiB input limit; the requirement hint is hidden in the profile.
- **Fixed:** browsers that cannot encode WebP submit PNG for server-side `cwebp` conversion. Simulated fallback checks do not establish real Safari coverage.

### 0.0.14 — Profile presentation and fade-out

*Date: unknown. Sources: S1, S2.*

- **Changed:** desktop profiles opened from the account icon appear at the top right beneath the action bar without dimming the background; profiles opened from pins retain a centered popup, including one's own pins.
- **Fixed:** preserved the presentation through fade-out, preventing a jump to the center while closing.
- **Changed:** author links underline on hover only; late profile responses cannot overwrite another newly opened profile or reopen a closed panel.

### 0.0.15 — Branding and home-page copy

*Date: unknown. Sources: S1 and current interface files.*

- **Changed:** settled on Nunito after trying Space Grotesk, Comic Sans and VNF-Comic Sans.
- **Changed:** tried `☺︎` and SVG, then used `assets/icon-128x.png` in the page to address rendering issues; tabs use `assets/icon-64x.png`.
- **Fixed:** the Vietnamese title stays “MemeMap — Trang chính” after login; English uses “MemeMap — Home”.
- **Changed:** the footer reads “Vibe-coded by GPT-6 Luna & Sol ✳”.

## Group 3 — Code structure and administration

*Versions: `0.0.16–0.0.20`.*

### 0.0.16 — UI refactor and accumulated fixes

*Date: not recorded separately. Source: S2, earlier UI refactor section.*

- **Changed:** extracted CSS/JavaScript from both HTML pages; shared typography, popups, profiles and image processing.
- **Changed:** centralized pin/map/button/sheet geometry in `map-layout.js`, using an absolute geographical anchor.
- **Fixed:** reused markers across refreshes, retained open popups, waited for image processing before posting and discarded old image results after a new selection.
- **Fixed:** closed SQLite connections after use, updated avatars transactionally and removed the correct old image; explicitly served assets with cache policies.
- **Added:** backend/browser checks with disposable databases and media. Historical outcomes are in the refactor record.

### 0.0.17 — Second interactive placement pin

*Date: unknown. Sources: S1, S2 and architecture.*

- **Added:** a temporary marker with its own animation when choosing a location with panels closed; it stays at the selected coordinates and is removed on cancel/save.
- **Added:** opening pin placement directly from the fixed placement pin.
- **Later change:** from 0.0.36, the temporary marker is desktop-only when all drawers are closed; mobile uses the fixed pin even at the smallest sheet level.

### 0.0.18 — Opposite-side desktop Admin drawer

*Date: unknown. Sources: S1, architecture.*

- **Changed:** moved Admin opposite the Menu, allowing both desktop drawers to remain open together.
- **Changed:** positioned Admin below the profile row, aligned with the Menu toggle and using matching rounded corners; panels align with the toggle row.
- **Changed:** map layout accounts for the space between both drawers. Later milestones replace mobile arrangements.

### 0.0.19 — Complete moderation dashboard

> **Major milestone — minor candidate:** Moderation system.

*Date: not recorded separately. Sources: S1, API and operation docs; initial proposals checked against S4.*

- **Added:** Overview, Memes, Reports and Users tabs; history is a subview with a back action.
- **Added:** meme search/filter/sort, map previews, reasoned hide/restore and permanent deletion through administrative actions.
- **Added:** authenticated meme reports grouped by meme, with review states; one unresolved report per person/meme and at most 10 submissions in a rolling hour.
- **Added:** separate or combined posting/voting restrictions for 1 hour/24 hours/7 days/30 days, with history and expiry enforcement.
- **Added:** statistics and `posting_burst`, `duplicate_content`, `vote_burst` signals for human review, without automatic penalties.
- **Security:** backend authorization; hidden memes are excluded from feeds/profile totals/leaderboards and cannot receive votes; history/reports retain snapshots after deletion. Hidden meme media is admin-only.

### 0.0.20 — README and Vietnamese documentation

*Date: not recorded separately. Sources: S1 and existing document pairs.*

- **Added:** repository README, architecture, API and operation guides; moderation documentation after implementation.
- **Added:** Vietnamese README, technical translations and an index, preserving command/API/field names.
- **Changed:** compared proposals with implemented functionality and identified remaining work. Documentation layout was reorganized at 0.0.30.

## Group 4 — Foundation improvements

*Versions: `0.0.21–0.0.25`.*

### 0.0.21 — Logout from the account-icon profile

*Recorded date: 02/10/2026. Sources: S5, cross-checked with S2–S4 and relevant source where applicable.*

- **Added:** Sign out on home/map only when the signed-in user opens their own profile through the account icon.
- **Changed:** Profiles opened through pins, Memerboard or other entry points do not show this action, even when they belong to the viewer. Signing out on the map returns to the home page.
- **Historical verification:** The chat records desktop/mobile checks in Vietnamese/English. The confirmation step was added next, in 0.0.22.

### 0.0.22 — Logout confirmation

*Recorded date: 02/10/2026. Sources: S5, cross-checked with S2–S4 and relevant source where applicable.*

- **Added:** A Vietnamese/English confirmation before signing out from either page; canceling keeps the session and current page.
- **Historical verification:** The recorded checks cover confirmation/cancellation at desktop/mobile sizes in both languages.

### 0.0.23 — Shared mobile Menu/Admin sheet

*Recorded date: 02/10/2026. Sources: S5, cross-checked with S2–S4 and relevant source where applicable.*

- **Changed:** Menu and Admin use one mobile sheet with content switching. Desktop retains two independent drawers.
- **Changed:** The initial switching behavior preserved sheet height, filters and placement state. Later action and memory rules are recorded at 0.0.33 and 0.0.36.
- **Historical verification:** The chat records mobile dragging/switching and adjacent Admin flows; this entry does not establish real-device coverage.

### 0.0.24 — Modular backend/frontend foundation

> **Major milestone — minor candidate:** Architecture and API foundation.

*Recorded date: 02/10/2026. Sources: S2 and S3.*

- **Changed:** separated the HTTP adapter in `server.py` from `mememap/` services; `Application(Settings(...))` owns instance-specific database, media and services.
- **Added:** versioned migrations in `schema_migrations`, rollback/retry, media copying before commit and conflict handling; environment-based data paths and cookie settings.
- **Changed:** shared `api.js`; split map responsibilities into pins, composer, profile, leaderboard, copy and layout. Profile totals come from the database independently of the loaded feed.
- **Added:** `GET /api/map-config` and centralized geographical configuration; posting and Memerboard bounds remain separate.
- **Behavior already present at this record:** mobile Menu/Admin share one sheet; logout is offered only from the viewer's header profile and asks for confirmation. The dated editing sequence is detailed at 0.0.21–0.0.24.
- **Historical verification:** the record reports 22 Python tests, API-client checks and six browser suites passing on 02/10/2026; these are not results from writing this document.
- **Detailed chronology:** 0.0.21–0.0.25; these entries describe the same work.

### 0.0.25 — Postponed annotation evaluation

*Recorded date: 02/10/2026. Sources: S5, cross-checked with S2–S4 and relevant source where applicable.*

- **Fixed:** Added `from __future__ import annotations` to `mememap/auth.py`, `mememap/media.py` and `mememap/pins.py` after `TypeError: unsupported operand type(s) for |: 'type' and 'NoneType'` on an older Python interpreter.
- **Historical verification:** The source edits are recorded and remain present. The original test attempt failed because the sandbox denied socket binding (`PermissionError`), and the turn was interrupted. That attempt is blocked verification, not a passing suite or proof of compatibility with every older Python version.

## Group 5 — Development workflow

*Versions: `0.0.26–0.0.30`.*

### 0.0.26 — Initial root agent instructions

*Recorded date: 03/10/2026. Sources: S5, cross-checked with S2–S4 and relevant source where applicable.*

- **Added:** `AGENTS.md` establishes Cloudflare Tunnel as the default public prototype route from a PC/VPS, with public HTTPS and HTTP only between the tunnel and localhost.
- **Added:** Questions and capability checks are informational; editing requires an explicit owner request. This milestone changes policy documentation, not application behavior.

### 0.0.27 — Verification tiers and check commands

*Recorded date: 03/10/2026. Sources: S5, cross-checked with S2–S4 and relevant source where applicable.*

- **Added:** Different check scopes for documentation, simple HTML/CSS, small features and broad refactors/major features; backend, API-client and browser commands with coverage guidance.
- **Changed:** Require disposable test data and honest reporting of passing, failed or unavailable checks. The L0–L4/module-count policy is formalized at 0.0.29.

### 0.0.28 — Vietnamese agent guide

*Recorded date: 03/10/2026. Sources: S5, cross-checked with S2–S4 and relevant source where applicable.*

- **Added:** `docs/vi/AGENTS_GUIDE_vi.md` mirrors the root instructions, technical names and check commands, with links from `AGENTS.md` and the Vietnamese index.
- **Changed:** The root English instructions remain authoritative; this is documentation-only work.

### 0.0.29 — Module-count policy and bilingual change records

*Recorded date: 03/10/2026. Sources: S5, cross-checked with S2–S4 and relevant source where applicable.*

- **Added:** Formal L0–L4 levels: 1–3 runtime modules use the highest change level, 4–5 escalate one level up to L4, and more than five require full verification. Risk overrides apply; modules are responsibilities, not file counts.
- **Added:** `CHANGELOG.md` / `CHANGELOG.vi.md`, paired documentation synchronization and relevant documentation/changelog updates for L1+ implementation work. Documentation/translations/tests do not add runtime modules.
- **Added:** L2+ source/API/caller review before and after edits, plus reporting of affected modules outside the initial scope.
- **Added:** Owner approval for unsolicited root/child AGENTS changes, with a dated pending proposal before integration. An explicit request to edit AGENTS directly authorizes the requested policy change.

### 0.0.30 — Documentation reorganization and archive

*Recorded date: 03/10/2026. Sources: S5, cross-checked with S2–S4 and relevant source where applicable.*

- **Changed:** Organized mirrored `docs/en/` / `docs/vi/`, separated RUNNING/BACKUP/DEPLOYMENT/TESTING and placed earlier records under `history/`.
- **Added:** `archive/` preserves the original Sticky Note and `index_old.html`, with paired indexes and a Vietnamese Sticky Note translation.
- **Changed:** Merged Sticky Note recommendations into a separate lower section of RECOMMENDATIONS, distinguishing existing signed-in map access from proposed local/guest memberships: one community per level, with independent school/home-ward choices.
- **Historical verification:** The task records 217 local links and 15 bilingual pairs reviewed. Application source was unchanged and application suites were not run.

## Group 6 — Mobile UX improvements

*Versions: `0.0.31–0.0.36`.*

### 0.0.31 — Preserve closer zoom when selecting a menu pin

*Recorded date: 03/10/2026. Sources: S5, cross-checked with S2–S4 and relevant source where applicable.*

- **Fixed:** Selecting a menu pin keeps the current zoom when it exceeds the configured default; otherwise it raises zoom to that default. The default comes from `/api/map-config`, not a hardcoded example value of 16.
- **Historical verification:** The resumed task completed desktop/mobile checks and coverage with an alternate configured default. The initial interrupted request alone was not counted as completion.

### 0.0.32 — Mobile search, keyboard and Memerboard UX

*Recorded date: 03/10/2026. Sources: S5, cross-checked with S2–S4 and relevant source where applicable.*

- **Changed:** Search focus and filter selection expand the sheet. The placement prompt fits its text and stays centered rather than spanning the screen.
- **Fixed:** Kept page/map geometry stable during keyboard viewport changes and dismissal, preventing whole-page shifts and overflow in the tested browser scenarios.
- **Changed:** Memerboard opens expanded and restores the previous Menu level on return. Its heading/city selector stay fixed while the result list scrolls.
- **Changed:** Extended drag-start regions through Menu search, Admin filters and the city selector, with movement thresholds protecting control taps. Selecting a menu pin collapses the mobile sheet.
- **Historical verification:** Eight browser suites passed across the recorded runs after initialization-timeout reruns. Keyboard coverage is simulated browser behavior; native iOS/Android keyboard checks remain outstanding.

### 0.0.33 — Three sheet levels, touch zoom guard and Admin footer

*Recorded date: 04/10/2026. Sources: S5, cross-checked with S2–S4 and relevant source where applicable.*

- **Added:** Mobile heading-only `peek`, 230 px `default` and `expanded` at 76% of the viewport capped at 640 px; insets increase from 8 px to 16 px at the minimum level.
- **Changed:** Release snapping uses one third of the interval in the drag direction, allowing the middle level to be skipped. The entire minimum sheet is draggable; capture survives leaving the handle early.
- **Changed:** Moved all four Admin tabs to the footer; every click, including the active tab, expands the sheet while retaining filters. The initial Menu/Admin action rule opened at default and closed to minimum without sibling memory.
- **Fixed:** Prevented accidental page zoom from double taps outside the map, editable fields and multi-touch; map gestures remain usable. App controls/sheets sit above the fixed placement pin.
- **Changed:** Memerboard initially opened sequentially with 210 ms expansion then a 210 ms slide. Both this animation and sibling switching were revised at 0.0.36.
- **Fixed:** An additional HTTP-serving change raised the connection backlog to 128 for concurrent asset loads, with a focused regression. It does not establish one cause for every earlier timeout.
- **Historical verification:** Recorded L4 verification: 23 backend tests, API-client checks and all nine browser suites passed across the full run and focused rerun. Coverage is Chromium emulation, not real iOS/Android devices.

### 0.0.34 — Declared change and verification status

*Recorded date: 04/10/2026. Sources: S5, cross-checked with S2–S4 and relevant source where applicable.*

- **Added:** AGENTS requires every editing task, including L0, to declare its change level and planned/in-progress/completed status before editing, in updates and in the final report.
- **Added:** Application checks separately report L1–L4 verification level, status and a coverage/results summary. Scope/risk changes revise the declared level; L0 document review cannot establish an application-test pass.
- **Changed:** Synchronized the Vietnamese guide and both changelogs; this policy edit required only L0 document review.

### 0.0.35 — Consistent sheet headers and continuous footer motion

*Recorded date: 04/10/2026. Sources: S5, cross-checked with S2–S4 and relevant source where applicable.*

- **Fixed:** Menu/Admin use consistent header geometry and spacing during dragging and snapping. Admin history remains visible at the minimum level and expands the sheet when opened.
- **Fixed:** The Memerboard button and Admin footer translate downward continuously and hide only after leaving the clipped sheet and completing the transition. Exiting content cannot receive pointer/keyboard input; Admin results reserve footer height.
- **Historical verification:** Recorded L2 work in layout/Admin with all eight affected browser suites passing, including sampled motion frames in Vietnamese/English. Backend/API behavior was unchanged; no backend/API-client rerun or real-device test was reported.

### 0.0.36 — Sibling sheet memory and fixed-pin layering

> **Major milestone — minor candidate:** Mobile UX improvements, completing 0.0.33–0.0.36.

*Recorded date: 04/10/2026. Sources: S5, cross-checked with S2–S4 and relevant source where applicable.*

- **Changed:** Menu/Admin each restore their own last drag level, including minimum, across sibling switches. Closing/reopening the same active view still opens at default. This is separate from Memerboard parent-return memory.
- **Changed:** Restored simultaneous Memerboard opening: 250 ms height expansion with the original 280 ms horizontal slide, replacing 0.0.33 sequential phases.
- **Fixed:** The mobile fixed pin remains visible/usable at minimum; desktop all-closed placement retains its temporary marker. Viewport-mode changes while composing preserve selected coordinates.
- **Fixed:** On desktop/mobile, map markers sit below the fixed pin, meme popups above it, and app controls above map panes. A dedicated Leaflet pane compensates translation to hold the fixed pin still during pan/zoom.
- **Historical verification:** Recorded L2 verification passed all nine affected browser suites across runs. Pin creation was an additional affected consumer, checked for placement, saving and viewport changes. Its API/backend/shared transport stayed unchanged; real-device coverage remains outstanding.

## Group 7 — GitHub preparation

*Versions: `0.0.37–0.0.38`.*

### 0.0.37 — GitHub and parallel branch/worktree guidance

*Recorded date: 04/10/2026. Sources: S5, cross-checked with S2–S4 and relevant source where applicable.*

- **Added:** Paired `GIT_WORKFLOW.md` guidance for retaining the Leaflet baseline and preparing an isolated MapLibre/OpenFreeMap experiment with separate data, ports, browser profiles and HTTPS tunnel routes.
- **Changed:** Explained cookie isolation, team clones instead of concurrent edits to one SMB checkout, manual merge/deployment steps and code rollback versus data-migration recovery.
- **Changed:** This milestone delivers reviewed bilingual documentation only; it does not establish a push, new branch/worktree, MapLibre conversion or Next.js installation.

### 0.0.38 — Repository safeguards before the GitHub baseline

*Recorded date: 04/10/2026. Sources: S5, cross-checked with S2–S4 and relevant source where applicable.*

- **Changed:** Expanded `.gitignore` for local `.env` variants while allowing a sanitized `.env.example`, Python virtual environments, SQLite databases/sidecars, root backups, uploads and future Node.js/Next.js generated files.
- **Changed:** The rules prepare future frontend tooling without installing it. Ignored patterns do not automatically remove tracked files; other custom runtime locations require their own rules or storage outside the repo.
- **Historical verification:** Recorded L0 review checked 36 ignore cases: 21 ignored and 15 source/template paths still trackable. Staging and sensitive-information review are preparation operations, not a separate application release.

## Reviewed chats and work outside source milestones

| Chat title | Review outcome |
| --- | --- |
| Refractor | Detailed editing sequence 0.0.21–0.0.38; later version-number discussions do not create releases. |
| MemeMap Main Chat | Earlier development and the existing 0.0.1–0.0.20 summaries; overlaps are cross-referenced above. |
| UI | Inherited Refractor history and design discussions; duplicated edits are counted once. |
| GPT | Inherited history and model/effort advice; the duplicated AGENTS status change is 0.0.34. |
| UI Design | External [Figma MemeMap](https://www.figma.com/design/43esIr6bcVNFEoGzfuiRSl?node-id=8-2) work: the chat reports editable desktop/mobile landing layouts and 43 components. Map/popup assembly and final review remained unfinished after the Figma MCP plan limit. This is partial design work, not a completed frontend migration or a source-release milestone. |
| Terminal | Server restart and an HTTP response check; no application feature or source milestone. |
| OSM -> OFM | Map-provider/migration comparisons and Git advice; no implemented migration. |
| App port | Native-app architecture advice; no Android/iOS app implementation. |
| Phân loại squircle và rounded trên i | Shape/design discussion; no recorded implementation. |

Git identity configuration, staging and the sensitive-information review were also reviewed. They prepare repository sharing, without proving a commit/push or creating a shipped application version. The initial version-history drafting and this correction are L0 record maintenance, not additional runtime milestones.

## Items not counted as completed features

Community/membership/local–guest, administrative polygons, geocoded pin place names, downloading all of OSM, MapLibre/OpenFreeMap, Next.js + Tailwind CSS + shadcn/ui, GIF/WebM, a fixed 500 KB output-image ceiling, automatic backups, Turnstile, password recovery and native apps remain discussions/plans or have not been confirmed implemented. Consult [recommendations](../RECOMMENDATIONS.md) and the API for current status rather than inferring completion from a conversation question. The partial Figma work above does not change this status.

## Maintaining this history

Record completed work by date in both changelogs under `Unreleased`. For the next distinct completed milestone, append `0.0.39` and continue increasing the final component within `0.0.x`; do not create `0.1.0` unless the owner selects it. Add a release date or Git tag only when actually performed and evidenced. Update both VERSIONS documents together, group small iterations toward one goal and retain notes when older behavior is superseded.
