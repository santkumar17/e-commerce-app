from motor.motor_asyncio import AsyncIOMotorClient

from app.config import MONGO_URL, DB_NAME

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]


async def create_indexes():
    await db.users.create_index("email", unique=True)
    await db.products.create_index("status")
    await db.products.create_index("category")
