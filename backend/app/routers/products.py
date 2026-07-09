import uuid
from typing import Optional

from fastapi import APIRouter, HTTPException, Depends

from app.database import db
from app.security import require_role
from app.utils import now_iso, clean_product
from app.models.product import ProductIn

router = APIRouter(tags=["products"])


@router.get("/products")
async def list_products(
    category: Optional[str] = None,
    q: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    sort: Optional[str] = None,
    limit: int = 50,
):
    query: dict = {"status": "approved"}
    if category:
        query["category"] = category
    if q:
        query["$or"] = [
            {"title": {"$regex": q, "$options": "i"}},
            {"description": {"$regex": q, "$options": "i"}},
            {"tags": {"$regex": q, "$options": "i"}},
        ]
    if min_price is not None or max_price is not None:
        pr = {}
        if min_price is not None:
            pr["$gte"] = min_price
        if max_price is not None:
            pr["$lte"] = max_price
        query["price"] = pr
    cursor = db.products.find(query, {"_id": 0}).limit(limit)
    if sort == "price_asc":
        cursor = cursor.sort("price", 1)
    elif sort == "price_desc":
        cursor = cursor.sort("price", -1)
    else:
        cursor = cursor.sort("created_at", -1)
    return await cursor.to_list(limit)


@router.get("/products/featured")
async def featured():
    items = await db.products.find({"status": "approved"}, {"_id": 0}).sort("created_at", -1).limit(6).to_list(6)
    return items


@router.get("/products/{pid}")
async def get_product(pid: str):
    p = await db.products.find_one({"id": pid}, {"_id": 0})
    if not p:
        raise HTTPException(404, "Not found")
    seller = await db.users.find_one({"id": p.get("seller_id")}, {"_id": 0, "password": 0})
    p["seller_name"] = seller["name"] if seller else "Unknown Artisan"
    p["seller_verified"] = bool(seller.get("verified")) if seller else False
    return p


@router.post("/products")
async def create_product(body: ProductIn, user=Depends(require_role("seller", "admin"))):
    pdata = body.model_dump()
    # sellers can save as draft; anything else goes to pending
    status = "draft" if pdata.get("status") == "draft" else "pending"
    pdata.update({
        "id": str(uuid.uuid4()),
        "seller_id": user["id"],
        "status": status,
        "rating": 0.0,
        "review_count": 0,
        "rejection_reason": None,
        "created_at": now_iso(),
        "updated_at": now_iso(),
    })
    await db.products.insert_one(pdata)
    return clean_product(pdata)


@router.put("/products/{pid}")
async def update_product(pid: str, body: ProductIn, user=Depends(require_role("seller", "admin"))):
    p = await db.products.find_one({"id": pid})
    if not p:
        raise HTTPException(404, "Not found")
    if user["role"] != "admin" and p["seller_id"] != user["id"]:
        raise HTTPException(403, "Not your product")
    update = body.model_dump()
    # if seller explicitly asked to keep as draft, honor it; else back to pending on edit
    update["status"] = "draft" if update.get("status") == "draft" else "pending"
    update["updated_at"] = now_iso()
    update["rejection_reason"] = None
    await db.products.update_one({"id": pid}, {"$set": update})
    doc = await db.products.find_one({"id": pid}, {"_id": 0})
    return doc


@router.delete("/products/{pid}")
async def delete_product(pid: str, user=Depends(require_role("seller", "admin"))):
    p = await db.products.find_one({"id": pid})
    if not p:
        raise HTTPException(404, "Not found")
    if user["role"] != "admin" and p["seller_id"] != user["id"]:
        raise HTTPException(403, "Not your product")
    await db.products.delete_one({"id": pid})
    return {"ok": True}


@router.get("/seller/products")
async def seller_products(user=Depends(require_role("seller"))):
    items = await db.products.find({"seller_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return items
