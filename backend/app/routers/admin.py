from fastapi import APIRouter, HTTPException, Depends

from app.database import db
from app.security import require_role
from app.utils import now_iso
from app.notify import notify
from app.models.product import RejectIn

router = APIRouter(tags=["admin"])


@router.get("/admin/products/pending")
async def pending_products(user=Depends(require_role("admin"))):
    items = await db.products.find({"status": "pending"}, {"_id": 0}).sort("created_at", -1).to_list(200)
    for p in items:
        s = await db.users.find_one({"id": p.get("seller_id")}, {"_id": 0, "password": 0})
        p["seller_name"] = s["name"] if s else "Unknown"
    return items


@router.post("/admin/products/{pid}/approve")
async def approve_product(pid: str, user=Depends(require_role("admin"))):
    p = await db.products.find_one({"id": pid}, {"_id": 0})
    if not p:
        raise HTTPException(404, "Not found")
    await db.products.update_one(
        {"id": pid},
        {"$set": {"status": "approved", "rejection_reason": None, "updated_at": now_iso()}},
    )
    await notify(
        p.get("seller_id"),
        "product_approved",
        "Your listing is live",
        f"'{p.get('title', '')}' has been approved.",
        {"product_id": pid},
    )
    return {"ok": True}


@router.post("/admin/products/{pid}/reject")
async def reject_product(pid: str, body: RejectIn, user=Depends(require_role("admin"))):
    p = await db.products.find_one({"id": pid}, {"_id": 0})
    if not p:
        raise HTTPException(404, "Not found")
    await db.products.update_one(
        {"id": pid},
        {"$set": {"status": "rejected", "rejection_reason": body.reason, "updated_at": now_iso()}},
    )
    await notify(
        p.get("seller_id"),
        "product_rejected",
        "Listing needs changes",
        f"'{p.get('title', '')}' was rejected. Reason: {body.reason}",
        {"product_id": pid, "reason": body.reason},
    )
    return {"ok": True}


@router.get("/admin/stats")
async def admin_stats(user=Depends(require_role("admin"))):
    return {
        "products_total": await db.products.count_documents({}),
        "products_pending": await db.products.count_documents({"status": "pending"}),
        "products_approved": await db.products.count_documents({"status": "approved"}),
        "products_rejected": await db.products.count_documents({"status": "rejected"}),
        "sellers": await db.users.count_documents({"role": "seller"}),
        "customers": await db.users.count_documents({"role": "customer"}),
        "orders": await db.orders.count_documents({}),
    }
