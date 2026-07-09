from typing import Literal, Optional

from pydantic import BaseModel, Field


class AddressIn(BaseModel):
    full_name: str = Field(max_length=200)
    phone: str = Field(max_length=200)
    line1: str = Field(max_length=200)
    city: str = Field(max_length=200)
    state: str = Field(max_length=200)
    zip: str = Field(max_length=200)


class CheckoutIn(BaseModel):
    address: AddressIn
    payment_method: Literal["cod"] = "cod"
    coupon_code: Optional[str] = None
