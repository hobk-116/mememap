"""Runtime paths and limits. Each application owns its settings."""
from dataclasses import dataclass
from pathlib import Path
import os
import re

SESSION_SECONDS = 30 * 24 * 60 * 60
PBKDF2_ROUNDS = 310_000
USERNAME_RE = re.compile(r"^[A-Za-z0-9](?:[A-Za-z0-9._]{1,22}[A-Za-z0-9])?$")
MAX_IMAGE_BYTES = 10 * 1024 * 1024
MAX_JSON_BYTES = 15 * 1024 * 1024


@dataclass(frozen=True)
class Settings:
    root: Path
    db_path: Path
    uploads_path: Path
    host: str = "0.0.0.0"
    port: int = 8000
    secure_cookie: bool = False

    @property
    def meme_uploads_path(self):
        return self.uploads_path / "memes"

    @property
    def profile_uploads_path(self):
        return self.uploads_path / "profiles"

    @classmethod
    def from_env(cls, root):
        root = Path(root).resolve()
        # Relative configured paths are resolved against the project, not the caller's cwd.
        def path(name, default):
            value = Path(os.environ.get(name, default)).expanduser()
            return value if value.is_absolute() else root / value
        return cls(root, path("MEMEMAP_DB_PATH", "mememap.sqlite3"),
                   path("MEMEMAP_UPLOADS_PATH", "uploads"),
                   os.environ.get("MEMEMAP_HOST", "0.0.0.0"),
                   int(os.environ.get("MEMEMAP_PORT", "8000")),
                   os.environ.get("MEMEMAP_SECURE_COOKIE", "0") == "1")
