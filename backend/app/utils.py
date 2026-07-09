from datetime import datetime, timezone


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def clean_product(p: dict) -> dict:
    p.pop("_id", None)
    return p
