"""Account credentials and revocable sessions, independent of cookies/HTTP."""
from __future__ import annotations
import hashlib
import hmac
import secrets
from http import HTTPStatus
import sqlite3
import time
from .errors import RequestError
from .config import PBKDF2_ROUNDS, SESSION_SECONDS, USERNAME_RE

def password_digest(password: str, salt: bytes) -> bytes:
    return hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, PBKDF2_ROUNDS)


class AuthService:
    def __init__(self, database):
        self.database = database

    def current_user(self, token) -> sqlite3.Row | None:
        if not token:
            return None
        token_hash = hashlib.sha256(token.encode("ascii", errors="ignore")).hexdigest()
        now = int(time.time())
        with self.database.connect() as db:
            db.execute("DELETE FROM sessions WHERE expires_at <= ?", (now,))
            return db.execute(
                "SELECT users.id, users.name, users.username, users.email, users.avatar_path, users.is_admin FROM sessions "
                "JOIN users ON users.id = sessions.user_id "
                "WHERE sessions.token_hash = ? AND sessions.expires_at > ?",
                (token_hash, now),
            ).fetchone()

    def new_session(self, user_id: int) -> str:
        token = secrets.token_urlsafe(32)
        token_hash = hashlib.sha256(token.encode("ascii")).hexdigest()
        expires_at = int(time.time()) + SESSION_SECONDS
        with self.database.connect() as db:
            db.execute(
                "INSERT INTO sessions(token_hash, user_id, expires_at) VALUES (?, ?, ?)",
                (token_hash, user_id, expires_at),
            )
        return token

    def register(self, data: dict):
        name = str(data.get("name", "")).strip()
        username = str(data.get("username", "")).strip()
        password = str(data.get("password", ""))
        if len(name) < 1 or len(name) > 60:
            raise RequestError.from_payload(HTTPStatus.BAD_REQUEST, {"error": "invalid_name"})
        if not 3 <= len(username) <= 24 or not USERNAME_RE.fullmatch(username):
            raise RequestError.from_payload(HTTPStatus.BAD_REQUEST, {"error": "invalid_username"})
        if username.casefold() == "admin":
            raise RequestError.from_payload(HTTPStatus.CONFLICT, {"error": "username_exists"})
        if len(password) < 8 or len(password) > 256:
            raise RequestError.from_payload(HTTPStatus.BAD_REQUEST, {"error": "password_too_short"})
        if any(ord(char) < 33 or ord(char) > 126 for char in password):
            raise RequestError.from_payload(HTTPStatus.BAD_REQUEST, {"error": "invalid_password_chars"})

        salt = secrets.token_bytes(16)
        digest = password_digest(password, salt)
        # Keep the legacy NOT NULL email column populated until an email feature is added.
        # This placeholder is internal and is never returned to or requested from users.
        internal_email = f"{username.lower()}@accounts.mememap.invalid"
        try:
            with self.database.connect() as db:
                cursor = db.execute(
                    "INSERT INTO users(name, email, username, avatar_path, password_hash, password_salt, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
                    (name, internal_email, username, "/assets/default-profile-picture.webp", digest, salt, int(time.time())),
                )
                user_id = cursor.lastrowid
        except sqlite3.IntegrityError:
            with self.database.connect() as db:
                existing_username = db.execute("SELECT 1 FROM users WHERE username = ? COLLATE NOCASE", (username,)).fetchone()
            raise RequestError.from_payload(HTTPStatus.CONFLICT, {"error": "username_exists" if existing_username else "account_exists"})
        token = self.new_session(user_id)
        return ({"authenticated": True, "user": {"name": name, "username": username}}, token)

    def login(self, data: dict):
        username = str(data.get("username", "")).strip()
        password = str(data.get("password", ""))
        with self.database.connect() as db:
            user = db.execute("SELECT * FROM users WHERE username = ? COLLATE NOCASE", (username,)).fetchone()
        if not user:
            # Perform a comparable password derivation for unknown usernames.
            password_digest(password, bytes(16))
            raise RequestError.from_payload(HTTPStatus.UNAUTHORIZED, {"error": "invalid_credentials"})
        valid = hmac.compare_digest(password_digest(password, user["password_salt"]), user["password_hash"])
        if not valid:
            raise RequestError.from_payload(HTTPStatus.UNAUTHORIZED, {"error": "invalid_credentials"})
        token = self.new_session(user["id"])
        return ({"authenticated": True, "user": {"name": user["name"], "username": user["username"]}}, token)

    def logout(self, token):
        if token:
            token_hash = hashlib.sha256(token.encode("ascii", errors="ignore")).hexdigest()
            with self.database.connect() as db:
                db.execute("DELETE FROM sessions WHERE token_hash = ?", (token_hash,))
        return {"authenticated": False}
