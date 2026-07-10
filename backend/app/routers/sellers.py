from fastapi import APIRouter, HTTPException, Depends, Query

from app.database import db
from app.security import require_role
from app.notify import notify

router = APIRouter(tags=["sellers"])


@router.get("/sellers/{sid}")
async def public_seller(sid: str):
    s = await db.users.find_one(
        {"id": sid, "role": "seller"},
        {"_id": 0, "password": 0, "email": 0, "phone": 0, "address": 0},
    )
    if not s:
        raise HTTPException(404, "Not found")
    products = await db.products.find(
        {"seller_id": sid, "status": "approved"}, {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    return {"seller": s, "products": products, "products_count": len(products)}


@router.get("/admin/sellers")
async def admin_list_sellers(user=Depends(require_role("admin"))):
    items = await db.users.find({"role": "seller"}, {"_id": 0, "password": 0}).to_list(500)
    for s in items:
        s["products_count"] = await db.products.count_documents({"seller_id": s["id"]})
    return items


@router.post("/admin/sellers/{sid}/verify")
async def admin_verify_seller(sid: str, verified: bool = Query(True), user=Depends(require_role("admin"))):
    r = await db.users.update_one({"id": sid, "role": "seller"}, {"$set": {"verified": verified}})
    if not r.matched_count:
        raise HTTPException(404, "Not found")
    await notify(
        sid,
        "seller_verified" if verified else "seller_unverified",
        "You're verified" if verified else "Verification removed",
        "A verified badge now appears on your listings." if verified else "Please contact support.",
        {},
    )
    return {"ok": True, "verified": verified}
