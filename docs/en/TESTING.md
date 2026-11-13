# Testing

**English** · [Tiếng Việt](../vi/TESTING.md) · [Documentation index](README.md)

[AGENTS.md](../../AGENTS.md) defines the authoritative L0–L4 verification policy and module-count rules. Select the required scope there, then use the commands below. Historical results in [refactor notes](history/REFACTOR_2026-10-02.md) do not verify later edits.

Run commands from the repository root using the project's selected Python interpreter. Examples use `python3`; use its equivalent on the host. Backend image checks require `cwebp` on `PATH`. Do not use live data for tests.

## Regression checks

From the repository root, run the backend regressions with:

```sh
python3 -m unittest discover -s tests -p 'test_*.py'
```

`tests/test_server.py` covers authentication, image and voting behavior, plus three simultaneous bursts of all allow-listed assets to check complete responses without connection resets. `tests/test_admin.py` covers migration preservation, administrative permissions, hide/restore visibility, report decisions, expiring restrictions, audit history, list filters, and overview signals. These tests create disposable databases and uploads under a temporary directory and bind a local ephemeral port. They never use the production `mememap.sqlite3` or production uploads.

`tests/check_admin_ui.cjs` uses Playwright/Chromium against the URL printed by `python3 tests/serve_fixture.py`. It exercises reporting, report review, hide/restore, history filters, scoped restrictions and lifting, permanent deletion, language switching, simultaneous desktop drawers, the shared mobile sheet, and mobile touch scrolling/dragging. Set `MEMEMAP_TEST_BROWSER` if using an installed Chrome executable. The checks replace OpenFreeMap data with a deterministic background style while using the real CDN MapLibre engine. Stop the fixture with Ctrl+C when done; its database and uploads are disposable.

`tests/check_mobile_drawers.cjs` uses the same disposable fixture to check mobile Menu/Admin switching, touch expansion, per-sibling height memory, preserved map anchor/filters, heading-only closing, independent desktop drawers and transitions across the mobile breakpoint.

`tests/check_mobile_sheet_motion.cjs` samples animation frames during button closing/opening and slow/fast touch drags at 390 × 844 (Vietnamese) and 360 × 740 (English). It checks stable, matching Menu/Admin heading and eyebrow offsets, footer translation synchronized to height without disappearing while still inside the panel, preview content inertness, and the visible history button opening from preview. It also checks independent desktop drawers and the original desktop tab flow, and saves preview/mid-drag screenshots for visual review.

`tests/check_mobile_levels.cjs` covers all three sheet levels, release distances below/above one third in both directions, skipping the middle level, 16 px preview insets and dragging from the whole preview. Real Chromium touch events check double-tapping Admin and a profile popup without page zoom, and two-finger map pinch zoom. It checks screen controls above the fixed placement pin, footer placement and expansion from all four Admin tabs including the active tab, sibling height memory including `peek`, default height when reopening the same closed view, separate Memerboard return memory, simultaneous expansion/slide at the restored 250/280 ms speed, and switching siblings during that opening. Desktop drawers are checked after resizing. The general `check_browser.cjs` also checks repeated expansion/default cycles with a mouse on a mobile viewport, preserving the map anchor.

`tests/check_map_layers.cjs` performs actual hit-testing on desktop/mobile: existing map markers below the fixed placement pin, meme popup content above it after fading in, and app controls above all map panes. It checks a stationary fixed pin during immediate and animated pan/zoom, mobile placement from `peek`, and the retained desktop all-closed behavior. `check_interactive_pin.cjs` also verifies selected coordinates, panning, cancel/reopen, saving and viewport changes while composing: mobile preview uses the fixed pin, while desktop closed selection uses its separate temporary marker.

`tests/check_mobile_sheet_ux.cjs` covers 390 × 844 and 360 × 740 mobile viewports: automatic search/filter expansion, real touch drags starting around controls and on the Admin heading after scrolling past filters, input focus and filter submission, text-sized placement hints, expanded Memerboard entry and restoration of both main-menu states, fixed leaderboard heading/city selector while results scroll, and collapse on pin selection while voting keeps the sheet expanded. It also checks desktop behavior after resizing. Simulated `visualViewport` height changes check stable page/map/footer geometry during Menu/Admin search and while the keyboard closes, followed by normal browser-chrome resizing. This simulation does not open a native keyboard; test real iOS/Android focus, typing, picker, dismissal and rotation separately.

```sh
python3 tests/run_browser.py check_mobile_sheet_motion.cjs check_mobile_levels.cjs check_mobile_sheet_ux.cjs check_mobile_drawers.cjs check_pin_zoom.cjs check_map_layers.cjs
```

The mobile sheet motion suite also measures the placement-hint and attribution gaps after layout and before paint during drags/snaps and Memerboard entry/return, using a map fixture with attribution.

## Run all foundation checks

```sh
python3 -m unittest discover -s tests -p 'test_*.py'
node tests/test_api_client.cjs
python3 tests/run_browser.py
```

The browser runner creates and cleans a separate fixture server/database/media directory for each `check_*.cjs` suite. Pass one or more filenames to run selected suites. It requires Node.js, Playwright and Chromium/Chrome; set `MEMEMAP_NODE` if Node is outside `PATH`, `NODE_PATH` for an external Playwright installation, and `MEMEMAP_TEST_BROWSER` for an installed Chrome executable.

`test_foundation.py` checks services without HTTP, profile totals, application isolation, image cleanup after database failures, migration rollback/retry and conflicting media. `test_api_client.cjs` checks JSON, error details, expired-session redirects and cancellation. The two new browser suites cover partial feeds and profile totals, profile entry points, logout failures and confirm/cancel on both pages, languages and desktop/mobile sizes.

Browser checks use Chromium and a deterministic local style instead of public map data. Mobile viewports and simulated image fallbacks do not replace testing on actual Safari/iPhone/Android devices.

`check_pin_zoom.cjs` checks Menu pin-list navigation below, at and above the configured default zoom on desktop/mobile viewports. It also supplies an alternate default through the map-config response to detect hard-coded zoom values, and verifies that the selected pin popup opens. On mobile it expands the sheet by touch before each selection because selecting a pin now collapses it:

```sh
python3 tests/run_browser.py check_pin_zoom.cjs check_browser.cjs
```

## MapLibre migration coverage

`tests/map_fixture.cjs` substitutes the OpenFreeMap style in behavior checks so they do not depend on public tiles. The real pinned MapLibre ESM/CSS/worker still load from CDN. `check_maplibre.cjs` checks the API center, z17 versus legacy z18 pixel scale, keyboard marker activation and Vietnamese/English feedback for module/CSS/style/worker failures and WebGL context loss. Existing pin, layering, sheet, Admin, profile and logout assertions use native MapLibre coordinates/selectors and retain their behavioral coverage. Pin-list default zoom tests account for the one-level conversion; touch zoom assertions permit the engine's continuous zoom. Run real OpenFreeMap loading/attribution separately from the deterministic suite; real-device WebGL/touch/keyboard/performance remains separate from emulation.

`check_browser.cjs` also counts popup content updates across the 10-second refresh: unchanged closed popups must not be rebuilt, while a successful vote must update the active aura score.
