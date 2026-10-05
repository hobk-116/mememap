"""Pin creation, reads, votes, deletion and rankings."""
from __future__ import annotations
import subprocess
from pathlib import Path
from http import HTTPStatus
import sqlite3
import time
from .errors import RequestError, require_user, require_admin
from .media import decode_upload, InvalidImage
from .moderation import bounded_text, report_deleted_pin, restriction


class PinService:
    def __init__(self, database, images, regions):
        self.database, self.images, self.regions = database, images, regions

    def get_pins(self, user):
        require_user(user)
        viewer_id, viewer_is_admin = user["id"], bool(user["is_admin"])
        with self.database.connect() as db:
            rows = db.execute(
                """
                SELECT pins.id, pins.user_id, users.username, pins.lat, pins.lng,
                       pins.title, pins.story, pins.image_data, pins.created_at,
                       COALESCE(SUM(pin_votes.value), 0) AS aura,
                       (SELECT value FROM pin_votes WHERE pin_id = pins.id AND user_id = ?) AS viewer_vote
                FROM pins JOIN users ON users.id = pins.user_id
                LEFT JOIN pin_votes ON pin_votes.pin_id = pins.id
                WHERE pins.is_hidden = 0
                GROUP BY pins.id
                ORDER BY pins.created_at DESC, pins.id DESC
                """,
                (viewer_id,),
            ).fetchall()
        return {
            "pins": [self.serialize_pin(row, viewer_id, viewer_is_admin) for row in rows],
            "can_delete_pins": viewer_is_admin,
        }

    def get_leaderboard(self, user, city: str):
        require_user(user)
        viewer_id = user["id"]
        bounds = self.regions.leaderboards.get(city)
        if not bounds:
            raise RequestError.from_payload(HTTPStatus.BAD_REQUEST, {"error": "unsupported_city"})
        south, north, west, east = bounds.values()
        with self.database.connect() as db:
            rows = db.execute(
                """
                SELECT users.id, users.name, users.username,
                       COUNT(DISTINCT pins.id) AS pin_count,
                       COALESCE(SUM(pin_votes.value), 0) AS aura
                FROM users
                JOIN pins ON pins.user_id = users.id
                    AND pins.lat BETWEEN ? AND ? AND pins.lng BETWEEN ? AND ?
                    AND pins.is_hidden = 0
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
        return {"city": city, "leaders": leaderboard}

    @staticmethod
    def serialize_pin(row: sqlite3.Row, viewer_id: int, viewer_is_admin: bool = False) -> dict:
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
            "can_delete": viewer_is_admin,
            "created_at": row["created_at"],
        }

    def create_pin(self, data: dict, user):
        if not user:
            raise RequestError.from_payload(HTTPStatus.UNAUTHORIZED, {"error": "authentication_required"})
        with self.database.connect() as db:
            blocked = restriction(db, user["id"], "post")
        if blocked:
            raise RequestError.from_payload(HTTPStatus.FORBIDDEN, blocked)
        try:
            lat = float(data.get("lat"))
            lng = float(data.get("lng"))
        except (TypeError, ValueError):
            raise RequestError.from_payload(HTTPStatus.BAD_REQUEST, {"error": "invalid_location"})
        if not self.regions.posting.contains(lat, lng):
            raise RequestError.from_payload(HTTPStatus.BAD_REQUEST, {"error": "outside_map_bounds"})
        title = str(data.get("title", "")).strip()
        story = str(data.get("story", "")).strip()
        image_data = data.get("image") or None
        uploaded_image_path: Path | None = None
        if not title or len(title) > 70 or len(story) > 240:
            raise RequestError.from_payload(HTTPStatus.BAD_REQUEST, {"error": "invalid_pin_text"})
        if image_data is not None:
            try:
                image_bytes = decode_upload(image_data, "invalid_image", "image_too_large")
            except InvalidImage as error:
                raise RequestError.from_payload(HTTPStatus.BAD_REQUEST, {"error": str(error)})
            except (OSError, subprocess.SubprocessError, RuntimeError):
                raise RequestError.from_payload(HTTPStatus.INTERNAL_SERVER_ERROR, {"error": "webp_conversion_failed"})
            try:
                image_data, uploaded_image_path = self.images.save("memes", image_bytes)
            except OSError:
                raise RequestError.from_payload(HTTPStatus.INTERNAL_SERVER_ERROR, {"error": "image_storage_failed"})
        now = int(time.time())
        try:
            with self.database.connect() as db:
                db.execute("BEGIN IMMEDIATE")
                blocked = restriction(db, user["id"], "post")
                if blocked:
                    if uploaded_image_path:
                        uploaded_image_path.unlink(missing_ok=True)
                    raise RequestError.from_payload(HTTPStatus.FORBIDDEN, blocked)
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
        except sqlite3.Error:
            if uploaded_image_path:
                uploaded_image_path.unlink(missing_ok=True)
            raise RequestError.from_payload(HTTPStatus.INTERNAL_SERVER_ERROR, {"error": "pin_storage_failed"})
        return {"pin": self.serialize_pin(row, user["id"], bool(user["is_admin"]))}

    def vote(self, pin_text: str, data: dict, user):
        if not user:
            raise RequestError.from_payload(HTTPStatus.UNAUTHORIZED, {"error": "authentication_required"})
        if len(pin_text) > 19 or int(pin_text) >= 2**63:
            raise RequestError.from_payload(HTTPStatus.NOT_FOUND, {"error": "pin_not_found"})
        pin_id = int(pin_text)
        value = data.get("value")
        if type(value) is not int or value not in (-1, 1):
            raise RequestError.from_payload(HTTPStatus.BAD_REQUEST, {"error": "invalid_vote"})
        with self.database.connect() as db:
            db.execute("BEGIN IMMEDIATE")
            blocked = restriction(db, user["id"], "vote")
            if blocked:
                raise RequestError.from_payload(HTTPStatus.FORBIDDEN, blocked)
            pin = db.execute("SELECT id, user_id FROM pins WHERE id = ? AND is_hidden = 0", (pin_id,)).fetchone()
            if not pin:
                raise RequestError.from_payload(HTTPStatus.NOT_FOUND, {"error": "pin_not_found"})
            if pin["user_id"] == user["id"]:
                raise RequestError.from_payload(HTTPStatus.FORBIDDEN, {"error": "cannot_vote_own_pin"})
            existing = db.execute(
                "SELECT value FROM pin_votes WHERE pin_id = ? AND user_id = ?",
                (pin_id, user["id"]),
            ).fetchone()
            if existing and existing["value"] == value:
                db.execute("DELETE FROM pin_votes WHERE pin_id = ? AND user_id = ?", (pin_id, user["id"]))
            elif existing:
                db.execute("UPDATE pin_votes SET value = ?, updated_at = ? WHERE pin_id = ? AND user_id = ?", (value, int(time.time()), pin_id, user["id"]))
            else:
                db.execute("INSERT INTO pin_votes(pin_id, user_id, value, updated_at) VALUES (?, ?, ?, ?)", (pin_id, user["id"], value, int(time.time())))
            db.execute("INSERT INTO vote_events(user_id, pin_id, created_at) VALUES (?, ?, ?)", (user["id"], pin_id, int(time.time())))
            db.execute("DELETE FROM vote_events WHERE created_at < ?", (int(time.time()) - 30 * 86400,))
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
        return {"pin": self.serialize_pin(row, user["id"], bool(user["is_admin"]))}

    def delete(self, pin_text, data, user):
        require_admin(user)
        if len(pin_text) > 19 or int(pin_text) >= 2**63:
            raise RequestError("pin_not_found", 404)
        pin_id = int(pin_text)
        reason = bounded_text(data.get("reason", ""), 500)
        if reason is None:
            raise RequestError.from_payload(HTTPStatus.BAD_REQUEST, {"error": "invalid_reason"})
        with self.database.connect() as db:
            db.execute("BEGIN IMMEDIATE")
            pin = db.execute("SELECT id, title, image_data FROM pins WHERE id = ?", (pin_id,)).fetchone()
            if not pin:
                raise RequestError.from_payload(HTTPStatus.NOT_FOUND, {"error": "pin_not_found"})
            report_deleted_pin(db, user, pin, reason)
            db.execute("DELETE FROM pins WHERE id = ?", (pin_id,))
        image_path = pin["image_data"] or ""
        stored_image = self.images.path(image_path) if image_path.startswith("/uploads/memes/") else None
        if stored_image:
            stored_image.unlink(missing_ok=True)
        return {"deleted": True, "id": pin_id}
