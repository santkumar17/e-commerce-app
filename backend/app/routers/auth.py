import uuid

from fastapi import APIRouter, HTTPException, Depends, Request

from app.database import db
from app.security import hash_password, verify_password, create_token, get_current_user, limiter
from app.utils import now_iso
from app.models.auth import RegisterIn, LoginIn

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
