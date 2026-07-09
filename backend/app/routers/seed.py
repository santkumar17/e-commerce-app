import uuid

from fastapi import APIRouter

from app.database import db
from app.security import hash_password
from app.utils import now_iso
from app.seed_data import DEFAULT_CATEGORIES, SEED_PRODUCTS

router = APIRouter(tags=["seed"])


@router.post("/seed")
async def seed():
    """Idempotent seed for demo data."""
    # Demo users
    users = [
        {"name": "Ada Admin", "email": "admin@artisan.market", "password": "Admin123!", "role": "admin"},
        {"name": "Maya Maker", "email": "seller@artisan.market", "password": "Seller123!", "role": "seller"},
        {"name": "Carlos Customer", "email": "customer@artisan.market", "password": "Customer123!", "role": "customer"},
    ]
    seller_id = None
    for u in users:
        existing = await db.users.find_one({"email": u["email"]})
        if existing:
            if u["role"] == "seller":
                seller_id = existing["id"]
                # ensure demo seller is verified for badge demo
                if not existing.get("verified"):
                    await db.users.update_one({"id": existing["id"]}, {"$set": {"verified": True, "bio": existing.get("bio") or "Working from a small studio in Jaipur — one piece at a time."}})
            continue
        uid = str(uuid.uuid4())
        await db.users.insert_one({
            "id": uid,
            "name": u["name"],
            "email": u["email"],
            "password": hash_password(u["password"]),
            "role": u["role"],
            "verified": u["role"] == "seller",  # auto-verify demo seller
            "bio": "Working from a small studio in Jaipur — one piece at a time." if u["role"] == "seller" else "",
            "created_at": now_iso(),
        })
        if u["role"] == "seller":
            seller_id = uid

    # Seed products (approved for demo)
    for p in SEED_PRODUCTS:
        existing = await db.products.find_one({"title": p["title"]})
        if existing:
            # keep everything, but refresh images (idempotent upgrade for gallery demo)
            if existing.get("images") != p["images"]:
                await db.products.update_one({"id": existing["id"]}, {"$set": {"images": p["images"]}})
            continue
        doc = {
            **p,
            "id": str(uuid.uuid4()),
            "seller_id": seller_id,
            "status": "approved",
            "rating": 4.7,
            "review_count": 12,
            "rejection_reason": None,
            "created_at": now_iso(),
            "updated_at": now_iso(),
        }
        await db.products.insert_one(doc)

    # One pending example for admin queue
    pending_title = "Wax-batik Cotton Napkins (set of 4)"
    if not await db.products.find_one({"title": pending_title}):
        await db.products.insert_one({
            "id": str(uuid.uuid4()),
            "seller_id": seller_id,
            "title": pending_title,
            "description": "Set of four cotton napkins hand-dyed using a wax-resist batik technique.",
            "price": 48.0,
            "category": "textiles",
            "stock": 8,
            "materials": "Cotton, natural indigo",
            "dimensions": "40cm × 40cm each",
            "shipping_days": 9,
            "images": ["https://images.unsplash.com/photo-1620812097822-d5f7f5c94eb1?w=800"],
            "tags": ["napkins", "batik", "cotton"],
            "status": "pending",
            "rating": 0,
            "review_count": 0,
            "rejection_reason": None,
            "created_at": now_iso(),
            "updated_at": now_iso(),
        })

    # Seed demo coupons
    for c in [
        {"code": "WELCOME10", "discount_type": "percent", "value": 10.0, "min_order": 0.0, "active": True},
        {"code": "ARTISAN5", "discount_type": "flat", "value": 5.0, "min_order": 30.0, "active": True},
    ]:
        if not await db.coupons.find_one({"code": c["code"]}):
            await db.coupons.insert_one({**c, "id": str(uuid.uuid4()), "created_at": now_iso()})

    return {"ok": True, "categories": len(DEFAULT_CATEGORIES)}
