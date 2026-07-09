import uuid

from fastapi import APIRouter, Depends

from app.database import db
from app.security import require_role
from app.utils import now_iso
from app.models.review import ReviewIn

router = APIRouter(tags=["reviews"])


@router.get("/products/{pid}/reviews")
async def product_reviews(pid: str):
    items = await db.reviews.find({"product_id": pid}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return items


@router.post("/reviews")
async def add_review(body: ReviewIn, user=Depends(require_role("customer"))):
    verified_purchase = False
    if body.order_id:
        o = await db.orders.find_one({"id": body.order_id, "user_id": user["id"], "status": "delivered"}, {"_id": 0})
        if o and any(it.get("product_id") == body.product_id for it in o.get("items", [])):
            verified_purchase = True
    review = {
        "id": str(uuid.uuid4()),
        "product_id": body.product_id,
        "user_id": user["id"],
        "user_name": user["name"],
        "rating": body.rating,
        "comment": body.comment,
        "order_id": body.order_id,
        "verified_purchase": verified_purchase,
        "created_at": now_iso(),
    }
    await db.reviews.insert_one(review)
    reviews = await db.reviews.find({"product_id": body.product_id}, {"_id": 0, "rating": 1}).to_list(1000)
    avg = sum(r["rating"] for r in reviews) / len(reviews)
    await db.products.update_one(
        {"id": body.product_id},
        {"$set": {"rating": round(avg, 1), "review_count": len(reviews)}},
    )
    review.pop("_id", None)
    return review
