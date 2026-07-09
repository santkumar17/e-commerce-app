from typing import Optional

from pydantic import BaseModel, Field


class ReviewIn(BaseModel):
    product_id: str
    rating: int = Field(ge=1, le=5)
    comment: str = ""
    order_id: Optional[str] = None
