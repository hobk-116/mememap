#!/usr/bin/env python3
"""Small standard-library web server and account backend for MemeMap."""

from __future__ import annotations

import hashlib
import hmac
import json
import os
import re
import secrets
import sqlite3
import time
import base64
from http import HTTPStatus
from http.cookies import SimpleCookie
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlsplit


ROOT = Path(__file__).resolve().parent
DB_PATH = ROOT / "mememap.sqlite3"
HOST = os.environ.get("MEMEMAP_HOST", "0.0.0.0")
PORT = int(os.environ.get("MEMEMAP_PORT", "8000"))
SESSION_SECONDS = 30 * 24 * 60 * 60
PBKDF2_ROUNDS = 310_000
USERNAME_RE = re.compile(r"^[A-Za-z0-9](?:[A-Za-z0-9._]{1,22}[A-Za-z0-9])?$")
CITY_BOUNDS = {"hanoi": (20.65, 21.30, 105.50, 106.20)}


def connect_db() -> sqlite3.Connection:
    connection = sqlite3.connect(DB_PATH, timeout=10)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    return connection


def initialize_db() -> None:
    with connect_db() as db:
        db.execute("PRAGMA journal_mode = WAL")
        db.executescript(
            """
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT NOT NULL UNIQUE COLLATE NOCASE,
                username TEXT,
                password_hash BLOB NOT NULL,
                password_salt BLOB NOT NULL,
                created_at INTEGER NOT NULL
            );
            CREATE TABLE IF NOT EXISTS sessions (
                token_hash TEXT PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                expires_at INTEGER NOT NULL
            );
            CREATE INDEX IF NOT EXISTS sessions_expiry ON sessions(expires_at);
            CREATE TABLE IF NOT EXISTS pins (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                lat REAL NOT NULL,
                lng REAL NOT NULL,
                title TEXT NOT NULL,
                story TEXT NOT NULL DEFAULT '',
                image_data TEXT,
                created_at INTEGER NOT NULL
            );
            CREATE INDEX IF NOT EXISTS pins_created_at ON pins(created_at DESC);
            CREATE TABLE IF NOT EXISTS pin_votes (
                pin_id INTEGER NOT NULL REFERENCES pins(id) ON DELETE CASCADE,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                value INTEGER NOT NULL CHECK(value IN (-1, 1)),
                PRIMARY KEY(pin_id, user_id)
            );
            """
        )
        columns = {row["name"] for row in db.execute("PRAGMA table_info(users)")}
        if "username" not in columns:
            db.execute("ALTER TABLE users ADD COLUMN username TEXT")
        # Backfill usernames for accounts created before the username field existed.
        legacy_users = db.execute("SELECT id, name, email FROM users WHERE username IS NULL OR username = ''").fetchall()
        for user in legacy_users:
            candidate = re.sub(r"[^a-z0-9._]+", "_", user["name"].lower()).strip("._")
            if not candidate.isascii() or not USERNAME_RE.fullmatch(candidate):
                candidate = re.sub(r"[^a-z0-9._]+", "_", user["email"].split("@", 1)[0].lower()).strip("._")
            candidate = candidate[:24].strip("._") or f"user{user['id']}"
            base = candidate
            suffix = 1
            while db.execute("SELECT 1 FROM users WHERE username = ? COLLATE NOCASE AND id != ?", (candidate, user["id"])).fetchone():
                ending = f"_{suffix}"
                candidate = f"{base[:24 - len(ending)]}{ending}"
                suffix += 1
            db.execute("UPDATE users SET username = ? WHERE id = ?", (candidate, user["id"]))
        db.execute("CREATE UNIQUE INDEX IF NOT EXISTS users_username_unique ON users(username COLLATE NOCASE)")


def password_digest(password: str, salt: bytes) -> bytes:
    return hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, PBKDF2_ROUNDS)


class MemeMapHandler(BaseHTTPRequestHandler):
    server_version = "MemeMap/0.1"

    def log_message(self, fmt: str, *args: object) -> None:
        # Keep normal request logging, but avoid leaking account data (never log bodies).
        super().log_message(fmt, *args)

    def end_headers(self) -> None:
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "same-origin")
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
        path = ROOT / filename
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
            if length < 1 or length > 8 * 1024 * 1024:
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

    def current_user(self) -> sqlite3.Row | None:
        token = self.session_token()
        if not token:
            return None
        token_hash = hashlib.sha256(token.encode("ascii", errors="ignore")).hexdigest()
        now = int(time.time())
        with connect_db() as db:
            db.execute("DELETE FROM sessions WHERE expires_at <= ?", (now,))
            return db.execute(
                "SELECT users.id, users.name, users.username, users.email FROM sessions "
                "JOIN users ON users.id = sessions.user_id "
                "WHERE sessions.token_hash = ? AND sessions.expires_at > ?",
                (token_hash, now),
            ).fetchone()

    def new_session(self, user_id: int) -> str:
        token = secrets.token_urlsafe(32)
        token_hash = hashlib.sha256(token.encode("ascii")).hexdigest()
        expires_at = int(time.time()) + SESSION_SECONDS
        with connect_db() as db:
            db.execute(
                "INSERT INTO sessions(token_hash, user_id, expires_at) VALUES (?, ?, ?)",
                (token_hash, user_id, expires_at),
            )
        return token

    def session_cookie(self, token: str, max_age: int = SESSION_SECONDS) -> str:
        # Secure is intentionally omitted for the local HTTP prototype. Enable HTTPS before public deployment.
        return f"mememap_session={token}; Path=/; HttpOnly; SameSite=Lax; Max-Age={max_age}"

    def do_GET(self) -> None:
        path = urlsplit(self.path).path
        if path == "/api/me":
            user = self.current_user()
            if user:
                self.send_json(HTTPStatus.OK, {"authenticated": True, "user": {"name": user["name"], "username": user["username"]}})
            else:
                self.send_json(HTTPStatus.OK, {"authenticated": False, "user": None})
            return
        if path == "/api/pins":
            user = self.current_user()
            if not user:
                self.send_json(HTTPStatus.UNAUTHORIZED, {"error": "authentication_required"})
                return
            self.get_pins(user["id"])
            return
        if path == "/api/leaderboard":
            user = self.current_user()
            if not user:
                self.send_json(HTTPStatus.UNAUTHORIZED, {"error": "authentication_required"})
                return
            query = parse_qs(urlsplit(self.path).query)
            city = query.get("city", ["hanoi"])[0].lower()
            self.get_leaderboard(user["id"], city)
            return

        if path in ("/", "/index.html"):
            self.send_page("index.html")
            return
        if path == "/landing.html":
            if not self.current_user():
                self.send_response(HTTPStatus.SEE_OTHER)
                self.send_header("Location", "/?login=required")
                self.send_header("Content-Length", "0")
                self.end_headers()
                return
            self.send_page("landing.html")
            return
        if path in ("/favicon.ico",):
            self.send_error(HTTPStatus.NOT_FOUND)
            return
        self.send_error(HTTPStatus.NOT_FOUND)

    def do_POST(self) -> None:
        path = urlsplit(self.path).path
        data = self.read_json()
        if data is None:
            self.send_json(HTTPStatus.BAD_REQUEST, {"error": "invalid_request"})
            return

        if path == "/api/register":
            self.register(data)
        elif path == "/api/login":
            self.login(data)
        elif path == "/api/logout":
            self.logout()
        elif path == "/api/pins":
            self.create_pin(data)
        elif re.fullmatch(r"/api/pins/\d+/vote", path):
            self.vote(path, data)
        else:
            self.send_json(HTTPStatus.NOT_FOUND, {"error": "not_found"})

    def get_pins(self, viewer_id: int) -> None:
        with connect_db() as db:
            rows = db.execute(
                """
                SELECT pins.id, pins.user_id, users.username, pins.lat, pins.lng,
                       pins.title, pins.story, pins.image_data, pins.created_at,
                       COALESCE(SUM(pin_votes.value), 0) AS aura,
                       (SELECT value FROM pin_votes WHERE pin_id = pins.id AND user_id = ?) AS viewer_vote
                FROM pins JOIN users ON users.id = pins.user_id
                LEFT JOIN pin_votes ON pin_votes.pin_id = pins.id
                GROUP BY pins.id
                ORDER BY pins.created_at DESC, pins.id DESC
                """,
                (viewer_id,),
            ).fetchall()
        self.send_json(HTTPStatus.OK, {"pins": [self.serialize_pin(row, viewer_id) for row in rows]})

    def get_leaderboard(self, viewer_id: int, city: str) -> None:
        bounds = CITY_BOUNDS.get(city)
        if not bounds:
            self.send_json(HTTPStatus.BAD_REQUEST, {"error": "unsupported_city"})
            return
        south, north, west, east = bounds
        with connect_db() as db:
            rows = db.execute(
                """
                SELECT users.id, users.name, users.username,
                       COUNT(DISTINCT pins.id) AS pin_count,
                       COALESCE(SUM(pin_votes.value), 0) AS aura
                FROM users
                JOIN pins ON pins.user_id = users.id
                    AND pins.lat BETWEEN ? AND ? AND pins.lng BETWEEN ? AND ?
                LEFT JOIN pin_votes ON pin_votes.pin_id = pins.id
                GROUP BY users.id
                ORDER BY aura DESC, pin_count DESC, users.username COLLATE NOCASE ASC
                LIMIT 100
                """,
                (south, north, west, east),
            ).fetchall()
        leaderboard = [
            {
                "rank": rank,
                "username": row["username"],
                "name": row["name"],
                "pin_count": row["pin_count"],
                "aura": row["aura"],
                "is_you": row["id"] == viewer_id,
            }
            for rank, row in enumerate(rows, start=1)
        ]
        self.send_json(HTTPStatus.OK, {"city": city, "leaders": leaderboard})

    @staticmethod
    def serialize_pin(row: sqlite3.Row, viewer_id: int) -> dict:
        return {
            "id": row["id"],
            "lat": row["lat"],
            "lng": row["lng"],
            "title": row["title"],
            "story": row["story"],
            "image": row["image_data"],
            "username": row["username"],
            "aura": row["aura"],
            "viewer_vote": row["viewer_vote"] or 0,
            "is_owner": row["user_id"] == viewer_id,
            "created_at": row["created_at"],
        }

    def create_pin(self, data: dict) -> None:
        user = self.current_user()
        if not user:
            self.send_json(HTTPStatus.UNAUTHORIZED, {"error": "authentication_required"})
            return
        try:
            lat = float(data.get("lat"))
            lng = float(data.get("lng"))
        except (TypeError, ValueError):
            self.send_json(HTTPStatus.BAD_REQUEST, {"error": "invalid_location"})
            return
        if not (20.65 <= lat <= 21.30 and 105.50 <= lng <= 106.20):
            self.send_json(HTTPStatus.BAD_REQUEST, {"error": "outside_hanoi"})
            return
        title = str(data.get("title", "")).strip()
        story = str(data.get("story", "")).strip()
        image_data = data.get("image") or None
        if not title or len(title) > 70 or len(story) > 240:
            self.send_json(HTTPStatus.BAD_REQUEST, {"error": "invalid_pin_text"})
            return
        if image_data is not None:
            if not isinstance(image_data, str) or len(image_data) > 7 * 1024 * 1024 or not re.fullmatch(
                r"data:image/(?:png|jpeg|gif|webp);base64,[A-Za-z0-9+/]+={0,2}", image_data
            ):
                self.send_json(HTTPStatus.BAD_REQUEST, {"error": "invalid_image"})
                return
            try:
                base64.b64decode(image_data.split(",", 1)[1], validate=True)
            except (ValueError, base64.binascii.Error):
                self.send_json(HTTPStatus.BAD_REQUEST, {"error": "invalid_image"})
                return
        now = int(time.time())
        with connect_db() as db:
            cursor = db.execute(
                "INSERT INTO pins(user_id, lat, lng, title, story, image_data, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
                (user["id"], lat, lng, title, story, image_data, now),
            )
            row = db.execute(
                """
                SELECT pins.id, pins.user_id, users.username, pins.lat, pins.lng,
                       pins.title, pins.story, pins.image_data, pins.created_at, 0 AS aura, NULL AS viewer_vote
                FROM pins JOIN users ON users.id = pins.user_id WHERE pins.id = ?
                """,
                (cursor.lastrowid,),
            ).fetchone()
        self.send_json(HTTPStatus.CREATED, {"pin": self.serialize_pin(row, user["id"])})

    def vote(self, path: str, data: dict) -> None:
        user = self.current_user()
        if not user:
            self.send_json(HTTPStatus.UNAUTHORIZED, {"error": "authentication_required"})
            return
        pin_id = int(path.split("/")[3])
        try:
            value = int(data.get("value"))
        except (TypeError, ValueError):
            self.send_json(HTTPStatus.BAD_REQUEST, {"error": "invalid_vote"})
            return
        if value not in (-1, 1):
            self.send_json(HTTPStatus.BAD_REQUEST, {"error": "invalid_vote"})
            return
        with connect_db() as db:
            pin = db.execute("SELECT id, user_id FROM pins WHERE id = ?", (pin_id,)).fetchone()
            if not pin:
                self.send_json(HTTPStatus.NOT_FOUND, {"error": "pin_not_found"})
                return
            if pin["user_id"] == user["id"]:
                self.send_json(HTTPStatus.FORBIDDEN, {"error": "cannot_vote_own_pin"})
                return
            existing = db.execute(
                "SELECT value FROM pin_votes WHERE pin_id = ? AND user_id = ?",
                (pin_id, user["id"]),
            ).fetchone()
            if existing and existing["value"] == value:
                db.execute("DELETE FROM pin_votes WHERE pin_id = ? AND user_id = ?", (pin_id, user["id"]))
            elif existing:
                db.execute("UPDATE pin_votes SET value = ? WHERE pin_id = ? AND user_id = ?", (value, pin_id, user["id"]))
            else:
                db.execute("INSERT INTO pin_votes(pin_id, user_id, value) VALUES (?, ?, ?)", (pin_id, user["id"], value))
            row = db.execute(
                """
                SELECT pins.id, pins.user_id, users.username, pins.lat, pins.lng,
                       pins.title, pins.story, pins.image_data, pins.created_at,
                       COALESCE((SELECT SUM(value) FROM pin_votes WHERE pin_id = pins.id), 0) AS aura,
                       (SELECT value FROM pin_votes WHERE pin_id = pins.id AND user_id = ?) AS viewer_vote
                FROM pins JOIN users ON users.id = pins.user_id WHERE pins.id = ?
                """,
                (user["id"], pin_id),
            ).fetchone()
        self.send_json(HTTPStatus.OK, {"pin": self.serialize_pin(row, user["id"])})

    def register(self, data: dict) -> None:
        name = str(data.get("name", "")).strip()
        username = str(data.get("username", "")).strip()
        password = str(data.get("password", ""))
        if len(name) < 1 or len(name) > 60:
            self.send_json(HTTPStatus.BAD_REQUEST, {"error": "invalid_name"})
            return
        if not 3 <= len(username) <= 24 or not USERNAME_RE.fullmatch(username):
            self.send_json(HTTPStatus.BAD_REQUEST, {"error": "invalid_username"})
            return
        if len(password) < 8 or len(password) > 256:
            self.send_json(HTTPStatus.BAD_REQUEST, {"error": "password_too_short"})
            return
        if any(ord(char) < 33 or ord(char) > 126 for char in password):
            self.send_json(HTTPStatus.BAD_REQUEST, {"error": "invalid_password_chars"})
            return

        salt = secrets.token_bytes(16)
        digest = password_digest(password, salt)
        # Keep the legacy NOT NULL email column populated until an email feature is added.
        # This placeholder is internal and is never returned to or requested from users.
        internal_email = f"{username.lower()}@accounts.mememap.invalid"
        try:
            with connect_db() as db:
                cursor = db.execute(
                    "INSERT INTO users(name, email, username, password_hash, password_salt, created_at) VALUES (?, ?, ?, ?, ?, ?)",
                    (name, internal_email, username, digest, salt, int(time.time())),
                )
                user_id = cursor.lastrowid
        except sqlite3.IntegrityError:
            with connect_db() as db:
                existing_username = db.execute("SELECT 1 FROM users WHERE username = ? COLLATE NOCASE", (username,)).fetchone()
            self.send_json(HTTPStatus.CONFLICT, {"error": "username_exists" if existing_username else "account_exists"})
            return
        token = self.new_session(user_id)
        self.send_json(
            HTTPStatus.CREATED,
            {"authenticated": True, "user": {"name": name, "username": username}},
            [("Set-Cookie", self.session_cookie(token))],
        )

    def login(self, data: dict) -> None:
        username = str(data.get("username", "")).strip()
        password = str(data.get("password", ""))
        with connect_db() as db:
            user = db.execute("SELECT * FROM users WHERE username = ? COLLATE NOCASE", (username,)).fetchone()
        if not user:
            # Perform a comparable password derivation for unknown emails.
            password_digest(password, bytes(16))
            self.send_json(HTTPStatus.UNAUTHORIZED, {"error": "invalid_credentials"})
            return
        valid = hmac.compare_digest(password_digest(password, user["password_salt"]), user["password_hash"])
        if not valid:
            self.send_json(HTTPStatus.UNAUTHORIZED, {"error": "invalid_credentials"})
            return
        token = self.new_session(user["id"])
        self.send_json(
            HTTPStatus.OK,
            {"authenticated": True, "user": {"name": user["name"], "username": user["username"]}},
            [("Set-Cookie", self.session_cookie(token))],
        )

    def logout(self) -> None:
        token = self.session_token()
        if token:
            token_hash = hashlib.sha256(token.encode("ascii", errors="ignore")).hexdigest()
            with connect_db() as db:
                db.execute("DELETE FROM sessions WHERE token_hash = ?", (token_hash,))
        self.send_json(
            HTTPStatus.OK,
            {"authenticated": False},
            [("Set-Cookie", self.session_cookie("", max_age=0))],
        )


if __name__ == "__main__":
    initialize_db()
    print(f"MemeMap server running at http://{HOST}:{PORT}")
    print("Open this computer's LAN or Tailscale IP from another device.")
    ThreadingHTTPServer((HOST, PORT), MemeMapHandler).serve_forever()
