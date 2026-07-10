from typing import Literal, Optional

from pydantic import BaseModel, Field, EmailStr


class RegisterIn(BaseModel):
    name: str = Field(max_length=200)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    role: Literal["customer", "seller"] = "customer"


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class AddressUpdateIn(BaseModel):
    line1: str = Field(max_length=200)
    city: str = Field(max_length=200)
    state: str = Field(max_length=200)
    zip: str = Field(max_length=200)


class ProfileUpdateIn(BaseModel):
    name: Optional[str] = Field(default=None, max_length=200)
    bio: Optional[str] = Field(default=None, max_length=1000)
    phone: Optional[str] = Field(default=None, max_length=30)
    avatar_url: Optional[str] = Field(default=None, max_length=2000)
    address: Optional[AddressUpdateIn] = None


class ChangePasswordIn(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8, max_length=128)


class ForgotPasswordIn(BaseModel):
    email: EmailStr


class ResetPasswordIn(BaseModel):
    reset_token: str
    new_password: str = Field(min_length=8, max_length=128)
