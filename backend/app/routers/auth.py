import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.database import get_db
from app.core.security import (
    create_access_token,
    get_current_user,
    hash_password,
    verify_password,
)
from app.schemas.auth import LoginRequest, SignupRequest, TokenResponse, UserResponse

router = APIRouter(prefix="/api/auth", tags=["auth"])


# ─────────────────────────────────────────
# POST /api/auth/signup
# ─────────────────────────────────────────
@router.post("/signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def signup(body: SignupRequest):
    db = get_db()

    # Duplicate email check
    existing = await db["users"].find_one({"email": body.email})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    user_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)

    user_doc = {
        "_id": user_id,
        "email": body.email,
        "name": body.name or body.email.split("@")[0],
        "password_hash": hash_password(body.password),
        "created_at": now,
        "last_login": now,
    }

    await db["users"].insert_one(user_doc)
    token = create_access_token(user_id, body.email)

    return TokenResponse(
        access_token=token,
        user={"id": user_id, "email": body.email, "name": user_doc["name"]},
    )


# ─────────────────────────────────────────
# POST /api/auth/login
# ─────────────────────────────────────────
@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest):
    db = get_db()

    user = await db["users"].find_one({"email": body.email})
    if not user:
        raise HTTPException(
            status_code=404,
            detail="No account found with this email. Sign up to get started!",
        )
    if not verify_password(body.password, user["password_hash"]):
        raise HTTPException(
            status_code=401,
            detail="Incorrect password — try again!",
        )

    # Update last login time
    await db["users"].update_one(
        {"_id": user["_id"]},
        {"$set": {"last_login": datetime.now(timezone.utc)}},
    )

    token = create_access_token(user["_id"], user["email"])

    return TokenResponse(
        access_token=token,
        user={"id": user["_id"], "email": user["email"], "name": user.get("name", "")},
    )


# ─────────────────────────────────────────
# GET /api/auth/me
# ─────────────────────────────────────────
@router.get("/me", response_model=UserResponse)
async def me(current_user: dict = Depends(get_current_user)):
    return current_user
