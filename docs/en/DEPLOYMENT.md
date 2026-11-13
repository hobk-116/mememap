# Public deployment through Cloudflare Tunnel

**English** · [Tiếng Việt](../vi/DEPLOYMENT.md) · [Documentation index](README.md)

## Current hosting decision

The project owner has selected Cloudflare Tunnel for publicly sharing the prototype from a PC or VPS. Public users access HTTPS; the tunnel connects to the local application over HTTP. Use a localhost origin such as `http://127.0.0.1:8000`.

For a POSIX shell, start the application with:

```sh
MEMEMAP_HOST=127.0.0.1 MEMEMAP_PORT=8000 MEMEMAP_SECURE_COOKIE=1 python3 server.py
```

Set the same environment variables in the service or shell used on the host. These settings bind the application locally and add `Secure` to session cookies; they do not create a tunnel or configure HTTPS by themselves. Use the public HTTPS address for browser location access.

## Tunnel and hostname

Cloudflare Tunnel forwards the selected hostname to the localhost origin. Both the application and tunnel client must remain running. A temporary/quick tunnel URL may change when recreated; for a stable hostname, configure a named tunnel and DNS using the provider's current instructions.

This guide records the hosting decision and application settings. It does not claim that a domain, tunnel, firewall or VPS has already been configured.

## Current security limits

This app's built-in server is a prototype and does not provide a production reverse-proxy, HTTPS termination, general login/API rate limiting, explicit CSRF tokens, account recovery, or a hardened deployment setup. Meme report submissions have the specific rate limit described in [moderation](RUNNING.md#moderation-dashboard). Its session cookie is `HttpOnly` and `SameSite=Lax`, and defaults to omitting `Secure` for local HTTP; set `MEMEMAP_SECURE_COOKIE=1` when serving over HTTPS. A tunnel makes the service reachable from outside the LAN; expose it only after reviewing access controls and deployment security. For HTTPS deployment, review proxy configuration and enable secure cookie handling before treating the service as production-ready.

Before public launch, also complete a consistent [database/media backup and restore check](BACKUP.md), appropriate application limits, and the device checks described in [testing](TESTING.md). The current moderation signals and report-specific limits are described in [local operation](RUNNING.md#moderation-dashboard).

## Map services

The map page loads pinned MapLibre GL JS 6.13.0, CSS and worker from unpkg, and Liberty style/vector data from OpenFreeMap. Keep the attribution control visible; the data includes OpenStreetMap and OpenMapTiles attribution. Public browsers need access to those external services and WebGL. The app does not host or bulk-download tiles. A deployment CSP must permit the module/CSS, style/tile/glyph/sprite endpoints and Blob worker used by this CDN setup; if Blob workers are prohibited, deploy a reviewed same-origin worker configuration. Test real mobile browsers before release. See [MapLibre installation](https://maplibre.org/maplibre-gl-js/docs/) and [OpenFreeMap](https://openfreemap.org/quick_start/).

The app currently requests geolocation only when the user activates the location control; the browser asks for permission. It does not continuously track a user. Pin coordinates are otherwise selected by map interaction. Pin lookup does not currently use a geocoding service.
