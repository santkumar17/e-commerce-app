"""ArtisanMarket - Handmade Marketplace Backend."""
import os
import uuid
import logging
from pathlib import Path
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Literal

import jwt
import bcrypt
from fastapi import FastAPI, APIRouter, HTTPException, Depends, Header, Query
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr

from emergentintegrations.llm.chat import LlmChat, UserMessage, TextDelta, StreamDone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]
JWT_SECRET = os.environ["JWT_SECRET"]
EMERGENT_LLM_KEY = os.environ["EMERGENT_LLM_KEY"]

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

app = FastAPI(title="ArtisanMarket API")
api = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("artisan")


# ---------- Utilities ----------
def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()


def verify_password(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode(), hashed.encode())
    except Exception:
        return False


def create_token(user_id: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(days=30),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")


async def get_current_user(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Missing token")
    token = authorization.split(" ", 1)[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
    except jwt.PyJWTError:
        raise HTTPException(401, "Invalid token")
    user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password": 0})
    if not user:
        raise HTTPException(401, "User not found")
    return user


def require_role(*roles):
    async def _dep(user=Depends(get_current_user)):
        if user["role"] not in roles:
            raise HTTPException(403, "Forbidden")
        return user
    return _dep


# ---------- Models ----------
Role = Literal["customer", "seller", "admin"]
ProductStatus = Literal["draft", "pending", "approved", "rejected"]
OrderStatus = Literal["placed", "shipped", "delivered", "cancelled"]


class RegisterIn(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: Role = "customer"


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class ProductIn(BaseModel):
    title: str
    description: str
    price: float
    category: str
    stock: int = 1
    materials: Optional[str] = None
    dimensions: Optional[str] = None
    shipping_days: int = 7
    images: List[str] = Field(default_factory=list)  # data URIs or URLs
    tags: List[str] = Field(default_factory=list)
    status: ProductStatus = "pending"


class RejectIn(BaseModel):
    reason: str


class CartIn(BaseModel):
    product_id: str
    qty: int = 1


class AddressIn(BaseModel):
    full_name: str
    phone: str
    line1: str
    city: str
    state: str
    zip: str


class CheckoutIn(BaseModel):
    address: AddressIn
    payment_method: Literal["cod"] = "cod"


class ReviewIn(BaseModel):
    product_id: str
    rating: int = Field(ge=1, le=5)
    comment: str = ""


class AIGenIn(BaseModel):
    title: str
    keywords: str = ""
    materials: str = ""


# ---------- Auth ----------
@api.post("/auth/register")
async def register(body: RegisterIn):
    if await db.users.find_one({"email": body.email.lower()}):
        raise HTTPException(400, "Email already registered")
    user = {
        "id": str(uuid.uuid4()),
        "name": body.name,
        "email": body.email.lower(),
        "password": hash_password(body.password),
        "role": body.role,
        "created_at": now_iso(),
    }
    await db.users.insert_one(user)
    token = create_token(user["id"], user["role"])
    return {
        "token": token,
        "user": {"id": user["id"], "name": user["name"], "email": user["email"], "role": user["role"]},
    }


@api.post("/auth/login")
async def login(body: LoginIn):
    user = await db.users.find_one({"email": body.email.lower()})
    if not user or not verify_password(body.password, user["password"]):
        raise HTTPException(401, "Invalid credentials")
    token = create_token(user["id"], user["role"])
    return {
        "token": token,
        "user": {"id": user["id"], "name": user["name"], "email": user["email"], "role": user["role"]},
    }


@api.get("/auth/me")
async def me(user=Depends(get_current_user)):
    return user


# ---------- Categories ----------
DEFAULT_CATEGORIES = [
    {"id": "ceramics", "name": "Pottery & Ceramics", "image": "https://images.unsplash.com/photo-1631125915902-d8abe9225ff2?w=400"},
    {"id": "textiles", "name": "Textiles & Weaving", "image": "https://images.unsplash.com/photo-1544736779-15c123c4c66f?w=400"},
    {"id": "jewelry", "name": "Jewelry", "image": "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=400"},
    {"id": "leather", "name": "Leather Goods", "image": "https://images.unsplash.com/photo-1628483211662-9bcc692c46dc?w=400"},
    {"id": "decor", "name": "Home Decor", "image": "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=400"},
    {"id": "art", "name": "Art & Prints", "image": "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=400"},
]


@api.get("/categories")
async def list_categories():
    return DEFAULT_CATEGORIES


# ---------- Products ----------
def clean_product(p: dict) -> dict:
    p.pop("_id", None)
    return p


@api.get("/products")
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


@api.get("/products/featured")
async def featured():
    items = await db.products.find({"status": "approved"}, {"_id": 0}).sort("created_at", -1).limit(6).to_list(6)
    return items


@api.get("/products/{pid}")
async def get_product(pid: str):
    p = await db.products.find_one({"id": pid}, {"_id": 0})
    if not p:
        raise HTTPException(404, "Not found")
    # Attach seller name
    seller = await db.users.find_one({"id": p.get("seller_id")}, {"_id": 0, "password": 0})
    p["seller_name"] = seller["name"] if seller else "Unknown Artisan"
    return p


@api.post("/products")
async def create_product(body: ProductIn, user=Depends(require_role("seller", "admin"))):
    pdata = body.model_dump()
    pdata.update({
        "id": str(uuid.uuid4()),
        "seller_id": user["id"],
        "status": "pending",
        "rating": 0.0,
        "review_count": 0,
        "rejection_reason": None,
        "created_at": now_iso(),
        "updated_at": now_iso(),
    })
    await db.products.insert_one(pdata)
    return clean_product(pdata)


@api.put("/products/{pid}")
async def update_product(pid: str, body: ProductIn, user=Depends(require_role("seller", "admin"))):
    p = await db.products.find_one({"id": pid})
    if not p:
        raise HTTPException(404, "Not found")
    if user["role"] != "admin" and p["seller_id"] != user["id"]:
        raise HTTPException(403, "Not your product")
    update = body.model_dump()
    update["updated_at"] = now_iso()
    update["status"] = "pending"  # resubmit for review
    update["rejection_reason"] = None
    await db.products.update_one({"id": pid}, {"$set": update})
    doc = await db.products.find_one({"id": pid}, {"_id": 0})
    return doc


@api.delete("/products/{pid}")
async def delete_product(pid: str, user=Depends(require_role("seller", "admin"))):
    p = await db.products.find_one({"id": pid})
    if not p:
        raise HTTPException(404, "Not found")
    if user["role"] != "admin" and p["seller_id"] != user["id"]:
        raise HTTPException(403, "Not your product")
    await db.products.delete_one({"id": pid})
    return {"ok": True}


@api.get("/seller/products")
async def seller_products(user=Depends(require_role("seller"))):
    items = await db.products.find({"seller_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return items


# ---------- Admin ----------
@api.get("/admin/products/pending")
async def pending_products(user=Depends(require_role("admin"))):
    items = await db.products.find({"status": "pending"}, {"_id": 0}).sort("created_at", -1).to_list(200)
    for p in items:
        s = await db.users.find_one({"id": p.get("seller_id")}, {"_id": 0, "password": 0})
        p["seller_name"] = s["name"] if s else "Unknown"
    return items


@api.post("/admin/products/{pid}/approve")
async def approve_product(pid: str, user=Depends(require_role("admin"))):
    r = await db.products.update_one(
        {"id": pid},
        {"$set": {"status": "approved", "rejection_reason": None, "updated_at": now_iso()}},
    )
    if not r.matched_count:
        raise HTTPException(404, "Not found")
    return {"ok": True}


@api.post("/admin/products/{pid}/reject")
async def reject_product(pid: str, body: RejectIn, user=Depends(require_role("admin"))):
    r = await db.products.update_one(
        {"id": pid},
        {"$set": {"status": "rejected", "rejection_reason": body.reason, "updated_at": now_iso()}},
    )
    if not r.matched_count:
        raise HTTPException(404, "Not found")
    return {"ok": True}


@api.get("/admin/stats")
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


# ---------- Cart ----------
@api.get("/cart")
async def get_cart(user=Depends(require_role("customer"))):
    items = await db.cart.find({"user_id": user["id"]}, {"_id": 0}).to_list(200)
    # Enrich with product info
    out = []
    for it in items:
        p = await db.products.find_one({"id": it["product_id"]}, {"_id": 0})
        if p:
            out.append({**it, "product": p})
    return out


@api.post("/cart")
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


@api.delete("/cart/{product_id}")
async def remove_from_cart(product_id: str, user=Depends(require_role("customer"))):
    await db.cart.delete_one({"user_id": user["id"], "product_id": product_id})
    return {"ok": True}


# ---------- Wishlist ----------
@api.get("/wishlist")
async def get_wishlist(user=Depends(require_role("customer"))):
    items = await db.wishlist.find({"user_id": user["id"]}, {"_id": 0}).to_list(200)
    out = []
    for it in items:
        p = await db.products.find_one({"id": it["product_id"]}, {"_id": 0})
        if p:
            out.append(p)
    return out


@api.post("/wishlist/{product_id}")
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


@api.delete("/wishlist/{product_id}")
async def remove_wishlist(product_id: str, user=Depends(require_role("customer"))):
    await db.wishlist.delete_one({"user_id": user["id"], "product_id": product_id})
    return {"ok": True}


# ---------- Orders ----------
@api.post("/orders/checkout")
async def checkout(body: CheckoutIn, user=Depends(require_role("customer"))):
    cart_items = await db.cart.find({"user_id": user["id"]}, {"_id": 0}).to_list(200)
    if not cart_items:
        raise HTTPException(400, "Cart is empty")
    order_items = []
    total = 0.0
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
        total += p["price"] * it["qty"]
        order_items.append(line)
    order = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "items": order_items,
        "total": round(total, 2),
        "address": body.address.model_dump(),
        "payment_method": body.payment_method,
        "status": "placed",
        "created_at": now_iso(),
    }
    await db.orders.insert_one(order)
    await db.cart.delete_many({"user_id": user["id"]})
    order.pop("_id", None)
    return order


@api.get("/orders")
async def my_orders(user=Depends(get_current_user)):
    if user["role"] == "customer":
        items = await db.orders.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(200)
    elif user["role"] == "seller":
        items = await db.orders.find({"items.seller_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(200)
    else:
        items = await db.orders.find({}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return items


@api.post("/orders/{oid}/status")
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
    return {"ok": True}


# ---------- Reviews ----------
@api.get("/products/{pid}/reviews")
async def product_reviews(pid: str):
    items = await db.reviews.find({"product_id": pid}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return items


@api.post("/reviews")
async def add_review(body: ReviewIn, user=Depends(require_role("customer"))):
    review = {
        "id": str(uuid.uuid4()),
        "product_id": body.product_id,
        "user_id": user["id"],
        "user_name": user["name"],
        "rating": body.rating,
        "comment": body.comment,
        "created_at": now_iso(),
    }
    await db.reviews.insert_one(review)
    # recompute product rating
    reviews = await db.reviews.find({"product_id": body.product_id}, {"_id": 0, "rating": 1}).to_list(1000)
    avg = sum(r["rating"] for r in reviews) / len(reviews)
    await db.products.update_one(
        {"id": body.product_id},
        {"$set": {"rating": round(avg, 1), "review_count": len(reviews)}},
    )
    review.pop("_id", None)
    return review


# ---------- AI Description ----------
@api.post("/ai/generate-description")
async def ai_generate(body: AIGenIn, user=Depends(require_role("seller"))):
    system_msg = (
        "You are a copywriter for a premium handmade artisan marketplace. "
        "Write warm, story-led, editorial product descriptions of 2-3 short paragraphs. "
        "Focus on craftsmanship, materials, and the artisan's care. Avoid marketing cliches."
    )
    prompt = (
        f"Product title: {body.title}\n"
        f"Materials: {body.materials or 'unspecified'}\n"
        f"Keywords: {body.keywords or 'handmade, artisan'}\n\n"
        "Write a compelling product description."
    )
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"desc-{uuid.uuid4()}",
            system_message=system_msg,
        ).with_model("openai", "gpt-4o-mini")
        parts: list[str] = []
        async for ev in chat.stream_message(UserMessage(text=prompt)):
            if isinstance(ev, TextDelta):
                parts.append(ev.content)
            elif isinstance(ev, StreamDone):
                break
        return {"description": "".join(parts).strip()}
    except Exception as e:
        log.exception("AI generation failed")
        raise HTTPException(500, f"AI generation failed: {e}")


# ---------- Seed ----------
SEED_PRODUCTS = [
    {
        "title": "Hand-thrown Terracotta Vase",
        "description": "A quiet, sculptural vase thrown on a slow wheel in a small studio in Jaipur.\n\nEach vase carries the maker's fingerprints in the clay — no two are alike. Finished with a matte terracotta glaze that softens with time.",
        "price": 68.0,
        "category": "ceramics",
        "stock": 12,
        "materials": "Local red clay, matte glaze",
        "dimensions": "18cm × 12cm",
        "shipping_days": 7,
        "images": [
            "https://images.unsplash.com/photo-1631125915902-d8abe9225ff2?w=800",
            "https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=800",
            "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=800",
        ],
        "tags": ["vase", "ceramic", "home decor"],
    },
    {
        "title": "Slow-stitched Leather Bifold",
        "description": "Cut from full-grain vegetable-tanned leather and saddle-stitched entirely by hand.\n\nA wallet designed to age quietly — the leather deepens with every day it lives in your pocket.",
        "price": 145.0,
        "category": "leather",
        "stock": 6,
        "materials": "Full-grain vegetable-tanned leather, waxed linen thread",
        "dimensions": "11cm × 9cm",
        "shipping_days": 10,
        "images": [
            "https://images.unsplash.com/photo-1628483211662-9bcc692c46dc?w=800",
            "https://images.unsplash.com/photo-1627123424574-724758594e93?w=800",
        ],
        "tags": ["wallet", "leather", "edc"],
    },
    {
        "title": "Handwoven Wool Throw",
        "description": "Woven on a floor loom from undyed Merino wool.\n\nWarm without being heavy, this throw takes about three days on the loom and finishes on a wooden beam. A quiet, useful object.",
        "price": 210.0,
        "category": "textiles",
        "stock": 4,
        "materials": "100% undyed Merino wool",
        "dimensions": "180cm × 130cm",
        "shipping_days": 12,
        "images": [
            "https://images.unsplash.com/photo-1544736779-15c123c4c66f?w=800",
            "https://images.unsplash.com/photo-1615529182904-14819c35db37?w=800",
        ],
        "tags": ["throw", "wool", "textile"],
    },
    {
        "title": "Brass Crescent Earrings",
        "description": "Hammered from a single sheet of raw brass and finished by hand.\n\nLight to wear, warm in tone, and designed to develop a soft patina over the years.",
        "price": 42.0,
        "category": "jewelry",
        "stock": 20,
        "materials": "Raw brass, sterling silver posts",
        "dimensions": "3cm drop",
        "shipping_days": 5,
        "images": [
            "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=800",
            "https://images.unsplash.com/photo-1602752250015-52934bc45613?w=800",
        ],
        "tags": ["earrings", "brass", "jewelry"],
    },
    {
        "title": "Carved Olive Wood Bowl",
        "description": "Turned from a single piece of storm-fallen olive wood.\n\nThe grain — never the same twice — is the whole point. Finished with food-safe walnut oil.",
        "price": 88.0,
        "category": "decor",
        "stock": 9,
        "materials": "Olive wood, walnut oil",
        "dimensions": "22cm diameter",
        "shipping_days": 8,
        "images": [
            "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800",
            "https://images.unsplash.com/photo-1578500494198-246f612d3b3d?w=800",
        ],
        "tags": ["bowl", "wood", "kitchen"],
    },
    {
        "title": "Botanical Monoprint — Fern",
        "description": "A single-run monoprint pressed from a real fern leaf onto handmade cotton paper.\n\nEach print is unique and signed by the artist. Ships flat, unframed.",
        "price": 55.0,
        "category": "art",
        "stock": 15,
        "materials": "Water-based ink, handmade cotton paper",
        "dimensions": "A4 / 21cm × 30cm",
        "shipping_days": 6,
        "images": [
            "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=800",
            "https://images.unsplash.com/photo-1502085671122-2d218cd434e6?w=800",
        ],
        "tags": ["print", "botanical", "art"],
    },
]


@api.post("/seed")
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
            continue
        uid = str(uuid.uuid4())
        await db.users.insert_one({
            "id": uid,
            "name": u["name"],
            "email": u["email"],
            "password": hash_password(u["password"]),
            "role": u["role"],
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

    return {"ok": True, "categories": len(DEFAULT_CATEGORIES)}


@api.get("/")
async def root():
    return {"app": "ArtisanMarket", "ok": True}


app.include_router(api)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def _startup():
    await db.users.create_index("email", unique=True)
    await db.products.create_index("status")
    await db.products.create_index("category")


@app.on_event("shutdown")
async def _shutdown():
    client.close()
