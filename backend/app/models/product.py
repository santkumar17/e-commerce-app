from typing import List, Optional

from pydantic import BaseModel, Field, field_validator

from app.models.common import ProductStatus


class ProductIn(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: str = Field(max_length=5000)
    price: float = Field(gt=0)
    category: str
    stock: int = Field(default=1, ge=0)
    materials: Optional[str] = Field(default=None, max_length=500)
    dimensions: Optional[str] = Field(default=None, max_length=500)
    shipping_days: int = 7
    images: List[str] = Field(default_factory=list, max_length=5)  # upload URLs
    tags: List[str] = Field(default_factory=list, max_length=20)
    status: ProductStatus = "pending"  # allow "draft" from seller

    @field_validator("images")
    @classmethod
    def _cap_image_length(cls, v: List[str]) -> List[str]:
        for item in v:
            if len(item) > 2000:
                raise ValueError("image entry too long; upload via /uploads/image and use the returned URL")
        return v


class RejectIn(BaseModel):
    reason: str
