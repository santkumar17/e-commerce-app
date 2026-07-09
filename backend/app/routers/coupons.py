import uuid

from fastapi import APIRouter, HTTPException, Depends

from app.database import db
from app.security import require_role
from app.utils import now_iso
from app.models.coupon import CouponIn, ValidateCouponIn

router = APIRouter(tags=["coupons"])


@router.get("/admin/coupons")
async def list_coupons(user=Depends(require_role("admin"))):
    return await db.coupons.find({}, {"_id": 0}).sort("created_at", -1).to_list(200)


@router.post("/admin/coupons")
async def create_coupon(body: CouponIn, user=Depends(require_role("admin"))):
    code = body.code.strip().upper()
    if not code:
        raise HTTPException(400, "Code required")
    if await db.coupons.find_one({"code": code}):
        raise HTTPException(400, "Coupon code already exists")
    doc = {
        "id": str(uuid.uuid4()),
        "code": code,
        "discount_type": body.discount_type,
        "value": body.value,
        "min_order": body.min_order,
        "active": body.active,
        "created_at": now_iso(),
    }
    await db.coupons.insert_one(doc)
    doc.pop("_id", None)
    return doc


@router.delete("/admin/coupons/{code}")
async def delete_coupon(code: str, user=Depends(require_role("admin"))):
    await db.coupons.delete_one({"code": code.upper()})
    return {"ok": True}


@router.post("/coupons/validate")
async def validate_coupon(body: ValidateCouponIn, user=Depends(require_role("customer"))):
    c = await db.coupons.find_one({"code": body.code.strip().upper(), "active": True}, {"_id": 0})
    if not c:
        raise HTTPException(404, "Invalid or inactive coupon")
    if body.subtotal < c.get("min_order", 0):
        raise HTTPException(400, f"Requires ${c['min_order']:.0f} minimum")
    if c["discount_type"] == "percent":
        discount = round(body.subtotal * c["value"] / 100.0, 2)
    else:
        discount = min(body.subtotal, float(c["value"]))
    return {"code": c["code"], "discount": discount, "discount_type": c["discount_type"], "value": c["value"]}
