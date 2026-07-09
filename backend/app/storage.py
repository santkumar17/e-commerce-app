"""Product image storage backends.

`LocalDiskStorage` is the only implementation today. A future `S3Storage`
class implementing the same `save(data, content_type) -> url` signature
can be swapped in via the `STORAGE_BACKEND` env var without touching callers.
"""
import io
import uuid
from pathlib import Path

from fastapi import HTTPException
from PIL import Image

from app.config import UPLOAD_DIR, BACKEND_BASE_URL

ALLOWED_CONTENT_TYPES = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
}
MAX_IMAGE_BYTES = 5 * 1024 * 1024  # 5MB


class LocalDiskStorage:
    def __init__(self, upload_dir: Path, base_url: str):
        self.upload_dir = upload_dir
        self.base_url = base_url.rstrip("/")
        self.upload_dir.mkdir(parents=True, exist_ok=True)

    async def save(self, data: bytes, content_type: str) -> str:
        if content_type not in ALLOWED_CONTENT_TYPES:
            raise HTTPException(400, "Unsupported image type; use JPEG, PNG, or WebP")
        if len(data) > MAX_IMAGE_BYTES:
            raise HTTPException(400, "Image exceeds 5MB limit")
        try:
            Image.open(io.BytesIO(data)).verify()
        except Exception:
            raise HTTPException(400, "File is not a valid image")

        ext = ALLOWED_CONTENT_TYPES[content_type]
        filename = f"{uuid.uuid4()}.{ext}"
        (self.upload_dir / filename).write_bytes(data)
        return f"{self.base_url}/uploads/{filename}"


storage = LocalDiskStorage(upload_dir=Path(UPLOAD_DIR), base_url=BACKEND_BASE_URL)
