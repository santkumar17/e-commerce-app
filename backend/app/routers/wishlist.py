import uuid

from fastapi import APIRouter, Depends

from app.database import db
from app.security import require_role
from app.utils import now_iso

router = APIRouter(tags=["wishlist"])


@router.get("/wishlist")
async def get_wishlist(user=Depends(require_role("customer"))):
    items = await db.wishlist.find({"user_id": user["id"]}, {"_id": 0}).to_list(200)
    out = []
    for it in items:
        p = await db.products.find_one({"id": it["product_id"]}, {"_id": 0})
        if p:
            out.append(p)
    return out


@router.post("/wishlist/{product_id}")
async def add_wishlist(product_id: str, user=Depends(require_role("customer"))):
    if await db.wishlist.find_one({"user_id": user["id"], "product_id": product_id}):
        return {"ok": True}
    await db.wishlist.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "product_id": product_id,
        "created_at": now_iso(),
    })
    return {"ok": True}


@router.delete("/wishlist/{product_id}")
async def remove_wishlist(product_id: str, user=Depends(require_role("customer"))):
    await db.wishlist.delete_one({"user_id": user["id"], "product_id": product_id})
    return {"ok": True}
