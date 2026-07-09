from fastapi import APIRouter

from app.seed_data import DEFAULT_CATEGORIES

router = APIRouter(tags=["categories"])


@router.get("/categories")
async def list_categories():
    return DEFAULT_CATEGORIES
