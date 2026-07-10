from datetime import datetime, timezone, timedelta
from typing import Optional

import jwt
import bcrypt
from fastapi import HTTPException, Depends, Header
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.config import JWT_SECRET
from app.database import db

limiter = Limiter(key_func=get_remote_address)


def hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()


def verify_password(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode(), hashed.encode())
    except Exception:
        return False


def create_token(user_id: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")


RESET_TOKEN_PURPOSE = "password_reset"


def create_reset_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "purpose": RESET_TOKEN_PURPOSE,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=15),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")


def decode_reset_token(token: str) -> str:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
    except jwt.PyJWTError:
        raise HTTPException(400, "Invalid or expired reset link")
    if payload.get("purpose") != RESET_TOKEN_PURPOSE:
        raise HTTPException(400, "Invalid reset token")
    return payload["sub"]


async def get_current_user(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Missing token")
    token = authorization.split(" ", 1)[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
    except jwt.PyJWTError:
        raise HTTPException(401, "Invalid token")
    user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password": 0})
    if not user:
        raise HTTPException(401, "User not found")
    return user


def require_role(*roles):
    async def _dep(user=Depends(get_current_user)):
        if user["role"] not in roles:
            raise HTTPException(403, "Forbidden")
        return user
    return _dep
