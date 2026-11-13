# MemeMap Agent Instructions

Vietnamese reference: [AGENTS_GUIDE_vi.md](docs/vi/AGENTS_GUIDE_vi.md). This root file is authoritative; keep the translation synchronized when changing these instructions.

- Until the project owner changes this decision, recommend Cloudflare Tunnel for publicly sharing the current prototype from a PC or VPS; do not recommend direct public exposure, router port forwarding, or DDNS hosting as the default, and use HTTPS publicly with HTTP allowed only between the tunnel and localhost.
- Treat questions and capability checks (including “can you do this?” or “is this possible?”) as requests for information only; make changes only when the project owner explicitly asks you to do them.

## Required reading and source of truth

- At the start of a repository task, read [README.md](README.md), the [documentation index](docs/en/README.md), and the latest entries in [CHANGELOG.md](CHANGELOG.md).
- Before changing code, read the relevant sections of [ARCHITECTURE.md](docs/en/ARCHITECTURE.md), [API.md](docs/en/API.md) when an API is involved, and [TESTING.md](docs/en/TESTING.md), together with the relevant source and tests. Read [RECOMMENDATIONS.md](docs/en/RECOMMENDATIONS.md) when the task affects product direction or community.
- Read [VERSIONS.md](docs/en/history/VERSIONS.md) when tracing history or handling versioning. Do not treat historical behavior in VERSIONS or changelogs as a current requirement when it has been superseded.
- Read RUNNING, DEPLOYMENT, BACKUP or GIT_WORKFLOW when relevant to the task. Reading every document is not required for every small edit.
- Distinguish implemented behavior, settled decisions, proposals and unresolved decisions. Do not implement features from proposals, checklists or discussions that merely consider an option.
- Follow the owner's current request and active AGENTS rules. When documentation and code conflict, report the difference rather than inventing product intent.
- Do not assume access to other chats. If a necessary decision is absent from the repository and supplied context, ask the owner before carrying out work dependent on that decision.

## Verification policy

When an implementation is explicitly requested, perform the appropriate checks as part of that work. Classify each change by actual impact and risk, then apply the module-count rule below. These levels describe changes, not permanent rankings of modules.

| Level | Change | Required checks |
| --- | --- | --- |
| L0 | Documentation, copy or translations only | Review wording, links and EN/VI consistency. For user-visible copy, inspect the affected UI and languages for overflow or missing labels. No application regression suite is required. |
| L1 | Simple HTML/CSS | Inspect the affected UI at desktop and mobile sizes. For changes to drawers, popups, gestures or pin positioning, run the relevant browser suites below. Backend tests are needed only if backend behavior or asset routing is affected. |
| L2 | Small feature or bug fix | Run the affected backend and/or browser suites for every affected module. Run the API client check when changing shared transport or error handling. Add a focused regression test for meaningful behavior not covered by existing tests. |
| L3 | Integration across related features or escalation from L2 | Review complete affected flows and their adjacent consumers. Run all backend suites when backend behavior changes, all browser suites when frontend behavior changes, and the API client check when transport or API contracts change. Add focused coverage for the relevant integration and failure cases. |
| L4 | Broad refactor or major feature, including community | Run the full backend suite, API client check and all browser suites. Add coverage for new behavior, permission boundaries and relevant failure cases. Review affected desktop/mobile flows; report actual-device coverage separately. |

A module is a coherent functional responsibility, such as authentication, profiles, pin creation, voting, leaderboard, moderation, map layout, shared API transport, media storage, migrations or geographical scopes. Its frontend and backend files can belong to the same module. Count each module whose code or behavior changes once; do not equate files with modules or split one responsibility to alter the count. Supporting documentation, translations, changelog entries and tests do not add runtime modules. Declare the affected modules and their levels, and revise the count if scope grows.

For implementation changes at L1 or above, select the minimum verification level as follows:

| Modules changed | Selected level |
| --- | --- |
| 1–3 | Highest level among the changed modules. Cover all affected modules and combine required checks without duplicates. |
| 4–5 | One level above the highest changed-module level, capped at L4. |
| More than 5 | L4: full verification. |

Risk overrides these minimums: database schema/data migrations, major community changes, broadly affected shared logic, or impact that cannot be isolated require L4 even with 1–3 modules. Authentication, authorization, session handling and shared API behavior changes require at least L2 and the relevant backend/API checks; include logout/profile or admin browser checks where affected. Media/storage changes require `test_foundation.py` and `test_admin.py`, plus affected API/browser checks, covering data preservation, rollback/retry and image consistency. Use L4 when their impact is broad.

Documentation-only work stays at L0 regardless of the number of files. Do not rerun already-passed checks for unchanged relevant code merely because several modules are involved; rerun after later changes affect those results or when failures or unresolved concerns remain.

## Change and verification status

- For every editing task, explicitly report its change level (L0–L4), including documentation-only L0 work, and whether the changes are planned, in progress or completed. State the level and intended scope before editing, reflect the current state in progress updates, and report the completed scope in the final response. If the scope or risk changes, update the declared level and explain why.
- When running application checks, separately report the selected verification level (L1–L4), their status (planned, running, passed, failed, blocked or not run), and a concise summary of coverage and results. Include the commands actually run and explain incomplete checks; a planned or running check must not be reported as passed. The verification level may be higher than the change level under the module-count and risk rules.
- For L0-only work, report the documentation review and its outcome as L0, and state that application checks were not required or run. Reviewing wording, links and translations does not promote the change to L1 or establish an application-test pass.

- After each requested editing task, put a version recommendation at the end of the final report: **patch candidate**, **minor candidate**, or **no new application version needed**, with a short reason and whether to group it into the current `Unreleased` batch or propose a separate batch. If evidence is insufficient or work/checks are incomplete, state the uncertainty and keep the recommendation provisional. This classification does not authorize a version bump or release. Keep the existing L0–L4 planned/in-progress/completed and verification reporting unchanged; they remain separate from version classification. Any pending-AGENTS reminder belongs before this final version recommendation.

## Evidence and scope

- Start with AGENTS, then the documentation index, relevant current-behavior documents, and the actual source/tests involved. Architecture, API and operation describe current behavior; recommendations describe plans; history and archive are references, not proof of current implementation.
- Do not claim a feature exists solely from plans, chat history or module names. Compare the current implementation and relevant checks. Distinguish source inspection, existing test coverage, historical test results and checks actually run; report unverified claims as uncertain.
- If documentation and code disagree, report the discrepancy instead of guessing to fill the gap or silently choosing one as confirmed behavior.
- Do not implement features outside the owner's request merely because they appear in recommendations. Follow the existing authorization rules for questions, changes and previously approved scope.

## API and module review


For work selected at L2 or above:

- Before editing, read the relevant API documentation and actual route/client implementations, the modules being changed, and their direct callers, consumers and shared dependencies. Identify current permissions, data contracts and failure behavior. If no API is involved, state that and review the relevant module interfaces instead.
- After editing, reread the resulting API implementations and affected modules, review the diff against the intended scope, and confirm that documentation matches the implemented behavior. Reading the API reference alone does not replace reading the relevant source.
- Report every code or behavior change affecting a module outside the initially declared scope, including changes required in callers or shared dependencies. Name the module, explain why it was affected and how it was checked; revise the verification level when necessary. This reporting requirement does not itself authorize unrelated feature work.

## Documentation and changelog

- After every completed editing batch, update both changelogs under `Unreleased`, including L0 changes to documentation, translations, repository configuration or project instructions. Do not add a completed-change entry for read-only work, advice or rerunning checks without edits. Distinguish implemented edits from passed, failed or blocked verification; requests, plans and another chat's report alone are not completion evidence.
- Whenever any project documentation is created or edited, update its English/Vietnamese counterpart in the same task. Keep technical names, commands, API paths, JSON fields and error codes aligned. If a counterpart is missing, create it or explicitly report the incomplete synchronization; do not claim completion while the required counterpart is missing.
- Current pairs are `README.md` / `README.vi.md`, `CHANGELOG.md` / `CHANGELOG.vi.md`, `docs/en/{README,ARCHITECTURE,API,RUNNING,BACKUP,DEPLOYMENT,TESTING,RECOMMENDATIONS}.md` / the same filenames under `docs/vi/`, and `AGENTS.md` / `docs/vi/AGENTS_GUIDE_vi.md`. History pairs use the same filenames under `docs/en/history/` and `docs/vi/history/`; archive pairs are `archive/README.md` / `archive/README.vi.md` and `archive/STICKY_NOTE.md` / `archive/STICKY_NOTE.vi.md`.
- Every implementation change classified at L1 or above must update both changelogs and the relevant EN/VI project documentation in the same task. Describe behavior, interfaces, operations or layout as appropriate. Updating the changelog alone does not satisfy the documentation requirement; unrelated documents do not need artificial edits.
- Every approved AGENTS instruction change also requires both changelogs and the corresponding Vietnamese guide, even though this is L0 work. The root instructions and translated guide satisfy the documentation requirement for a policy-only change.
- Record completed work under `Unreleased` with a dated heading and the appropriate Added/Changed/Fixed/Security category. Do not invent released versions, completion dates or shipped features. Keep proposals and future work out of completed-change entries. Record historical test results as historical, not as verification of new changes.
- Keep the documentation indexes and relative links synchronized whenever documents are added, renamed or moved. These paths describe the current layout; revise the mapping as part of any approved reorganization.

## Development milestones and release versions

- Distinguish development milestones in VERSIONS from release versions. Existing `0.0.x` milestones are retrospective records; they do not establish a release, deployment or Git tag. Do not automatically create a release or increase patch after each edit, chat turn or commit.
- A VERSIONS milestone records a concrete result: resolving an identified bug, adding a usable capability or completing a technical/documentation change with a defined scope. Group edits into one milestone when they resolve the same bug or complete the same specific objective, belong to one continuous batch and have not already been finalized as separate milestones.
- Record independently completed results as separate milestones. Two independent changes may be separate development milestones even when released in one patch. Before finalizing a milestone, incorporate further attempts toward the same objective into it; a new bug fix after finalization belongs to the next milestone, with a reference to the earlier one where useful.
- Do not use file counts, chat-turn counts, request length or L0–L4 levels to determine milestone counts. Repeated tests, repeated requests/reports and fork-inherited duplicate history do not create milestones. If source edits are complete but verification is blocked, record that status instead of claiming full verification.
- Keep milestones in chronological order inside the appropriate development-phase groups, with matching EN/VI structure. Create a new group only when the new phase has a clearly different objective, not after every small fix. Groups organize history and do not assign release versions.
- A significant new capability, substantial feature group or major foundation change may carry the label **Major milestone — minor candidate** (Vietnamese: **Mốc lớn — ứng viên minor**). For a sequence of related milestones, prefer labeling the milestone completing the group and state its range. The label does not increase the version number, create a tag or establish a release.
- When asked only to renumber, reorder, group or label versions, preserve surviving titles, dates, descriptions and historical verification results. Change only the authorized structure and version-number references. If historical content appears incorrect or duplicated, report it and propose a separate correction/deletion unless that correction/deletion is already explicitly authorized.

## Choosing patch and minor releases

- **Patch:** bug fixes, small UX adjustments, optimizations or refactors preserving existing usable capabilities and API contracts. **Minor:** a new usable capability or a completed substantial group of functional changes.
- Technology changes such as Next.js, Tailwind CSS, shadcn/ui or MapLibre do not determine minor by themselves. Assess actual behavior, capabilities and API contracts. Report incompatible changes explicitly; do not automatically classify them as patch. Propose versioning and transition steps for the owner to decide.
- One release may group multiple development milestones. A minor may include related bug fixes; documentation, translations and tests belong to the batch they support. Keep unreleased work under `Unreleased` and propose a release number based on the batch's overall result when the owner requests a release.
- L0–L4 determines verification scope independently of patch/minor. Only finalize a release number, convert `Unreleased` entries into a release section, record a release date or create a Git tag when explicitly requested or approved by the owner. Release dates must reflect an actual event, not the date of a documentation edit.

## Git support files and authorized operations

- Review `.gitignore` when build tools, dependencies, data paths or generated file types change. Prevent unintended tracking of runtime data, secrets and generated files, while keeping source and sanitized templates trackable. Update EN/VI Git guidance when repository structure, branch/worktree workflow, parallel execution, data, ports or tunnel routes change. Do not edit these files after every change when those subjects are unaffected.
- Ignore patterns do not untrack already tracked files. Report tracked sensitive/runtime data and propose handling; do not automatically delete data or rewrite Git history.
- A request to edit source or documentation alone does not authorize staging, commit, push, tag creation, merge or release. Perform these operations when explicitly requested or previously authorized within the current task's scope; do not ask again for an already authorized operation. Do not amend, reset, force-push or rewrite history outside the owner's authorized scope.
- Git reports must distinguish staged changes, unstaged changes and untracked files. Configuring a remote is not proof of a successful push; staging is not a commit; a local commit is not proof that the revision exists on GitHub. Report success only from actual results.
- For version-number/group/label-only documentation tasks, compare before and after to verify that retained milestone content is preserved outside authorized edits; review numbering, references, group ranges, labels, links and EN/VI consistency. Report these tasks at L0; application suites are not required when application code and behavior are unchanged.

## Changes to agent instructions

This approval procedure applies from the next AGENTS edit after the owner-requested update on 03/10/2026. That update requires a report, not another approval.

- An explicit owner request to edit AGENTS authorizes the requested changes directly. Report the resulting rules, synchronize the Vietnamese guide and record the change in both changelogs.
- If another task reveals a need to change agent instructions, prepare the exact proposed text with its reason and effects, then ask the owner before writing it to AGENTS or merging it into active rules. Present the proposal in a separate section headed `Pending AGENTS proposal — DD/MM/YYYY`, using the actual day/month/year, before asking to merge it. A request to implement an application feature alone does not authorize changing AGENTS.
- For every pending proposal item, state its planned merge destination (existing or new heading and insertion position) and operation (add, replace or remove). For replacement/removal, identify the affected existing instruction. Include the exact proposed text, reason and effects; mirror this information in the Vietnamese guide. On approval, integrate only the authorized changes at the stated destinations, then remove the merged pending items. These metadata fields do not activate the proposal or replace the owner's merger approval.
- If the owner approves writing a proposal but has not approved merging it, place that dated section at the top of AGENTS before the active instructions. Mark it clearly as a proposal with no effect on current rules and mirror it at the top of the Vietnamese guide. Merge only after approval; approval covering both writing and merging needs no second confirmation. When merged, remove the pending section, integrate the approved rules and update both changelogs.
- Apply the same approval and synchronization procedure to creating or editing a child `AGENTS.md`. Use a child file for directory-specific requirements when useful; do not use it or the translation to bypass the root rules or the owner's approval requirement.

- After each requested L1-or-higher editing task, if an AGENTS proposal is still awaiting merger approval, add one short reminder in the final report identifying the proposal/date and affected root or child instructions. This includes known proposals awaiting merger in the conversation and approved pending sections in files; do not write a conversation proposal into files without permission. Do not invent pending proposals or continue reminding after merger or explicit rejection/withdrawal. Put the reminder before the final version recommendation, continue authorized application work, and do not repeatedly ask for approval or treat the proposal as active rules. L0-only tasks do not require this reminder.

## Check commands

Run commands from the repository root with the project's selected Python interpreter. The examples use `python3`; use the equivalent command for that interpreter on the current machine. Backend image checks require `cwebp` on `PATH`. Browser checks require Node.js, Playwright and Chromium/Chrome.

Full verification:

```sh
python3 -m unittest discover -s tests -p 'test_*.py' -v
node tests/test_api_client.cjs
python3 tests/run_browser.py
```

Targeted backend suites (select those affected):

```sh
python3 -m unittest discover -s tests -p 'test_server.py' -v
python3 -m unittest discover -s tests -p 'test_admin.py' -v
python3 -m unittest discover -s tests -p 'test_foundation.py' -v
```

| Backend suite | Coverage |
| --- | --- |
| `test_server.py` | HTTP routes, authentication, profiles, images, pins, votes and leaderboard |
| `test_admin.py` | Moderation, reports, restrictions, audit history and legacy migration |
| `test_foundation.py` | Services, profile totals, geographical scopes, application isolation, migration rollback/retry and media failure handling |

Use the browser runner to create a separate disposable server and data for each suite. It accepts one or more filenames; without filenames it runs all browser suites:

```sh
python3 tests/run_browser.py check_mobile_drawers.cjs
python3 tests/run_browser.py check_foundation_ui.cjs check_logout.cjs
```

| Browser suite | Select when changing |
| --- | --- |
| `check_browser.cjs` | General home/map UI, profiles/popups, layout, marker refresh or image processing |
| `check_mobile_drawers.cjs` | Mobile Menu/Admin switching, sheet dragging or responsive layout |
| `check_interactive_pin.cjs` | Location selection, pin placement, composer or map interactions |
| `check_admin_ui.cjs` | Admin dashboard, reporting or moderation flows |
| `check_foundation_ui.cjs` | Profile totals with partial feeds, profile entry points or logout failure handling |
| `check_logout.cjs` | Logout confirmation/cancellation on home/map in Vietnamese/English at desktop/mobile sizes |

If tools are installed outside `PATH`, use the runner's `MEMEMAP_NODE`, `NODE_PATH` and `MEMEMAP_TEST_BROWSER` environment settings as documented in [testing](docs/en/TESTING.md). Do not hardcode one developer's local runtime paths into project files.

## Test data and reporting

- Use disposable databases and upload directories for tests. Never exercise test writes or trial migrations against live user data, including a custom runtime path.
- Do not add tests that merely mirror implementation details or add no useful protection for a reversible, low-impact edit.
- After the required checks pass, rerun or broaden them only for new changes, failures or unresolved concerns.
- Report the selected verification scope, commands actually run, results and any checks not completed with their reasons. A blocked or unavailable check is not a pass; earlier results are not proof for later changes.
- Distinguish desktop/mobile browser emulation from tests on real iOS/Android devices. Do not claim real-device coverage without performing it.
