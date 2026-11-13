# MemeMap development recommendations

**English** · [Tiếng Việt](../vi/RECOMMENDATIONS.md) · [Documentation index](README.md)

Updated on 03/10/2026 from the project discussion. This is a development plan; checklist items below are not completed features unless explicitly marked as existing.

## Current foundation

The six-step refactor is complete: separated services, versioned migrations/settings/media, shared API transport, split map modules, database-backed profile totals and centralized geographical scopes. Moderation/reporting, conditional logout with confirmation and the shared mobile Menu/Admin sheet already exist. See [architecture](ARCHITECTURE.md), [API](API.md) and [refactor history](history/REFACTOR_2026-10-02.md).

Community membership/local/guest, administrative polygons, region-filtered feeds, automatic backups, Turnstile and native Android/iOS apps are still planned. The map still loads all pins every 10 seconds. No deployment or domain purchase is confirmed by this document.

## Priority order

| When | Recommendation | Reason |
| --- | --- | --- |
| **Before community** | Confirm the selected Python/`cwebp` environment on the actual host; version source in Git and prepare a GitHub/team branch workflow. | The owner's Mac reported Python 3.14.7 and `cwebp` 1.6.0, and the supplied Python test log passed 22 tests. That result does not verify another host. Source history does not back up user data. |
| **Before changing live data** | Make a matching database/media backup and test restoring a copied set. | Membership/schema work must preserve accounts, posts, votes and media. See [backups](BACKUP.md). |
| **Before community implementation** | Finalize memberships, verification, switching rules and existing post/aura behavior. | Geography alone must not create local permission; home ward and school are independent. |
| **Build community** | Add membership migrations, sourced/versioned boundaries and server-side local/guest decisions. | Use the foundation services; a map viewport limit cannot enforce API permissions. |
| **Before larger feeds** | Filter by region, paginate and measure on actual devices. | Full-feed refresh does not scale indefinitely; profile totals already work independently of the feed. |
| **Before public launch** | Use Cloudflare Tunnel with public HTTPS and secure cookies; implement appropriate login/API anti-spam limits, backup automation and a restore procedure. | Deployment settings exist, but general rate limiting, Turnstile and automatic backups are not implemented. See [deployment](DEPLOYMENT.md). |
| **Before public demos and advertising** | Define acceptance checks for login, posting, media, voting and moderation, plus a release checklist and incident/feedback records. | A public, fundraising or advertiser demo needs repeatable behavior and evidence of quality. Use [testing](TESTING.md); do not count viewport emulation as real-device coverage. |
| **Before native apps** | Test actual Safari/iPhone/Android devices and decide API/session integration, packaging and tile service. | Refactoring and community work help prepare the backend; they do not automatically produce Android/iOS apps. |

## Community rules to settle

- Level 1 is city/province, initially Hà Nội; level 2 is the current ward/commune of residence; level 3 is school, initially university/high school with HANU as a pilot.
- Each account can join at most one community at each level. Choosing city → ward → school can guide onboarding, but school and home ward memberships are independent. A HANU student chooses their actual home ward, not a ward automatically inferred from the school.
- Viewing the map requires login. Both local and guest are authenticated members. Local/guest status is determined for the specific community: members post as local there, and as guest in other communities according to the chosen posting rules.
- The backend determines membership and posting permission. The selected map view, viewport bounds or current GPS location must not grant local status by themselves.
- Decide verification, membership-change frequency, the treatment of earlier posts/aura, moderation scope and how school boundaries interact with residential communities before building them.
- Keep location requests explicit. Membership does not prove that a person is currently at that location; do not introduce background location tracking as an implicit requirement.

## Map and mobile direction

The current MapLibre/OpenFreeMap setup is documented in [architecture](ARCHITECTURE.md) and [deployment](DEPLOYMENT.md#map-services). Community geography should be stored independently of the rendering library: use sourced/versioned boundaries, consistent IDs and backend validation.

Define the meaning of each community level before choosing polygons, viewport limits and feed filters. The owner authorized the MapLibre/OpenFreeMap renderer migration on 07/10/2026. Community membership/polygon work and native SDK choices remain separate proposals; changing the renderer does not implement them.

The earlier model and Admin design proposals are preserved in [history](history/MODEL_AND_ADMIN_NOTES.md). Current behavior is described by the API and architecture references.

## Sticky Note — consolidated from the conversation

This separate section preserves the three original priorities from [the archived Sticky Note](../../archive/STICKY_NOTE.md) and expands them using the owner's clarifications.

### Local & guest

- [ ] Implement authenticated community memberships with a maximum of one per level.
- [ ] Pilot Hà Nội → home ward/commune plus an independently selected school such as HANU.
- [ ] Enforce local/guest posting per community on the backend; anonymous map access is not part of this feature.
- [ ] Settle verification, switching, old posts/aura and moderation before schema implementation.

### Improve Memerboard

- [ ] Decide ranking scope for city, ward and school communities.
- [ ] Keep rankings consistent with visibility, moderation and the agreed membership/aura rules.
- [ ] Add appropriate feed/ranking filtering and measure performance as data grows. Database-backed profile totals are already available.

### Improve UX

- [ ] Validate real iPhone/Android behavior: location permission, image processing, profiles, confirmation and mobile sheet gestures.
- [ ] Review accidental double-tap page zoom outside the map while preserving intended map interaction and accessibility.
- [ ] Improve loading, error/expired-session feedback and understandable local/guest labels.
- [ ] Preserve the existing logout entry-point rule, confirmation and shared mobile Menu/Admin behavior while adding community.
