#!/usr/bin/env python3
"""HTTP adapter and local entry point for MemeMap application services."""
from __future__ import annotations

import json
import sqlite3
import sys
from functools import wraps
from http import HTTPStatus
from http.cookies import SimpleCookie
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlsplit
import re

ROOT = Path(__file__).resolve().parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from mememap.app import Application
from mememap.config import Settings, MAX_JSON_BYTES, SESSION_SECONDS
from mememap.auth import password_digest
from mememap.errors import RequestError, require_user, require_admin
from mememap.media import UPLOAD_RE, InvalidImage, decode_upload

SETTINGS = Settings.from_env(ROOT)
DB_PATH, UPLOADS_PATH = SETTINGS.db_path, SETTINGS.uploads_path
MEME_UPLOADS_PATH, PROFILE_UPLOADS_PATH = SETTINGS.meme_uploads_path, SETTINGS.profile_uploads_path
HOST, PORT = SETTINGS.host, SETTINGS.port
STATIC_ASSETS = {
    "/assets/default-profile-picture.png": "image/png",
    "/assets/default-profile-picture.webp": "image/webp",
    "/assets/icon.svg": "image/svg+xml",
    "/assets/icon-128x.png": "image/png",
    "/assets/icon-64x.png": "image/png",
    **{f"/assets/css/{name}.css": "text/css; charset=utf-8" for name in ("home", "map", "shared", "admin")},
    **{f"/assets/js/{name}.js": "text/javascript; charset=utf-8" for name in
       ("home", "map", "map-layout", "shared", "admin", "api", "map-copy", "map-pins", "map-profile", "map-composer", "map-leaderboard")},
}


def local_application():
    """Compatibility for old local scripts that configure server.DB_PATH before use."""
    return Application(Settings(ROOT, DB_PATH, UPLOADS_PATH, HOST, PORT, SETTINGS.secure_cookie))


def connect_db():
    return local_application().database.connect()


def initialize_db():
    local_application().initialize()


def stored_upload_path(url):
    return local_application().images.path(url)


def handle_errors(function):
    @wraps(function)
    def wrapped(self):
        try:
            function(self)
        except RequestError as error:
            self.send_json(error.status, error.payload)
        except sqlite3.Error:
            self.send_json(500, {"error": "storage_failed"})
    return wrapped


class MemeMapHandler(BaseHTTPRequestHandler):
    server_version = "MemeMap/0.1"

    @property
    def app(self):
        return getattr(self.server, "application", None) or local_application()

    def log_message(self, fmt: str, *args: object) -> None:
        # Keep normal request logging, but avoid leaking account data (never log bodies).
        super().log_message(fmt, *args)

    def end_headers(self) -> None:
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "strict-origin-when-cross-origin")
        if not urlsplit(self.path).path.startswith(("/uploads/", "/assets/")):
            self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def send_json(self, status: int, payload: dict, extra_headers: list[tuple[str, str]] | None = None) -> None:
        encoded = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(encoded)))
        for key, value in extra_headers or []:
            self.send_header(key, value)
        self.end_headers()
        self.wfile.write(encoded)

    def send_page(self, filename: str, status: int = HTTPStatus.OK) -> None:
        path = self.app.settings.root / filename
        try:
            body = path.read_bytes()
        except OSError:
            self.send_error(HTTPStatus.NOT_FOUND)
            return
        self.send_response(status)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def read_json(self) -> dict | None:
        try:
            length = int(self.headers.get("Content-Length", "0"))
            if length < 1 or length > MAX_JSON_BYTES:
                return None
            value = json.loads(self.rfile.read(length))
            return value if isinstance(value, dict) else None
        except (ValueError, json.JSONDecodeError):
            return None

    def session_token(self) -> str | None:
        cookie = SimpleCookie()
        try:
            cookie.load(self.headers.get("Cookie", ""))
            morsel = cookie.get("mememap_session")
            return morsel.value if morsel else None
        except Exception:
            return None

    def current_user(self):
        return self.app.auth.current_user(self.session_token())

    def session_cookie(self, token, max_age=SESSION_SECONDS):
        secure = "; Secure" if self.app.settings.secure_cookie else ""
        return f"mememap_session={token}; Path=/; HttpOnly; SameSite=Lax; Max-Age={max_age}{secure}"

    @handle_errors
    def do_GET(self):
        path = urlsplit(self.path).path
        if path in STATIC_ASSETS:
            file_path = self.app.settings.root / path.lstrip("/")
            try:
                body = file_path.read_bytes()
            except OSError:
                self.send_error(HTTPStatus.NOT_FOUND)
                return
            self.send_response(HTTPStatus.OK)
            self.send_header("Content-Type", STATIC_ASSETS[path])
            self.send_header("Content-Length", str(len(body)))
            self.send_header("Cache-Control", "no-cache")
            self.end_headers()
            self.wfile.write(body)
            return
        upload = UPLOAD_RE.fullmatch(path)
        if upload:
            viewer = self.current_user()
            if not viewer:
                self.send_error(HTTPStatus.NOT_FOUND)
                return
            if upload.group(1) == "memes":
                with self.app.database.connect() as db:
                    accessible = db.execute(
                        "SELECT 1 FROM pins WHERE image_data = ? AND (is_hidden = 0 OR ?) LIMIT 1",
                        (path, bool(viewer["is_admin"])),
                    ).fetchone()
                if not accessible:
                    self.send_error(HTTPStatus.NOT_FOUND)
                    return
            extension = upload.group(3)
            file_path = self.app.images.path(path)
            if file_path is None:
                self.send_error(HTTPStatus.NOT_FOUND)
                return
            try:
                body = file_path.read_bytes()
            except OSError:
                self.send_error(HTTPStatus.NOT_FOUND)
                return
            content_type = {"webp": "image/webp", "gif": "image/gif", "png": "image/png", "jpeg": "image/jpeg"}[extension]
            self.send_response(HTTPStatus.OK)
            self.send_header("Content-Type", content_type)
            self.send_header("Content-Length", str(len(body)))
            self.send_header("Cache-Control", "private, no-store" if upload.group(1) == "memes" else "private, max-age=2592000, immutable")
            self.end_headers()
            self.wfile.write(body)
            return
        query = parse_qs(urlsplit(self.path).query, keep_blank_values=True)
        if path == "/api/me":
            self.send_json(200, self.app.profiles.me(self.current_user()))
        elif path == "/api/map-config":
            require_user(self.current_user())
            self.send_json(200, self.app.regions.map_config())
        elif match := re.fullmatch(r"/api/profiles/([A-Za-z0-9._]{3,24})", path):
            self.send_json(200, self.app.profiles.get(match[1], self.current_user()))
        elif path == "/api/pins":
            self.send_json(200, self.app.pins.get_pins(self.current_user()))
        elif path == "/api/leaderboard":
            self.send_json(200, self.app.pins.get_leaderboard(self.current_user(), query.get("city", ["hanoi"])[0].lower()))
        elif path.startswith("/api/admin/"):
            self.send_json(200, self.app.moderation.read(self.current_user(), path[len("/api/admin/"):], query))
        elif path in ("/", "/index.html"):
            self.send_page("index.html")
        elif path == "/landing.html":
            if not self.current_user():
                self.send_response(303)
                self.send_header("Location", "/?login=required")
                self.send_header("Content-Length", "0")
                self.end_headers()
                return
            self.send_page("landing.html")
        else:
            self.send_error(404)

    @handle_errors
    def do_DELETE(self):
        match = re.fullmatch(r"/api/pins/(\d+)", urlsplit(self.path).path)
        if not match:
            raise RequestError("not_found", 404)
        user = require_admin(self.current_user())
        if len(match[1]) > 19 or int(match[1]) >= 2**63:
            raise RequestError("pin_not_found", 404)
        data = self.read_json() if self.headers.get("Content-Length", "0") != "0" else {}
        if data is None:
            raise RequestError("invalid_request")
        self.send_json(200, self.app.pins.delete(match[1], data, user))

    @handle_errors
    def do_POST(self):
        path = urlsplit(self.path).path
        data = self.read_json()
        if data is None:
            raise RequestError("invalid_request")
        if path in ("/api/register", "/api/login"):
            register = path == "/api/register"
            payload, token = (self.app.auth.register if register else self.app.auth.login)(data)
            self.send_json(201 if register else 200, payload, [("Set-Cookie", self.session_cookie(token))])
        elif path == "/api/logout":
            self.send_json(200, self.app.auth.logout(self.session_token()), [("Set-Cookie", self.session_cookie("", 0))])
        elif path == "/api/profile/avatar":
            self.send_json(200, self.app.profiles.set_profile_avatar(data, self.current_user()))
        elif path == "/api/pins":
            self.send_json(201, self.app.pins.create_pin(data, self.current_user()))
        elif match := re.fullmatch(r"/api/pins/(\d+)/vote", path):
            self.send_json(200, self.app.pins.vote(match[1], data, self.current_user()))
        elif match := re.fullmatch(r"/api/pins/(\d+)/reports", path):
            self.send_json(201, self.app.moderation.submit_report(match[1], data, self.current_user()))
        elif path.startswith("/api/admin/"):
            actor = require_admin(self.current_user())
            match = re.fullmatch(r"/api/admin/(pins)/(\d+)/moderate|/api/admin/(reports)/(\d+)|/api/admin/(users)/(\d+)/restrictions", path)
            if not match:
                raise RequestError("not_found", 404)
            resource, target_id = [part for part in match.groups() if part is not None]
            self.send_json(200, self.app.moderation.change(actor, resource, target_id, data))
        else:
            raise RequestError("not_found", 404)


class MemeMapHTTPServer(ThreadingHTTPServer):
    # A page opens many asset connections together; avoid the small stdlib backlog.
    request_queue_size = 128


def create_server(settings=None, address=None, handler=MemeMapHandler):
    """Create an isolated application/server; also used by tests and deployment adapters."""
    settings = settings or Settings.from_env(ROOT)
    application = Application(settings)
    application.initialize()
    httpd = MemeMapHTTPServer(address or (settings.host, settings.port), handler)
    httpd.application = application
    return httpd


if __name__ == "__main__":
    with create_server() as httpd:
        print(f"MemeMap server running at http://{httpd.server_address[0]}:{httpd.server_port}")
        print("Open this computer's LAN or Tailscale IP from another device.")
        httpd.serve_forever()
