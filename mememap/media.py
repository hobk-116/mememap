"""Static image validation, encoding, and upload storage."""
from __future__ import annotations
import base64
import re
import secrets
import shutil
import subprocess
import tempfile
from pathlib import Path
from .config import MAX_IMAGE_BYTES

UPLOAD_RE = re.compile(r"^/uploads/(memes|profiles)/([0-9a-f]{32})\.(webp|gif|png|jpeg)$")

def webp_dimensions(image_bytes: bytes) -> tuple[int, int] | None:
    """Read dimensions from common static WebP chunks without extra dependencies."""
    if len(image_bytes) < 20 or image_bytes[:4] != b"RIFF" or image_bytes[8:12] != b"WEBP":
        return None
    offset = 12
    while offset + 8 <= len(image_bytes):
        chunk_type = image_bytes[offset:offset + 4]
        chunk_size = int.from_bytes(image_bytes[offset + 4:offset + 8], "little")
        data_start = offset + 8
        data_end = data_start + chunk_size
        if data_end > len(image_bytes):
            return None
        chunk = image_bytes[data_start:data_end]
        if chunk_type == b"VP8X" and len(chunk) >= 10:
            return (1 + int.from_bytes(chunk[4:7], "little"), 1 + int.from_bytes(chunk[7:10], "little"))
        if chunk_type == b"VP8L" and len(chunk) >= 5 and chunk[0] == 0x2F:
            width = 1 + chunk[1] + ((chunk[2] & 0x3F) << 8)
            height = 1 + (chunk[2] >> 6) + (chunk[3] << 2) + ((chunk[4] & 0x0F) << 10)
            return width, height
        if chunk_type == b"VP8 " and len(chunk) >= 10 and chunk[3:6] == b"\x9d\x01\x2a":
            width = int.from_bytes(chunk[6:8], "little") & 0x3FFF
            height = int.from_bytes(chunk[8:10], "little") & 0x3FFF
            return width, height
        offset = data_end + (chunk_size & 1)
    return None

def encode_webp(image_bytes: bytes, source_extension: str, quality: int = 82) -> bytes:
    """Convert a browser fallback PNG/JPEG to WebP using cwebp on the server."""
    if source_extension == "webp":
        return image_bytes
    encoder = shutil.which("cwebp")
    if not encoder:
        raise RuntimeError("webp_encoder_unavailable")
    with tempfile.TemporaryDirectory(prefix="mememap-webp-") as temp_dir:
        source = Path(temp_dir) / f"source.{source_extension}"
        destination = Path(temp_dir) / "converted.webp"
        source.write_bytes(image_bytes)
        result = subprocess.run(
            [encoder, "-quiet", "-q", str(quality), str(source), "-o", str(destination)],
            capture_output=True,
            timeout=30,
            check=False,
        )
        if result.returncode != 0 or not destination.is_file():
            raise RuntimeError("webp_conversion_failed")
        return destination.read_bytes()

class InvalidImage(ValueError):
    """An image rejected by the existing upload contract."""

def image_is_animated(image_bytes: bytes, extension: str) -> bool:
    if extension == "webp":
        offset = 12
        while offset + 8 <= len(image_bytes):
            kind = image_bytes[offset:offset + 4]
            length = int.from_bytes(image_bytes[offset + 4:offset + 8], "little")
            if kind in (b"ANIM", b"ANMF"):
                return True
            if kind == b"VP8X" and length and offset + 8 < len(image_bytes) and image_bytes[offset + 8] & 2:
                return True
            offset += 8 + length + (length & 1)
    elif extension == "png":
        offset = 8
        while offset + 8 <= len(image_bytes):
            length = int.from_bytes(image_bytes[offset:offset + 4], "big")
            if image_bytes[offset + 4:offset + 8] == b"acTL":
                return True
            offset += 12 + length
    return False

def decode_upload(image_data, invalid_error: str, size_error: str, max_edge: int | None = None) -> bytes:
    """Validate both upload kinds in one place, then normalize to static WebP."""
    if not isinstance(image_data, str) or len(image_data) > 14 * 1024 * 1024 or not re.fullmatch(
        r"data:image/(?:png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}", image_data
    ):
        raise InvalidImage(invalid_error)
    try:
        mime = image_data[5:image_data.index(";")]
        extension = {"image/png": "png", "image/jpeg": "jpeg", "image/webp": "webp"}[mime]
        image_bytes = base64.b64decode(image_data.split(",", 1)[1], validate=True)
    except (ValueError, KeyError, base64.binascii.Error) as error:
        raise InvalidImage(invalid_error) from error
    if len(image_bytes) > MAX_IMAGE_BYTES:
        raise InvalidImage(size_error)
    valid_signature = {
        "png": image_bytes.startswith(b"\x89PNG\r\n\x1a\n"),
        "jpeg": image_bytes.startswith(b"\xff\xd8\xff"),
        "webp": len(image_bytes) >= 12 and image_bytes[:4] == b"RIFF" and image_bytes[8:12] == b"WEBP",
    }[extension]
    if not image_bytes or not valid_signature or image_is_animated(image_bytes, extension):
        raise InvalidImage(invalid_error)
    converted = encode_webp(image_bytes, extension)
    dimensions = webp_dimensions(converted)
    if not dimensions or (max_edge and max(dimensions) > max_edge):
        raise InvalidImage(invalid_error)
    return converted

class ImageStorage:
    def __init__(self, settings):
        self.root = settings.uploads_path
        self.memes = settings.meme_uploads_path
        self.profiles = settings.profile_uploads_path

    def path(self, url):
        match = UPLOAD_RE.fullmatch(url or "")
        if not match:
            return None
        folder, name, extension = match.groups()
        return (self.memes if folder == "memes" else self.profiles) / f"{name}.{extension}"

    def save(self, folder, content):
        if folder not in ("memes", "profiles"):
            raise ValueError("Unknown upload folder")
        directory = self.memes if folder == "memes" else self.profiles
        directory.mkdir(parents=True, exist_ok=True)
        filename = f"{secrets.token_hex(16)}.webp"
        path = directory / filename
        try:
            path.write_bytes(content)
        except OSError:
            path.unlink(missing_ok=True)
            raise
        return f"/uploads/{folder}/{filename}", path

    def migrate_legacy(self, db):
        # Copy before the DB commit, then remove old files after a successful migration.
        # Retaining originals on rollback makes an interrupted migration retryable.
        obsolete = []
        self.memes.mkdir(parents=True, exist_ok=True)
        self.profiles.mkdir(parents=True, exist_ok=True)
        for table, column, folder in (("pins", "image_data", "memes"), ("users", "avatar_path", "profiles")):
            directory = self.memes if folder == "memes" else self.profiles
            rows = db.execute(f"SELECT id, {column} AS url FROM {table} WHERE {column} LIKE '/uploads/%'").fetchall()
            for row in rows:
                match = re.fullmatch(r"/uploads/([0-9a-f]{32})\.(webp|gif|png|jpeg)", row["url"] or "")
                if not match:
                    continue
                name = f"{match[1]}.{match[2]}"
                source, destination = self.root / name, directory / name
                if source.exists():
                    if destination.exists() and source.read_bytes() != destination.read_bytes():
                        raise RuntimeError(f"Conflicting legacy image: {name}")
                    if not destination.exists():
                        temporary = directory / (name + ".migrating")
                        try:
                            shutil.copyfile(source, temporary)
                            temporary.replace(destination)
                        finally:
                            temporary.unlink(missing_ok=True)
                    obsolete.append(source)
                db.execute(f"UPDATE {table} SET {column} = ? WHERE id = ?",
                           (f"/uploads/{folder}/{name}", row["id"]))
        return obsolete
