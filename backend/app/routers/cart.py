import uuid

from fastapi import APIRouter, Depends

from app.database import db
from app.security import require_role
from app.utils import now_iso
from app.models.cart import CartIn

router = APIRouter(tags=["cart"])


@router.get("/cart")
async def get_cart(user=Depends(require_role("customer"))):
    items = await db.cart.find({"user_id": user["id"]}, {"_id": 0}).to_list(200)
    # Enrich with product info
    out = []
    for it in items:
        p = await db.products.find_one({"id": it["product_id"]}, {"_id": 0})
        if p:
            out.append({**it, "product": p})
    return out


@router.post("/cart")
async def add_to_cart(body: CartIn, user=Depends(require_role("customer"))):
    existing = await db.cart.find_one({"user_id": user["id"], "product_id": body.product_id})
    if existing:
        await db.cart.update_one(
            {"user_id": user["id"], "product_id": body.product_id},
            {"$inc": {"qty": body.qty}},
        )
    else:
        await db.cart.insert_one({
            "id": str(uuid.uuid4()),
            "user_id": user["id"],
            "product_id": body.product_id,
            "qty": body.qty,
            "created_at": now_iso(),
        })
    return {"ok": True}


@router.delete("/cart/{product_id}")
async def remove_from_cart(product_id: str, user=Depends(require_role("customer"))):
    await db.cart.delete_one({"user_id": user["id"], "product_id": product_id})
    return {"ok": True}
