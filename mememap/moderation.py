"""Moderation storage and authenticated administration endpoints for MemeMap."""

from __future__ import annotations

import math
import re
import sqlite3
import time
import unicodedata
from datetime import datetime, timezone
from .errors import RequestError as AdminRequestError, require, require_admin, require_user


PAGE_SIZE = 20
REPORT_REASONS = {"spam", "harassment", "inappropriate", "misleading", "other"}


def record_audit(db, actor, action, target_type, target_id, target_label, reason=""):
    db.execute(
        "INSERT INTO admin_audit(actor_id, actor_username, action, target_type, target_id, target_label, reason, created_at) "
        "VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        (actor["id"], actor["username"], action, target_type, target_id, target_label, reason, int(time.time())),
    )


def restriction(db, user_id, scope):
    row = db.execute(
        f"SELECT {scope}_restricted_until AS until, {scope}_restriction_reason AS reason FROM users WHERE id = ?",
        (user_id,),
    ).fetchone()
    if row and row["until"] and row["until"] > int(time.time()):
        return {"error": f"{scope}_restricted", "until": row["until"], "reason": row["reason"]}
    return None


def report_deleted_pin(db, actor, pin, reason=""):
    """Keep report/audit snapshots when the actual pin and its media are removed."""
    db.execute(
        "UPDATE pin_reports SET status = 'resolved', resolved_at = ?, resolved_by = ?, "
        "resolution = 'deleted', resolution_reason = ? "
        "WHERE pin_id = ? AND status != 'resolved'",
        (int(time.time()), actor["username"], reason or "pin_deleted", pin["id"]),
    )
    record_audit(db, actor, "delete_pin", "pin", pin["id"], pin["title"], reason)


def pin_row(db, pin_id):
    row = db.execute(
        "SELECT p.id, p.user_id, u.username, u.name, p.title, p.story, p.image_data AS image, "
        "p.lat, p.lng, p.created_at, p.is_hidden, p.hidden_reason, p.hidden_at, "
        "COALESCE((SELECT SUM(value) FROM pin_votes WHERE pin_id = p.id), 0) AS aura "
        "FROM pins p JOIN users u ON u.id = p.user_id WHERE p.id = ?", (pin_id,),
    ).fetchone()
    if not row:
        return None
    result = dict(row)
    result["is_hidden"] = bool(result["is_hidden"])
    return result


USER_COLUMNS = """
    u.id, u.name, u.username, u.is_admin, u.created_at,
    u.post_restricted_until, u.post_restriction_reason,
    u.vote_restricted_until, u.vote_restriction_reason,
    (SELECT COUNT(*) FROM pins p WHERE p.user_id = u.id AND p.is_hidden = 0) AS meme_count,
    COALESCE((SELECT SUM(v.value) FROM pin_votes v JOIN pins p ON p.id = v.pin_id
              WHERE p.user_id = u.id AND p.is_hidden = 0), 0) AS aura
"""


def user_row(row):
    result = dict(row)
    result["is_admin"] = bool(result["is_admin"])
    now = int(time.time())
    for scope in ("post", "vote"):
        if not result[f"{scope}_restricted_until"] or result[f"{scope}_restricted_until"] <= now:
            result[f"{scope}_restricted_until"] = None
            result[f"{scope}_restriction_reason"] = ""
    return result


def bounded_text(value, limit, required=False):
    if not isinstance(value, str):
        return None
    value = value.strip()
    if len(value) > limit or (required and not value):
        return None
    return value


def route_id(value):
    require(len(str(value)) <= 19 and 0 < int(value) < 2**63, "not_found", 404)
    return int(value)


def filter_dates(query, where, args, column):
    dates = {}
    for key in ("since", "until"):
        value = query.get(key, [""])[0]
        if not value:
            continue
        require(re.fullmatch(r"\d{4}-\d{2}-\d{2}", value), "invalid_date")
        try:
            dates[key] = int(datetime.strptime(value, "%Y-%m-%d").replace(tzinfo=timezone.utc).timestamp())
        except ValueError:
            raise AdminRequestError("invalid_date") from None
        where.append(column + (" >= ?" if key == "since" else " < ?"))
        args.append(dates[key] + (86400 if key == "until" else 0))
    require(not ("since" in dates and "until" in dates and dates["since"] > dates["until"]), "invalid_date_range")


def pagination(query, total):
    raw = query.get("page", ["1"])[0]
    require(re.fullmatch(r"[1-9]\d{0,8}", raw), "invalid_page")
    pages = max(1, math.ceil(total / PAGE_SIZE))
    page = min(int(raw), pages)
    return {"total": total, "page": page, "pages": pages}, (page - 1) * PAGE_SIZE


def like_search(value):
    return "%" + value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_") + "%"


class ModerationService:
    def __init__(self, database, images):
        self.database, self.images = database, images

    def read(self, actor, resource, query):
        require_admin(actor)
        readers = {"overview": self._overview, "pins": self._admin_pins,
                   "reports": self._admin_reports, "users": self._admin_users, "audit": self._audit}
        require(resource in readers, "not_found", 404)
        try:
            with self.database.connect() as db:
                return readers[resource](db, query)
        except sqlite3.Error:
            raise AdminRequestError("moderation_storage_failed", 500) from None

    def change(self, actor, resource, target_id, data):
        require_admin(actor)
        writers = {"pins": self._moderate_pin, "reports": self._resolve_reports, "users": self._restrict_user}
        require(resource in writers, "not_found", 404)
        try:
            with self.database.connect() as db:
                db.execute("BEGIN IMMEDIATE")
                return writers[resource](db, actor, route_id(target_id), data)
        except sqlite3.Error:
            raise AdminRequestError("moderation_storage_failed", 500) from None

    def _admin_pins(self, db, query):
        q = bounded_text(query.get("q", [""])[0], 120)
        require(q is not None, "invalid_search")
        status = query.get("status", ["all"])[0]
        image = query.get("image", ["all"])[0]
        sort = query.get("sort", ["newest"])[0]
        sorts = {"newest": "p.created_at DESC, p.id DESC", "oldest": "p.created_at, p.id",
                 "aura_desc": "aura DESC, p.id DESC", "aura_asc": "aura, p.id DESC"}
        require(status in ("all", "visible", "hidden"), "invalid_status")
        require(image in ("all", "yes", "no"), "invalid_image_filter")
        require(sort in sorts, "invalid_sort")
        where, args = ["1 = 1"], []
        if q:
            where.append("(p.title LIKE ? ESCAPE '\\' OR p.story LIKE ? ESCAPE '\\' OR u.username LIKE ? ESCAPE '\\')")
            args.extend([like_search(q), like_search(q), like_search(q.lstrip("@"))])
        if status != "all":
            where.append("p.is_hidden = ?")
            args.append(int(status == "hidden"))
        if image != "all":
            where.append("COALESCE(p.image_data, '') " + ("!=" if image == "yes" else "=") + " ''")
        dates = {}
        for key in ("since", "until"):
            value = query.get(key, [""])[0]
            if not value:
                continue
            require(re.fullmatch(r"\d{4}-\d{2}-\d{2}", value), "invalid_date")
            try:
                dates[key] = int(datetime.strptime(value, "%Y-%m-%d").replace(tzinfo=timezone.utc).timestamp())
            except ValueError:
                raise AdminRequestError("invalid_date") from None
            where.append("p.created_at >= ?" if key == "since" else "p.created_at < ?")
            args.append(dates[key] + (86400 if key == "until" else 0))
        require(not ("since" in dates and "until" in dates and dates["since"] > dates["until"]), "invalid_date_range")
        base = " FROM pins p JOIN users u ON u.id = p.user_id WHERE " + " AND ".join(where)
        total = db.execute("SELECT COUNT(*)" + base, args).fetchone()[0]
        result, offset = pagination(query, total)
        rows = db.execute(
            "SELECT p.id, COALESCE((SELECT SUM(value) FROM pin_votes WHERE pin_id = p.id), 0) AS aura" + base
            + " ORDER BY " + sorts[sort] + " LIMIT ? OFFSET ?", [*args, PAGE_SIZE, offset],
        ).fetchall()
        result["pins"] = [pin_row(db, row["id"]) for row in rows]
        alerts = self._spam_alerts(db)
        for pin in result["pins"]:
            pin["signals"] = list(dict.fromkeys(alert["kind"] for alert in alerts
                if alert.get("user_id") == pin["user_id"] and alert["kind"] != "vote_burst"))
        return result

    def _moderate_pin(self, db, actor, pin_id, data):
        action = data.get("action")
        require(action in ("hide", "restore"), "invalid_action")
        reason = bounded_text(data.get("reason", ""), 500, required=action == "hide")
        require(reason is not None, "invalid_reason")
        pin = pin_row(db, pin_id)
        require(pin, "pin_not_found", 404)
        hidden = action == "hide"
        if pin["is_hidden"] != hidden:
            db.execute("UPDATE pins SET is_hidden = ?, hidden_reason = ?, hidden_at = ? WHERE id = ?",
                       (int(hidden), reason if hidden else "", int(time.time()) if hidden else None, pin_id))
            record_audit(db, actor, "hide_pin" if hidden else "restore_pin", "pin", pin_id, pin["title"], reason)
        return {"pin": pin_row(db, pin_id)}

    def submit_report(self, pin_id, data, reporter):
        if not reporter:
            raise AdminRequestError.from_payload(401, {"error": "authentication_required"})
        try:
            pin_id = route_id(pin_id)
            reason = data.get("reason")
            require(isinstance(reason, str) and reason in REPORT_REASONS, "invalid_report_reason")
            detail = bounded_text(data.get("detail", ""), 500, required=reason == "other")
            require(detail is not None, "invalid_report_detail")
            now = int(time.time())
            with self.database.connect() as db:
                db.execute("BEGIN IMMEDIATE")
                pin = pin_row(db, pin_id)
                require(pin and not pin["is_hidden"], "pin_not_found", 404)
                duplicate = db.execute("SELECT 1 FROM pin_reports WHERE pin_id = ? AND reporter_id = ? AND status != 'resolved'",
                                       (pin_id, reporter["id"])).fetchone()
                require(not duplicate, "report_already_open", 409)
                recent = db.execute("SELECT COUNT(*) FROM pin_reports WHERE reporter_id = ? AND created_at > ?",
                                    (reporter["id"], now - 3600)).fetchone()[0]
                require(recent < 10, "report_rate_limited", 429)
                cursor = db.execute(
                    "INSERT INTO pin_reports(pin_id, reporter_id, reporter_username, pin_title, pin_username, reason, detail, created_at) "
                    "VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                    (pin_id, reporter["id"], reporter["username"], pin["title"], pin["username"], reason, detail, now),
                )
                report_id = cursor.lastrowid
        except AdminRequestError:
            raise
        except sqlite3.Error:
            raise AdminRequestError.from_payload(500, {"error": "moderation_storage_failed"})
        return {"report": {"id": report_id, "pin_id": pin_id, "status": "pending"}}

    def _admin_reports(self, db, query):
        status = query.get("status", ["pending"])[0]
        require(status in ("pending", "reviewing", "resolved"), "invalid_status")
        total = db.execute("SELECT COUNT(DISTINCT pin_id) FROM pin_reports WHERE status = ?", (status,)).fetchone()[0]
        result, offset = pagination(query, total)
        groups = db.execute(
            "SELECT pin_id, MAX(created_at) AS last_report_at FROM pin_reports WHERE status = ? "
            "GROUP BY pin_id ORDER BY last_report_at DESC, pin_id DESC LIMIT ? OFFSET ?", (status, PAGE_SIZE, offset),
        ).fetchall()
        result["pending_count"] = db.execute("SELECT COUNT(*) FROM pin_reports WHERE status != 'resolved'").fetchone()[0]
        result["reports"] = []
        for group in groups:
            reports = [dict(row) for row in db.execute(
                "SELECT id, reporter_username AS username, reason, detail, status, created_at, resolved_at, "
                "resolved_by, resolution, resolution_reason, pin_title, pin_username FROM pin_reports "
                "WHERE pin_id = ? AND status = ? ORDER BY created_at DESC, id DESC", (group["pin_id"], status),
            )]
            pin = pin_row(db, group["pin_id"])
            snapshot = reports[0]
            item = {"pin_id": group["pin_id"], "title": pin["title"] if pin else snapshot["pin_title"],
                    "username": pin["username"] if pin else snapshot["pin_username"],
                    "is_hidden": pin["is_hidden"] if pin else True, "pin_deleted": pin is None,
                    "report_count": len(reports), "last_report_at": group["last_report_at"],
                    "reasons": list(dict.fromkeys(row["reason"] for row in reports)), "reports": reports,
                    **{key: pin[key] if pin else None for key in ("story", "image", "lat", "lng")}}
            for report in reports:
                del report["pin_title"], report["pin_username"]
            result["reports"].append(item)
        return result

    def _resolve_reports(self, db, actor, pin_id, data):
        action = data.get("action")
        require(action in ("review", "dismiss", "hide"), "invalid_action")
        reason = bounded_text(data.get("reason", ""), 500, required=action != "review")
        require(reason is not None, "invalid_reason")
        rows = db.execute("SELECT pin_title FROM pin_reports WHERE pin_id = ? AND status != 'resolved'", (pin_id,)).fetchall()
        require(rows, "open_reports_not_found", 404)
        if action == "hide":
            self._moderate_pin(db, actor, pin_id, {"action": "hide", "reason": reason})
        if action == "review":
            cursor = db.execute("UPDATE pin_reports SET status = 'reviewing' WHERE pin_id = ? AND status = 'pending'", (pin_id,))
        else:
            cursor = db.execute(
                "UPDATE pin_reports SET status = 'resolved', resolved_at = ?, resolved_by = ?, resolution = ?, resolution_reason = ? "
                "WHERE pin_id = ? AND status != 'resolved'", (int(time.time()), actor["username"], action, reason, pin_id),
            )
        if cursor.rowcount:
            record_audit(db, actor, {"review": "review_reports", "dismiss": "dismiss_reports", "hide": "resolve_reports"}[action],
                         "pin", pin_id, rows[0]["pin_title"], reason)
        return {"updated": True, "pin_id": pin_id, "affected": cursor.rowcount}

    def _admin_users(self, db, query):
        q = bounded_text(query.get("q", [""])[0], 120)
        require(q is not None, "invalid_search")
        status = query.get("status", ["all"])[0]
        require(status in ("all", "restricted"), "invalid_status")
        where, args = ["1 = 1"], []
        if q:
            where.append("(u.name LIKE ? ESCAPE '\\' OR u.username LIKE ? ESCAPE '\\')")
            args.extend([like_search(q), like_search(q.lstrip("@"))])
        if status == "restricted":
            where.append("(u.post_restricted_until > ? OR u.vote_restricted_until > ?)")
            args.extend([int(time.time())] * 2)
        filter_dates(query, where, args, "u.created_at")
        base = " FROM users u WHERE " + " AND ".join(where)
        total = db.execute("SELECT COUNT(*)" + base, args).fetchone()[0]
        result, offset = pagination(query, total)
        rows = db.execute("SELECT " + USER_COLUMNS + base + " ORDER BY u.created_at DESC, u.id DESC LIMIT ? OFFSET ?",
                          [*args, PAGE_SIZE, offset]).fetchall()
        result["users"] = [user_row(row) for row in rows]
        alerts = self._spam_alerts(db)
        for user in result["users"]:
            user["signals"] = list(dict.fromkeys(alert["kind"] for alert in alerts if alert.get("user_id") == user["id"]))
        return result

    def _restrict_user(self, db, actor, user_id, data):
        scope, action = data.get("scope"), data.get("action")
        require(scope in ("post", "vote", "both"), "invalid_scope")
        require(action in ("restrict", "lift"), "invalid_action")
        reason = bounded_text(data.get("reason", ""), 500, required=True)
        require(reason is not None, "invalid_reason")
        target = db.execute("SELECT id, username, is_admin FROM users WHERE id = ?", (user_id,)).fetchone()
        require(target, "user_not_found", 404)
        require(target["id"] != actor["id"] and not target["is_admin"], "protected_admin", 403)
        hours = data.get("duration_hours")
        if action == "restrict":
            require(type(hours) is int and hours in (1, 24, 168, 720), "invalid_duration")
        until = int(time.time()) + hours * 3600 if action == "restrict" else None
        for kind in (("post", "vote") if scope == "both" else (scope,)):
            db.execute(f"UPDATE users SET {kind}_restricted_until = ?, {kind}_restriction_reason = ? WHERE id = ?",
                       (until, reason if until else "", user_id))
            record_audit(db, actor, f"{action}_{kind}", "user", user_id, "@" + target["username"], reason)
        row = db.execute("SELECT " + USER_COLUMNS + " FROM users u WHERE u.id = ?", (user_id,)).fetchone()
        return {"user": user_row(row)}

    def _audit(self, db, query):
        where, args = ["1 = 1"], []
        for field in ("action", "actor", "target_type", "target_id"):
            value = query.get(field, [""])[0]
            if not value:
                continue
            require(len(value) <= 120, "invalid_filter")
            if field == "target_type":
                require(value in ("pin", "user"), "invalid_target_type")
            if field == "target_id":
                require(re.fullmatch(r"[1-9]\d{0,18}", value) and int(value) < 2**63, "invalid_target_id")
            if field == "actor":
                where.append("actor_username LIKE ? ESCAPE '\\'")
                args.append(like_search(value.lstrip("@")))
            else:
                where.append(field + " = ?")
                args.append(value)
        base = " FROM admin_audit WHERE " + " AND ".join(where)
        total = db.execute("SELECT COUNT(*)" + base, args).fetchone()[0]
        result, offset = pagination(query, total)
        result["entries"] = [dict(row) for row in db.execute(
            "SELECT id, actor_username, action, target_type, target_id, target_label, reason, created_at" + base
            + " ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?", [*args, PAGE_SIZE, offset],
        )]
        return result

    def _overview(self, db, query):
        days = query.get("days", ["7"])[0]
        require(days in ("1", "7", "30"), "invalid_days")
        since = int(time.time()) - int(days) * 86400
        stats = {
            "new_pins": db.execute("SELECT COUNT(*) FROM pins WHERE created_at >= ?", (since,)).fetchone()[0],
            "new_users": db.execute("SELECT COUNT(*) FROM users WHERE created_at >= ?", (since,)).fetchone()[0],
            "pending_reports": db.execute("SELECT COUNT(*) FROM pin_reports WHERE status != 'resolved'").fetchone()[0],
            "image_bytes": 0,
        }
        for directory in (self.images.memes, self.images.profiles):
            if directory.exists():
                for path in directory.iterdir():
                    try:
                        if path.is_file() and not path.is_symlink():
                            stats["image_bytes"] += path.stat().st_size
                    except OSError:
                        continue
        return {"stats": stats, "alerts": self._spam_alerts(db), "days": int(days)}

    @staticmethod
    def _spam_alerts(db):
        now = int(time.time())
        alerts = []
        for row in db.execute(
            "SELECT u.id AS user_id, u.username, COUNT(*) AS count FROM pins p JOIN users u ON u.id = p.user_id "
            "WHERE p.created_at >= ? GROUP BY u.id HAVING COUNT(*) >= 5 ORDER BY count DESC LIMIT 20", (now - 600,),
        ):
            alerts.append({**dict(row), "kind": "posting_burst", "detail": "5+ memes / 10 min", "window_seconds": 600})
        # Normalize text only, preserving accent distinctions and never scanning image contents.
        duplicates = {}
        rows = db.execute(
            "SELECT p.id, p.user_id, u.username, p.title, p.story FROM pins p JOIN users u ON u.id = p.user_id "
            "WHERE p.created_at >= ? ORDER BY p.created_at DESC, p.id DESC", (now - 86400,),
        )
        for row in rows:
            normalized = tuple(" ".join(unicodedata.normalize("NFKC", row[field]).casefold().split()) for field in ("title", "story"))
            key = row["user_id"], normalized
            if key not in duplicates:
                duplicates[key] = {"kind": "duplicate_content", "pin_id": row["id"], "user_id": row["user_id"],
                                   "username": row["username"], "title": row["title"], "count": 0,
                                   "detail": "3+ identical title and text / 24 h", "window_seconds": 86400}
            duplicates[key]["count"] += 1
        alerts.extend(sorted((item for item in duplicates.values() if item["count"] >= 3), key=lambda item: -item["count"])[:20])
        for row in db.execute(
            "SELECT u.id AS user_id, u.username, COUNT(*) AS count FROM vote_events e JOIN users u ON u.id = e.user_id "
            "WHERE e.created_at >= ? GROUP BY u.id HAVING COUNT(*) >= 20 ORDER BY count DESC LIMIT 20", (now - 600,),
        ):
            alerts.append({**dict(row), "kind": "vote_burst", "detail": "20+ vote actions / 10 min", "window_seconds": 600})
        return alerts
