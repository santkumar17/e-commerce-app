from pydantic import BaseModel


class CartIn(BaseModel):
    product_id: str
    qty: int = 1
