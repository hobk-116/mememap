# Changelog

**English** · [Tiếng Việt](CHANGELOG.vi.md) · [Documentation index](docs/en/README.md)

This log records completed project changes. `Unreleased` means the changes have not been assigned a published release version. Dates describe documented work, not deployment dates. New entries go first and must be synchronized with the Vietnamese log. Proposals and planned features belong in planning documents.

## Unreleased

### 11/10/2026

#### Added

- Recreated the current frontend/CSS as an editable [MemeMap Figma UI design](https://www.figma.com/design/G626nedcgIaChFIE61IZaA): separate Landing, Map and Components pages, desktop/mobile layouts, and mobile Menu, aura farm and minimum-sheet states. The file contains shared color/spacing variables, Nunito/DM Mono text styles, auto layout, reusable components and on-page mobile prototype links. Map backgrounds are separate raster assets; controls and content remain editable. Used disposable preview data and reviewed exported designs. This repository batch is L0, recording the external design link only; application source and behavior are unchanged, so application suites were not required or run.

### 07/10/2026

#### Changed

- Fixed placement pin and the red pin shown on map touch while drawers are closed (`.fixed-pending-pin`, `.interactive-pending-pin`) now use dark red `#d62f1f` instead of light coral `--coral`; `--coral` is unchanged for other uses. Completed L1 in the map-layout module (CSS only); updated `docs/en|vi/ARCHITECTURE.md`. Verification: ran `python3 tests/run_browser.py check_interactive_pin.cjs check_map_layers.cjs check_browser.cjs` with external `NODE_PATH` and installed Chrome via `MEMEMAP_TEST_BROWSER`: all three suites passed using disposable data (an earlier run without those settings failed with `Cannot find module 'playwright'`). Backend/API suites were not required or run. Visual desktop/mobile screenshots were not separately reviewed, the color is not asserted by tests, and real iOS/Android coverage remains unverified.

### 07/10/2026

#### Fixed

- Mobile placement hint and map attribution now follow the rendered sheet edge during dragging, snapping and Memerboard transitions, preventing transient overlap or excessive gaps. Added motion regression coverage with attribution; retained placement-pin geographic alignment. Completed L2 in the map-layout module; selected L2 verification passed. Ran `python3 tests/run_browser.py check_mobile_sheet_motion.cjs check_mobile_drawers.cjs check_mobile_levels.cjs check_mobile_sheet_ux.cjs check_interactive_pin.cjs check_pin_zoom.cjs check_map_layers.cjs` in two invocations, with external `NODE_PATH` and installed Chrome via `MEMEMAP_TEST_BROWSER`: all seven suites passed using disposable data. Reviewed desktop/mobile screenshots and ran JavaScript syntax checks plus `git diff --check`. The motion regression failed with the pre-fix layout supplied only to the test browser and passed with the fix. Initial execution required localhost sandbox approval and an installed-browser override; a motion attempt exposed the difference between animation-frame and before-paint sampling, so existing footer measurements retain their original timing while new gap measurements run after layout synchronization. No backend/API behavior changed; backend/API suites were not required or run. Real iOS/Android coverage remains unverified.

### 07/10/2026

#### Changed

- Migrated the map on local `codex/maplibre-openfreemap` to native MapLibre GL JS 6.13.0 (pinned ESM/CSS/worker from unpkg) and the OpenFreeMap Liberty style, without a framework/build step. Retained green emoji pins, coral placement pin, popup content, desktop temporary selection marker, geographic anchor during drawer/sheet changes, mobile levels/sibling memory/Memerboard transitions, composer coordinates across viewport changes, Admin previews and feed refresh. Attribution now remains above mobile sheets and within the available desktop map area; the hint reserves its height without moving the placement pin.
- Added `style` to authenticated `/api/map-config`; retained latitude/longitude, bounds, legacy zoom and `tiles` fields. The frontend converts coordinate order at the MapLibre boundary and subtracts one from legacy zoom values to preserve the 256 px Mercator pixel scale with MapLibre's 512 px world tiles. Posting/leaderboard scopes, permissions, database and uploads are unchanged.
- Added bilingual map feedback for module/CSS/style/worker failures and WebGL context loss, keyboard marker activation, single-popup handling and page teardown. Updated browser checks to native coordinates/selectors, retaining behavioral assertions; added `check_maplibre.cjs` and deterministic OpenFreeMap style fixtures. Updated paired README, architecture, API, deployment, testing, recommendations and Git guidance, including the actual branch/remote and uncommitted migration status.

Change and verification: completed L4 across map/layout, pin creation, feed/popup/voting, Admin preview, shared popup touch behavior and geographical map configuration. Ran `python3 -m unittest discover -s tests -p 'test_*.py' -v` (23 passed), `node tests/test_api_client.cjs` (passed), and `python3 tests/run_browser.py` (all 12 suites passed across full runs and affected reruns). The latest layout rerun selected `check_admin_ui.cjs check_browser.cjs check_interactive_pin.cjs check_map_layers.cjs check_mobile_drawers.cjs check_mobile_levels.cjs check_mobile_sheet_motion.cjs check_mobile_sheet_ux.cjs check_pin_zoom.cjs`; all passed after attribution placement changed. Independently reran `check_maplibre.cjs` after fixing Chromium's empty stylesheet object on blocked CSS; VI/EN module/CSS/style/worker/WebGL error and normal scale/keyboard cases passed. Earlier migration attempts exposed marker click/accessibility and test-geometry differences, which were corrected before these passes. Backend/API checks were not repeated after frontend-only corrections.

Real-provider smoke `node /private/tmp/mememap_live_smoke.cjs` used disposable data, loaded OpenFreeMap on 1280 × 850 and 390 × 844 Chromium viewports, verified attribution and rendered features with no JavaScript errors; reviewed desktop/mobile screenshots. Reviewed resulting modules/routes, JavaScript syntax, local documentation links, EN/VI consistency and `git diff --check`. Tests use disposable databases/uploads; live user data was not exercised. Coverage is Chromium emulation; real iOS/Android WebGL/touch/keyboard/performance remains unverified. Migration files remain unstaged/uncommitted; no push, tag, release or second worktree was created. Pre-existing AGENTS/guide changes and `.playwright-cli/` were preserved.

Gemini 3.1 Pro (`gemini-3.1-pro-high`, Antigravity plan mode) performed the owner-authorized read-only source/diff quality review after the checks, using parent-reported test results; it did not independently rerun application suites. It reported no blocking source finding and highlighted redundant closed-popup HTML updates. Confirmed and fixed that issue with per-marker content tracking, adding assertions for unchanged refresh and changed active vote. Ran `python3 tests/run_browser.py check_browser.cjs check_admin_ui.cjs check_map_layers.cjs check_pin_zoom.cjs check_foundation_ui.cjs`: browser/Admin/zoom/profile passed; one layering overlap probe failed. Its measurement and hit-test are now performed in the same browser frame, retaining the assertion; reran `python3 tests/run_browser.py check_map_layers.cjs` successfully, including actual z16→z17 zoom. Reviewed final syntax/diff/docs. Gemini's real-device cautions remain unverified, not test failures or release approval. Its temporary scratch diff was moved outside the repository.

### 05/10/2026

#### Changed

- Added task-specific required reading and source-of-truth rules to AGENTS: current docs/source take precedence over superseded history; distinguish implemented behavior, settled decisions, proposals and unresolved decisions; do not assume access to other chats. Synchronized the Vietnamese guide.

### 04/10/2026

#### Fixed

- Removed the trailing blank line from `mememap/moderation.py`. This is a formatting-only cleanup; application behavior is unchanged.

### 04/10/2026

#### Changed

- Merged both owner-approved pending AGENTS proposals into their stated destinations: added evidence and scope rules before API/module review, and added required destination/operation metadata to each future pending item. Removed the pending section after merger; the Vietnamese guide matches the active rules. Completed L0 review of content, links and EN/VI consistency; application checks were not required or run.
- Merged the owner-approved AGENTS policy for concrete development milestones, grouped bilingual version histories, minor-candidate labels, patch/minor release decisions, changelog coverage for L0 edits and authorized Git operations. Each editing task now ends its final report with a patch/minor/no-new-application-version recommendation and grouping rationale (provisional when evidence is incomplete), while existing L0–L4 status reporting is unchanged. L1+ editing tasks include a brief reminder before that recommendation when an AGENTS proposal is actually awaiting merger approval; pending proposals remain inactive. Synchronized the Vietnamese guide. Completed L0 wording, link and bilingual policy review; application checks were not required or run.
- Deduplicated and chronologically renumbered the paired version histories to `0.0.1–0.0.38`: removed the previous `0.0.22–0.0.26` summaries and duplicate `0.0.30` refactor record, keeping the original foundation record and the detailed remaining changes. Updated version-number references only; surviving titles, dates, descriptions and historical test results are unchanged. Early undated milestones retain their inferred relative order. Completed L0 review of numbering, content preservation, local links and EN/VI consistency; application checks were not required or run. Previous numbering in earlier changelog entries is historical.
- Expanded `.gitignore` for local environment files (keeping sanitized `.env.example` trackable), Python virtual environments, custom SQLite filenames/sidecars, root backups and future Node.js/Next.js generated files. Updated the EN/VI Git workflow guidance. L0 repository configuration/documentation change; verified ignore rules and source/template visibility with `git check-ignore`, reviewed bilingual wording and links; application checks were not required or run.
- Mobile Menu/Admin sibling switches now restore each view's own last drag level, including the smallest preview, independently of Memerboard parent-return memory. Closing/reopening the same active view still uses the default opening level. Restored simultaneous Memerboard opening with 250 ms height expansion and the original 280 ms slide, replacing the earlier sequential animation recorded below.
- Agent instructions now require a declared L0–L4 change level and planned/in-progress/completed status for every editing task, including L0. Application-check reports must separately state the L1–L4 verification level, status and coverage/results summary. Documentation-only review remains L0. Synchronized the Vietnamese guide; this policy edit was reviewed at L0 for wording, links and bilingual consistency, with no application checks required or run.
- Mobile Menu/Admin now have three drag levels: a heading-only preview with 16 px insets, the initial/default 230 px level with 8 px insets, and an expanded level at 76% of the viewport, capped at 640 px. Release snapping uses one third of each interval in the drag direction and supports skipping the middle level. The whole preview is draggable.
- The initial three-level implementation made Menu/Admin buttons open or switch at the default height and close to the preview, with height restoration only on Memerboard return. The later sibling-memory change above replaces its switching rule. A shared action rule defines search/filter expansion and default height on pin selection.
- The four Admin tabs move to the mobile footer. Every tab, including the active tab, expands the sheet; tapping the active tab preserves its filters.
- The initial mobile Memerboard opening used sequential 210 ms expansion and a 210 ms horizontal slide, totaling 420 ms. This was subsequently reverted to simultaneous opening as recorded above.

#### Fixed

- The mobile fixed placement pin stays visible and usable at the smallest sheet level, using the same single fixed pin for placement. Desktop all-closed selection retains its separate temporary marker. Changing viewport mode while composing preserves the selected coordinates and switches the pin presentation accordingly.
- Desktop/mobile map layering now places existing markers below the fixed pin and meme popups above it; app controls remain above map panes. A dedicated Leaflet pane compensates map translation to keep the fixed pin stationary during pan/zoom.
- Mobile Menu/Admin headers now keep matching, stable spacing when dragging or snapping to/from the preview. The history button stays visible without changing the eyebrow row's height, and expands the sheet when opening history from the preview.
- Memerboard and Admin footer buttons share continuous downward translation tied to the sheet's collapse progress. They stay laid out during slow/fast drags and only become hidden after exiting the clipped sheet and finishing the closing transition. Preview content cannot receive pointer/keyboard input while exiting; Admin result scrolling reserves the footer's measured height.
- Mobile buttons, sheets and popups use touch-action rules and a shared second-tap guard to prevent accidental page zoom, including on the Admin toggle. The map gesture surface, editable fields and multi-touch are excluded from the guard; map pinch zoom remains available.
- The mobile fixed placement pin now sits below the application header, panels and screen buttons. Dragging also continues when the first pointer movement leaves the narrow handle before capture.
- Increased the HTTP server connection backlog to 128 to accommodate concurrent page asset loads. Browser diagnostics had recorded a reset while fetching local `shared.js`; the new setting mitigates small-queue overflow, without proving that every earlier initialization timeout had the same cause.

#### Added

- Added an owner-authorized review-only `Pending AGENTS proposal — 04/10/2026` section at the top of AGENTS and the Vietnamese guide, containing two inactive proposals: evidence/scope rules and explicit planned destinations/operations for pending items. Recorded exact proposed text, reasons, effects and insertion positions without changing active instructions or merging either proposal. Completed L0 review of active-content preservation, bilingual consistency and local links; application checks were not required or run.
- Organized the paired version histories into seven chronological groups and labeled `0.0.4`, `0.0.13`, `0.0.19`, `0.0.24` and `0.0.36` as major milestones/minor candidates. Group headings contain existing versions as subheadings; version numbers, titles, dates and original descriptions remain unchanged. The labels do not assign a minor release. Completed L0 review of content preservation, group coverage, labels, local links and EN/VI consistency; application checks were not required or run.
- Corrected and extended paired [version histories](docs/en/history/VERSIONS.md) through `0.0.44`, following review of all accessible history in nine MemeMap-related chats. `0.0.27` now starts with the first Refractor editing request (account-icon logout); `.gitignore` is recorded at `0.0.44`. Added 18 detailed milestones, references to overlapping earlier summaries, superseded mobile behavior, the blocked historical Python test attempt and partial external Figma work. Duplicate fork turns, proposals and Git preparation are not counted as new runtime changes. These are retrospective records, not published releases/tags; `0.1.0` remains unselected. Completed L0 documentation review for wording, links and EN/VI consistency; application checks were not required or run.
- Added paired GitHub/branch/worktree instructions for preserving the current Leaflet baseline and running an isolated MapLibre/OpenFreeMap experiment, with distinct data, browser sessions, tunnel routes and a future L4 migration plan. Documentation-only L0; no commit/push, branch/worktree creation, server startup or map migration was performed. Reviewed wording, links and EN/VI commands; application checks were not required or run.
- Focused desktop/mobile hit-testing and animated pan/zoom coverage in `check_map_layers.cjs`, plus sibling/parent memory, restored animation timing and mobile-preview placement/viewport regressions in existing suites.
- A mobile sheet motion regression sampling animation frames for opening/closing and slow/fast drags in Vietnamese/English, verifying stable header spacing, continuous footers, preview history access and desktop layout.
- Three-level mobile regression coverage for directional thresholds, skipped levels, preview insets, double taps, map pinch, layering, footer navigation and sequential/canceled transitions. Existing drawer, scrolling and animation checks were updated for the new rules.
- A backend regression that loads every allow-listed asset concurrently in three bursts and verifies complete responses.

Verification selected L4 for shared mobile gestures and changes across map layout, pin-list navigation, Memerboard and Admin UI. HTTP serving was an additional module outside the initial UI scope; its backlog change was checked with the full backend suite and browser loads. Ran `python3 -m unittest discover -s tests -p 'test_*.py' -v` (23 passed), `node tests/test_api_client.cjs` (passed), and `python3 tests/run_browser.py`. All nine browser suites passed across the full run and a focused rerun of `check_foundation_ui.cjs`; one full-run profile assertion read empty rendered text, so that check now waits for the profile overlay to be visible before reading localized totals. Runtime profile code was unchanged. Also reviewed changed-module/API implementations, JavaScript syntax, bilingual documentation and local links, and visually inspected mobile previews and Admin footer placement. Browser coverage is Chromium desktop/mobile emulation; real Safari/iOS/Android checks remain outstanding.

The subsequent header/footer correction above is L2 in two runtime modules: map layout and Admin UI, with L2 verification. Ran `python3 tests/run_browser.py check_mobile_levels.cjs check_mobile_sheet_ux.cjs check_admin_ui.cjs`, then `python3 tests/run_browser.py check_mobile_sheet_motion.cjs check_mobile_drawers.cjs check_browser.cjs check_interactive_pin.cjs check_pin_zoom.cjs`, plus a focused rerun of `python3 tests/run_browser.py check_mobile_sheet_motion.cjs` after correcting the expected history label in that new check. All eight affected browser suites passed. Reviewed JavaScript syntax, resulting module interfaces, bilingual wording/links/commands and preview/mid-drag screenshots. No module outside the declared layout/Admin scope changed. Backend/API contracts and shared transport were unchanged, so backend/API-client checks were not required or run for this correction. Coverage uses Chromium emulation; real iOS/Android coverage remains outstanding. The earlier L4 results above belong to the preceding three-level/touch implementation.

The latest sibling-memory/animation/layering changes are completed at L2 with L2 verification in map layout, Memerboard presentation and pin creation. Pin creation is an additional affected consumer beyond the initial layout/subview scope; its preview placement, selected coordinates, viewport changes and saving were checked without changing its API. Ran `python3 tests/run_browser.py check_map_layers.cjs check_mobile_levels.cjs check_mobile_drawers.cjs check_interactive_pin.cjs`, then `python3 tests/run_browser.py check_mobile_levels.cjs check_map_layers.cjs check_mobile_sheet_motion.cjs check_mobile_sheet_ux.cjs check_admin_ui.cjs check_browser.cjs check_pin_zoom.cjs`, followed by `python3 tests/run_browser.py check_interactive_pin.cjs check_map_layers.cjs` after adding composing-resize handling, and `python3 tests/run_browser.py check_map_layers.cjs` after making its screenshot wait for popup fade-in. All nine affected suites passed across those runs. The first level-suite pinch assertion touched the restored expanded Admin sheet; its setup was corrected to expose the map before pinching, and it then passed. Reviewed resulting code/API contracts, JavaScript syntax, paired documentation/links/commands and desktop/mobile screenshots. Backend/API contracts and shared transport are unchanged; backend and API-client checks were not required or run. Coverage is Chromium emulation, not real iOS/Android devices. Earlier verification paragraphs describe their respective preceding changes.

### 03/10/2026

#### Fixed

- Mobile Menu/Admin no longer resize the entire map/page to the keyboard's reduced visual viewport during sheet input or keyboard closing. The mobile document is fixed to contain outer scrolling; keyboard behavior was verified with viewport simulations, not real device keyboards.
- Admin's grabber and heading remain draggable, including after scrolling its filters out of view. Passing a touch drag from a control to the sheet no longer ends the gesture prematurely.
- Opening a pin from the Menu's pin list preserves a zoom above the configured default, and raises a lower zoom to that default. The default comes from `/api/map-config` instead of a hard-coded value. Added desktop/mobile browser regressions using both real and alternate configured defaults; see [testing](docs/en/TESTING.md).

#### Added

- A focused mobile sheet UX browser suite covering two mobile sizes, touch gestures, Menu/Admin search and filters, simulated keyboard opening/closing, leaderboard scrolling/state restoration, pin-selection collapse, voting without collapse and desktop behavior.
- Matching English/Vietnamese recommendations and historical notes, dedicated running/backup/deployment/testing guides, and a root `archive/` index with a separate Vietnamese translation of the original Sticky Note.
- English and Vietnamese changelogs, an English documentation index, and links to the changelogs and agent instructions from both documentation indexes and project READMEs.

#### Changed

- Mobile search focus/input and filter selections expand the active Menu/Admin sheet. Dragging can start through the Menu search row, Admin filters and leaderboard city selector; interactive controls require 8 px of predominantly vertical movement to protect taps.
- Opening Memerboard expands the mobile sheet and remembers the main Menu's expanded/collapsed state for return. Its heading and city selector stay fixed while only results scroll. The layout exposes `setSubview` for future Menu subviews.
- Selecting a pin from the Menu collapses the mobile sheet before opening its popup, retaining the configured zoom rule. The placement hint is centered with a width fitted to its text. Desktop drawers keep their existing behavior.
- Reorganized current documentation into `docs/en/` and `docs/vi/`, with earlier refactor and model/Admin proposals in each language's `history/` folder. Split the former operations guide into focused documents and refreshed navigation throughout the documentation.
- Consolidated the original Sticky Note at the bottom of recommendations using the owner's community clarifications: authenticated local/guest, one membership per level, and independent school/home-ward choices. Original `STICKY_NOTE.md` and `assets/index_old.html` were moved unchanged into root `archive/`.
- Updated AGENTS documentation mappings and testing-guide links for the approved layout.
- [Agent instructions](AGENTS.md) and their [Vietnamese guide](docs/vi/AGENTS_GUIDE_vi.md) now define L0–L4 verification levels. For implementation changes, 1–3 modules use the highest applicable level, 4–5 raise it by one, and more than five require full verification. High-impact migrations and shared behavior retain full-verification exceptions; documentation-only work stays at L0.
- Documentation changes require corresponding EN/VI updates. Implementation changes from simple HTML/CSS onward require both changelogs and relevant bilingual documentation; approved AGENTS changes also require a log entry and translated guide.
- Work from L2 onward requires reading relevant API implementations and modules before and after editing, and reporting changes to modules outside the initially declared scope.
- Starting with the next AGENTS edit, changes arising from another task require owner approval before writing or merging. Proposals have a separate dated heading and remain inactive while pending. Explicit owner requests to edit AGENTS authorize the requested work directly; the same procedure covers child instruction files.

Documentation/policy updates were reviewed for wording, bilingual consistency and local links. The pin-menu zoom fix passed `check_pin_zoom.cjs` and `check_browser.cjs`, plus JavaScript syntax checks. Zoom regressions cover desktop/mobile Chromium viewports and real/alternate configured defaults; they do not establish real-device coverage. Backend/API behavior was unchanged, so backend suites were not rerun for this frontend fix.

Mobile UX verification selected L3 for four affected L2 modules: map layout, pin-list navigation, leaderboard and Admin UI. Ran `python3 tests/run_browser.py`; all eight browser suites passed across the full runs and focused reruns of `check_interactive_pin.cjs` and `check_mobile_sheet_ux.cjs`. Some runs timed out during page initialization; the affected suites passed when rerun separately, and the cause of those initialization timeouts was not established. Also checked syntax of the three changed scripts and two browser checks, documentation links and EN/VI command consistency. The API implementations and affected modules were reviewed before and after editing. Backend/API contracts and shared transport were unchanged, so backend and API-client suites were not rerun. Coverage uses desktop/mobile Chromium viewports and simulated keyboard viewport changes; native Safari/iOS/Android keyboard checks remain outstanding. No runtime module outside the declared scope changed.

### 02/10/2026

#### Added

- Application-owned services and runtime settings under `mememap/`, versioned migrations recorded in `schema_migrations`, and authenticated `GET /api/map-config`.
- A browser-check runner that creates separate disposable data for each suite, foundation/API-client checks, and browser coverage for profile totals and logout behavior.

#### Changed

- Completed the six-step foundation refactor: corrected regression assumptions, separated business logic from HTTP, standardized migrations/settings/media handling, introduced shared API transport, split map responsibilities, and moved profile totals and geographical scopes to backend services.
- Migration schema and version records commit together; legacy media is copied before commit, and conflicting destination files stop the migration without overwriting them.
- Profile meme/aura totals use all visible author pins in the database, independently of the loaded map feed. Posting and leaderboard bounds remain separate.

Historical verification recorded in [refactor notes](docs/en/history/REFACTOR_2026-10-02.md): 22 Python tests, the API-client check and six browser suites passed on 02/10/2026. Browser coverage used Chromium desktop/mobile viewports; it did not establish real iOS/Android-device coverage.

## Existing behavior when this log was started

The exact dates of the following earlier changes are not recorded here:

- Sign-out is available only from the signed-in user's header profile icon, with Vietnamese/English confirmation. Profiles opened through pins, leaderboard or Admin do not show sign-out.
- Mobile Menu and Admin use one bottom sheet; desktop drawers open independently.
- Python annotations in the affected authentication, pin and media modules use deferred evaluation to avoid the reported import-time union-type error on older interpreters. This does not establish support for every Python version.

Community memberships, local/guest permissions, geographical polygons, automatic backups, Turnstile and native Android/iOS apps are not completed features in this log.

### 13/11/2026

#### Added

- Added a Vercel-ready frontend-only showcase mode. Authentication, pins, aura votes, profiles and avatar state are handled by a browser-local session store; no backend API or server database is required for the showcase.
