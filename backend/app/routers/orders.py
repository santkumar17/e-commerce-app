import uuid
from typing import Optional

from fastapi import APIRouter, HTTPException, Depends, Query

from app.database import db
from app.security import require_role, get_current_user
from app.utils import now_iso
from app.notify import notify
from app.models.order import CheckoutIn

router = APIRouter(tags=["orders"])


@router.post("/orders/checkout")
async def checkout(body: CheckoutIn, user=Depends(require_role("customer"))):
    cart_items = await db.cart.find({"user_id": user["id"]}, {"_id": 0}).to_list(200)
    if not cart_items:
        raise HTTPException(400, "Cart is empty")
    order_items = []
    subtotal = 0.0
    for it in cart_items:
        p = await db.products.find_one({"id": it["product_id"]}, {"_id": 0})
        if not p:
            continue
        line = {
            "product_id": p["id"],
            "title": p["title"],
            "image": p["images"][0] if p.get("images") else "",
            "price": p["price"],
            "qty": it["qty"],
            "seller_id": p.get("seller_id"),
        }
        subtotal += p["price"] * it["qty"]
        order_items.append(line)

    discount = 0.0
    coupon_code: Optional[str] = None
    if body.coupon_code:
        c = await db.coupons.find_one({"code": body.coupon_code.strip().upper(), "active": True}, {"_id": 0})
        if not c:
            raise HTTPException(400, "Invalid coupon")
        if subtotal < c.get("min_order", 0):
            raise HTTPException(400, f"Coupon requires ${c['min_order']:.0f} minimum")
        if c["discount_type"] == "percent":
            discount = round(subtotal * c["value"] / 100.0, 2)
        else:
            discount = min(subtotal, float(c["value"]))
        coupon_code = c["code"]

    total = max(0.0, round(subtotal - discount, 2))
    order = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "items": order_items,
        "subtotal": round(subtotal, 2),
        "discount": discount,
        "coupon_code": coupon_code,
        "total": total,
        "address": body.address.model_dump(),
        "payment_method": body.payment_method,
        "status": "placed",
        "created_at": now_iso(),
    }
    await db.orders.insert_one(order)
    await db.cart.delete_many({"user_id": user["id"]})

    # notify each seller of the new order
    for sid in {li.get("seller_id") for li in order_items if li.get("seller_id")}:
        await notify(sid, "new_order", "New order received", f"Order #{order['id'][:8]} · ${total:.2f}", {"order_id": order["id"]})

    order.pop("_id", None)
    return order


@router.get("/orders")
async def my_orders(user=Depends(get_current_user)):
    if user["role"] == "customer":
        items = await db.orders.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(200)
    elif user["role"] == "seller":
        items = await db.orders.find({"items.seller_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(200)
    else:
        items = await db.orders.find({}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return items


@router.post("/orders/{oid}/status")
async def update_order_status(oid: str, status: str = Query(...), user=Depends(get_current_user)):
    if status not in ("placed", "shipped", "delivered", "cancelled"):
        raise HTTPException(400, "bad status")
    o = await db.orders.find_one({"id": oid})
    if not o:
        raise HTTPException(404, "Not found")
    # customer can only cancel their own; sellers/admin can update
    if user["role"] == "customer":
        if o["user_id"] != user["id"] or status != "cancelled":
            raise HTTPException(403, "Forbidden")
    await db.orders.update_one({"id": oid}, {"$set": {"status": status, "updated_at": now_iso()}})
    if user["role"] != "customer":
        await notify(
            o.get("user_id"),
            "order_status",
            f"Order #{oid[:8]} {status}",
            "Track your order in the Orders tab.",
            {"order_id": oid, "status": status},
        )
    return {"ok": True}
