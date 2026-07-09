from typing import Literal

from pydantic import BaseModel, Field, EmailStr


class RegisterIn(BaseModel):
    name: str = Field(max_length=200)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    role: Literal["customer", "seller"] = "customer"


class LoginIn(BaseModel):
    email: EmailStr
    password: str
