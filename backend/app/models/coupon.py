from typing import Literal

from pydantic import BaseModel


class CouponIn(BaseModel):
    code: str
    discount_type: Literal["percent", "flat"] = "percent"
    value: float
    min_order: float = 0.0
    active: bool = True


class ValidateCouponIn(BaseModel):
    code: str
    subtotal: float
