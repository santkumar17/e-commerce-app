import uuid
import logging

from app.database import db
from app.utils import now_iso

log = logging.getLogger("artisan")


async def notify(user_id: str, type_: str, title: str, body: str, meta: dict | None = None):
    """Fire-and-forget in-app notification."""
    if not user_id:
        return
    doc = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "type": type_,
        "title": title,
        "body": body,
        "meta": meta or {},
        "read": False,
        "created_at": now_iso(),
    }
    try:
        await db.notifications.insert_one(doc)
    except Exception:
        log.exception("notify failed")
