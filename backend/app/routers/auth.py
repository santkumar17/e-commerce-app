import uuid

from fastapi import APIRouter, HTTPException, Depends, Request

from app.database import db
from app.security import (
    hash_password, verify_password, create_token, get_current_user, limiter,
    create_reset_token, decode_reset_token,
)
from app.utils import now_iso
from app.models.auth import (
    RegisterIn, LoginIn, ProfileUpdateIn, ChangePasswordIn, ForgotPasswordIn, ResetPasswordIn,
)

router = APIRouter(tags=["auth"])


@router.post("/auth/register")
@limiter.limit("5/minute")
async def register(request: Request, body: RegisterIn):
    if await db.users.find_one({"email": body.email.lower()}):
        raise HTTPException(400, "Email already registered")
    user = {
        "id": str(uuid.uuid4()),
        "name": body.name,
        "email": body.email.lower(),
        "password": hash_password(body.password),
        "role": body.role,
        "verified": False,  # sellers start unverified, admin verifies
        "bio": "",
        "created_at": now_iso(),
    }
    await db.users.insert_one(user)
    token = create_token(user["id"], user["role"])
    return {
        "token": token,
        "user": {"id": user["id"], "name": user["name"], "email": user["email"], "role": user["role"]},
    }


@router.post("/auth/login")
@limiter.limit("15/minute")
async def login(request: Request, body: LoginIn):
    user = await db.users.find_one({"email": body.email.lower()})
    if not user or not verify_password(body.password, user["password"]):
        raise HTTPException(401, "Invalid credentials")
    token = create_token(user["id"], user["role"])
    return {
        "token": token,
        "user": {"id": user["id"], "name": user["name"], "email": user["email"], "role": user["role"]},
    }


@router.get("/auth/me")
async def me(user=Depends(get_current_user)):
    return user


@router.put("/auth/me")
async def update_me(body: ProfileUpdateIn, user=Depends(get_current_user)):
    update = {k: v for k, v in body.model_dump(exclude_unset=True).items() if v is not None}
    if update:
        await db.users.update_one({"id": user["id"]}, {"$set": update})
    doc = await db.users.find_one({"id": user["id"]}, {"_id": 0, "password": 0})
    return doc


@router.post("/auth/change-password")
async def change_password(body: ChangePasswordIn, user=Depends(get_current_user)):
    full = await db.users.find_one({"id": user["id"]})
    if not full or not verify_password(body.current_password, full["password"]):
        raise HTTPException(401, "Current password is incorrect")
    await db.users.update_one({"id": user["id"]}, {"$set": {"password": hash_password(body.new_password)}})
    return {"ok": True}


@router.post("/auth/forgot-password")
@limiter.limit("5/minute")
async def forgot_password(request: Request, body: ForgotPasswordIn):
    user = await db.users.find_one({"email": body.email.lower()})
    if not user:
        raise HTTPException(404, "No account found with that email")
    # Demo mode: no email service is configured, so the reset token is returned
    # directly instead of being emailed. A production setup would email this link.
    return {"reset_token": create_reset_token(user["id"])}


@router.post("/auth/reset-password")
@limiter.limit("5/minute")
async def reset_password(request: Request, body: ResetPasswordIn):
    user_id = decode_reset_token(body.reset_token)
    r = await db.users.update_one({"id": user_id}, {"$set": {"password": hash_password(body.new_password)}})
    if not r.matched_count:
        raise HTTPException(404, "Account not found")
    return {"ok": True}
