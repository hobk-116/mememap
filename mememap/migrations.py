"""Ordered migrations; schema changes and version records commit together."""
import re
import sqlite3
import time
from .config import USERNAME_RE
from .database import execute_script


def accounts_and_pins(db):
    execute_script(db,
        """
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE COLLATE NOCASE,
            username TEXT,
            avatar_path TEXT,
            is_admin INTEGER NOT NULL DEFAULT 0,
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
    if "avatar_path" not in columns:
        db.execute("ALTER TABLE users ADD COLUMN avatar_path TEXT")
    if "is_admin" not in columns:
        db.execute("ALTER TABLE users ADD COLUMN is_admin INTEGER NOT NULL DEFAULT 0")
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
    # Existing accounts with the legacy default keep using the PNG asset. New accounts use the WebP asset.
    db.execute("UPDATE users SET avatar_path = ? WHERE avatar_path IS NULL OR avatar_path = ''", ("/assets/default-profile-picture.png",))


def moderation_schema(db: sqlite3.Connection) -> None:
    """Extend existing databases without discarding accounts, pins or votes."""
    additions = {
        "pins": {
            "is_hidden": "INTEGER NOT NULL DEFAULT 0",
            "hidden_reason": "TEXT NOT NULL DEFAULT ''",
            "hidden_at": "INTEGER",
        },
        "users": {
            "post_restricted_until": "INTEGER",
            "post_restriction_reason": "TEXT NOT NULL DEFAULT ''",
            "vote_restricted_until": "INTEGER",
            "vote_restriction_reason": "TEXT NOT NULL DEFAULT ''",
        },
        "pin_votes": {"updated_at": "INTEGER NOT NULL DEFAULT 0"},
    }
    for table, columns in additions.items():
        present = {row["name"] for row in db.execute(f"PRAGMA table_info({table})")}
        for name, declaration in columns.items():
            if name not in present:
                db.execute(f"ALTER TABLE {table} ADD COLUMN {name} {declaration}")
    execute_script(db, """
        CREATE TABLE IF NOT EXISTS pin_reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            pin_id INTEGER NOT NULL,
            reporter_id INTEGER NOT NULL,
            reporter_username TEXT NOT NULL,
            pin_title TEXT NOT NULL,
            pin_username TEXT NOT NULL,
            reason TEXT NOT NULL,
            detail TEXT NOT NULL DEFAULT '',
            status TEXT NOT NULL DEFAULT 'pending'
                CHECK(status IN ('pending', 'reviewing', 'resolved')),
            created_at INTEGER NOT NULL,
            resolved_at INTEGER,
            resolved_by TEXT,
            resolution TEXT,
            resolution_reason TEXT NOT NULL DEFAULT ''
        );
        CREATE UNIQUE INDEX IF NOT EXISTS pin_reports_one_open
            ON pin_reports(pin_id, reporter_id) WHERE status IN ('pending', 'reviewing');
        CREATE INDEX IF NOT EXISTS pin_reports_status ON pin_reports(status, created_at DESC);
        CREATE INDEX IF NOT EXISTS pin_reports_reporter ON pin_reports(reporter_id, created_at);
        CREATE TABLE IF NOT EXISTS admin_audit (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            actor_id INTEGER NOT NULL,
            actor_username TEXT NOT NULL,
            action TEXT NOT NULL,
            target_type TEXT NOT NULL,
            target_id INTEGER NOT NULL,
            target_label TEXT NOT NULL,
            reason TEXT NOT NULL DEFAULT '',
            created_at INTEGER NOT NULL
        );
        CREATE INDEX IF NOT EXISTS admin_audit_target
            ON admin_audit(target_type, target_id, created_at DESC);
        CREATE TRIGGER IF NOT EXISTS admin_audit_no_update
            BEFORE UPDATE ON admin_audit BEGIN SELECT RAISE(ABORT, 'audit_is_immutable'); END;
        CREATE TRIGGER IF NOT EXISTS admin_audit_no_delete
            BEFORE DELETE ON admin_audit BEGIN SELECT RAISE(ABORT, 'audit_is_immutable'); END;
        CREATE TABLE IF NOT EXISTS vote_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            pin_id INTEGER NOT NULL,
            created_at INTEGER NOT NULL
        );
        CREATE INDEX IF NOT EXISTS vote_events_recent ON vote_events(created_at, user_id);
    """)


MIGRATIONS = ((1, "accounts_and_pins", accounts_and_pins),
              (2, "moderation", moderation_schema),
              (3, "upload_folders", None))


def migrate(database, images):
    database.path.parent.mkdir(parents=True, exist_ok=True)
    obsolete = []
    with database.connect() as db:
        db.execute("PRAGMA journal_mode = WAL")
        db.execute("BEGIN IMMEDIATE")
        db.execute("CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY, name TEXT NOT NULL, applied_at INTEGER NOT NULL)")
        applied = {row["version"] for row in db.execute("SELECT version FROM schema_migrations")}
        if applied - {version for version, _, _ in MIGRATIONS}:
            raise RuntimeError("Database schema is newer than this application")
        for version, name, operation in MIGRATIONS:
            if version in applied:
                continue
            if operation:
                operation(db)
            else:
                obsolete = images.migrate_legacy(db)
            db.execute("INSERT INTO schema_migrations VALUES (?, ?, ?)", (version, name, int(time.time())))
    for path in set(obsolete):
        try:
            path.unlink(missing_ok=True)
        except OSError:
            # A harmless leftover must not prevent a committed application from starting.
            pass
