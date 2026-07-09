from fastapi import APIRouter, Depends, UploadFile, File

from app.security import require_role
from app.storage import storage

router = APIRouter(tags=["uploads"])


@router.post("/uploads/image")
async def upload_image(file: UploadFile = File(...), user=Depends(require_role("seller", "admin"))):
    data = await file.read()
    url = await storage.save(data, file.content_type)
    return {"url": url}
