from fastapi import APIRouter

from app.routers import (
    auth,
    uploads,
    categories,
    products,
    admin,
    cart,
    wishlist,
    orders,
    sellers,
    coupons,
    notifications,
    reviews,
    ai,
    seed,
)

api_router = APIRouter(prefix="/api")
api_router.include_router(auth.router)
api_router.include_router(uploads.router)
api_router.include_router(categories.router)
api_router.include_router(products.router)
api_router.include_router(admin.router)
api_router.include_router(cart.router)
api_router.include_router(wishlist.router)
api_router.include_router(orders.router)
api_router.include_router(sellers.router)
api_router.include_router(coupons.router)
api_router.include_router(notifications.router)
api_router.include_router(reviews.router)
api_router.include_router(ai.router)
api_router.include_router(seed.router)


@api_router.get("/")
async def root():
    return {"app": "ArtisanMarket", "ok": True}
