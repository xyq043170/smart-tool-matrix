import logging
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, EmailStr
from psycopg import AsyncConnection

from src.database import get_db
from src.auth.service import (
    hash_password, verify_password, create_jwt, decode_jwt,
    get_user_by_email, get_user_by_id, create_user, create_verification_token,
    verify_token
)
from src.auth.email import send_verification_email, send_reset_email
from src.auth.google import verify_google_token

router = APIRouter(prefix="/api/v1/auth", tags=["Auth"])
_logger = logging.getLogger(__name__)


class RegisterBody(BaseModel):
    email: EmailStr
    password: str


class LoginBody(BaseModel):
    email: EmailStr
    password: str


class ForgotPasswordBody(BaseModel):
    email: EmailStr


class ResetPasswordBody(BaseModel):
    token: str
    new_password: str


class GoogleAuthBody(BaseModel):
    id_token: str


@router.post("/register")
async def register(body: RegisterBody, db: AsyncConnection = Depends(get_db)):
    existing = await get_user_by_email(db, body.email)
    if existing:
        if existing["email_verified"]:
            raise HTTPException(status_code=400, detail="Email already registered")
        token = await create_verification_token(db, existing["id"], "email_verify")
        if not send_verification_email(body.email, token):
            raise HTTPException(
                status_code=503,
                detail={"code": "email_delivery_failed", "message": "Verification email could not be sent"},
            )
        return {"message": "Verification email sent. Please check your inbox."}
    if len(body.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    password_hash = hash_password(body.password)
    user_id = await create_user(db, body.email, password_hash)
    token = await create_verification_token(db, user_id, "email_verify")
    if not send_verification_email(body.email, token):
        raise HTTPException(
            status_code=503,
            detail={"code": "email_delivery_failed", "message": "Verification email could not be sent"},
        )
    return {"message": "Registration successful. Please check your email to verify."}


@router.post("/login")
async def login(body: LoginBody, db: AsyncConnection = Depends(get_db)):
    user = await get_user_by_email(db, body.email)
    if not user or not user["password_hash"]:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not verify_password(body.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not user["email_verified"]:
        raise HTTPException(
            status_code=403,
            detail={"code": "email_not_verified", "message": "Please verify your email before signing in"},
        )
    jwt_token = create_jwt(user["id"], user["email"], user["login_type"])
    return {"token": jwt_token}


@router.get("/verify/{token}")
async def verify_email(token: str, db: AsyncConnection = Depends(get_db)):
    user_id = await verify_token(db, token, "email_verify")
    if not user_id:
        raise HTTPException(status_code=400, detail="Invalid or expired token")
    await db.execute("UPDATE users SET email_verified = TRUE, updated_at = NOW() WHERE id = %s", (user_id,))
    await db.commit()
    return {"message": "Email verified successfully"}


@router.post("/forgot-password")
async def forgot_password(body: ForgotPasswordBody, db: AsyncConnection = Depends(get_db)):
    user = await get_user_by_email(db, body.email)
    if not user:
        return {"message": "If the email exists, a reset link has been sent."}
    token = await create_verification_token(db, user["id"], "password_reset")
    if not send_reset_email(body.email, token):
        raise HTTPException(
            status_code=503,
            detail={"code": "email_delivery_failed", "message": "Reset email could not be sent"},
        )
    return {"message": "If the email exists, a reset link has been sent."}


@router.post("/reset-password")
async def reset_password(body: ResetPasswordBody, db: AsyncConnection = Depends(get_db)):
    user_id = await verify_token(db, body.token, "password_reset")
    if not user_id:
        raise HTTPException(status_code=400, detail="Invalid or expired token")
    if len(body.new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    new_hash = hash_password(body.new_password)
    await db.execute("UPDATE users SET password_hash = %s, updated_at = NOW() WHERE id = %s", (new_hash, user_id))
    await db.commit()
    return {"message": "Password updated successfully"}


@router.get("/profile")
async def get_profile(request: Request, db: AsyncConnection = Depends(get_db)):
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = auth_header[7:]
    payload = decode_jwt(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = await get_user_by_id(db, payload["user_id"])
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "id": user["id"],
        "email": user["email"],
        "display_name": user["display_name"],
        "login_type": user["login_type"],
        "email_verified": bool(user["email_verified"]),
    }


@router.post("/google")
async def google_auth(body: GoogleAuthBody, db: AsyncConnection = Depends(get_db)):
    google_info = await verify_google_token(body.id_token)
    if not google_info:
        raise HTTPException(status_code=401, detail="Invalid Google token")

    # Check if user exists by google_id
    cursor = await db.execute(
        "SELECT * FROM users WHERE google_id = %s", (google_info["google_id"],)
    )
    user = await cursor.fetchone()

    if user:
        user = dict(user)
    else:
        # Check if email already exists (user registered with email)
        existing = await get_user_by_email(db, google_info["email"])
        if existing:
            # Link Google account to existing email user
            await db.execute(
                "UPDATE users SET google_id = %s, login_type = 'google', email_verified = TRUE, updated_at = NOW() WHERE id = %s",
                (google_info["google_id"], existing["id"])
            )
            await db.commit()
            user = existing
            user["login_type"] = "google"
        else:
            # Create new user
            cursor = await db.execute(
                "INSERT INTO users (email, login_type, google_id, display_name, email_verified)"
                " VALUES (%s, %s, %s, %s, TRUE) RETURNING id",
                (google_info["email"], "google", google_info["google_id"], google_info["name"])
            )
            row = await cursor.fetchone()
            await db.commit()
            user = {
                "id": int(row["id"]),
                "email": google_info["email"],
                "login_type": "google",
            }

    jwt_token = create_jwt(user["id"], user["email"], "google")
    return {"token": jwt_token}
