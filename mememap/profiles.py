"""Profile identity, global visible totals and avatar replacement."""
import sqlite3
import subprocess
from http import HTTPStatus
from .errors import RequestError, require_user
from .media import decode_upload, InvalidImage


class ProfileService:
    def __init__(self, database, images):
        self.database, self.images = database, images

    def me(self, user):
        if user is None:
            return {"authenticated": False, "user": None}
        profile = self.get(user["username"], user)["user"]
        profile.pop("is_self")
        profile["is_admin"] = bool(user["is_admin"])
        return {"authenticated": True, "user": profile}

    def get(self, username, viewer):
        require_user(viewer)
        with self.database.connect() as db:
            profile = db.execute(
                "SELECT u.id, u.name, u.username, u.avatar_path, "
                "(SELECT COUNT(*) FROM pins p WHERE p.user_id = u.id AND p.is_hidden = 0) AS meme_count, "
                "(SELECT COALESCE(SUM(v.value), 0) FROM pins p JOIN pin_votes v ON v.pin_id = p.id "
                "WHERE p.user_id = u.id AND p.is_hidden = 0) AS aura FROM users u WHERE u.username = ? COLLATE NOCASE",
                (username,),
            ).fetchone()
        if profile is None:
            raise RequestError("profile_not_found", 404)
        return {"user": {"name": profile["name"], "username": profile["username"],
                         "avatar": profile["avatar_path"] or "/assets/default-profile-picture.webp",
                         "meme_count": profile["meme_count"], "aura": profile["aura"],
                         "is_self": profile["id"] == viewer["id"]}}

    def set_profile_avatar(self, data: dict, user):
        if not user:
            raise RequestError.from_payload(HTTPStatus.UNAUTHORIZED, {"error": "authentication_required"})
        try:
            image_bytes = decode_upload(data.get("image"), "invalid_avatar", "invalid_avatar", max_edge=512)
        except InvalidImage as error:
            raise RequestError.from_payload(HTTPStatus.BAD_REQUEST, {"error": str(error)})
        except (OSError, subprocess.SubprocessError, RuntimeError):
            raise RequestError.from_payload(HTTPStatus.INTERNAL_SERVER_ERROR, {"error": "webp_conversion_failed"})
        try:
            avatar_url, image_path = self.images.save("profiles", image_bytes)
            with self.database.connect() as db:
                db.execute("BEGIN IMMEDIATE")
                previous_path = db.execute("SELECT avatar_path FROM users WHERE id = ?", (user["id"],)).fetchone()["avatar_path"] or ""
                db.execute("UPDATE users SET avatar_path = ? WHERE id = ?", (avatar_url, user["id"]))
        except (OSError, sqlite3.Error):
            if "image_path" in locals():
                image_path.unlink(missing_ok=True)
            raise RequestError.from_payload(HTTPStatus.INTERNAL_SERVER_ERROR, {"error": "avatar_storage_failed"})
        previous_upload = self.images.path(previous_path) if previous_path.startswith("/uploads/profiles/") else None
        if previous_upload:
            previous_upload.unlink(missing_ok=True)
        return {"avatar": avatar_url}
