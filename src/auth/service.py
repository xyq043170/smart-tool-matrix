import bcrypt
import jwt
import secrets
import datetime
import logging
from typing import Optional
from psycopg import AsyncConnection

from src.config import settings

_logger = logging.getLogger(__name__)


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())


def create_jwt(user_id: int, email: str, login_type: str) -> str:
    payload = {
        "user_id": user_id,
        "email": email,
        "login_type": login_type,
        "exp": datetime.datetime.utcnow() + datetime.timedelta(days=30),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm="HS256")


def decode_jwt(token: str) -> Optional[dict]:
    try:
        return jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
    except jwt.PyJWTError:
        return None


def generate_token() -> str:
    return secrets.token_urlsafe(32)


async def get_user_by_email(db: AsyncConnection, email: str) -> Optional[dict]:
    cursor = await db.execute("SELECT * FROM users WHERE email = %s", (email,))
    row = await cursor.fetchone()
    if row:
        return dict(row)
    return None


async def get_user_by_id(db: AsyncConnection, user_id: int) -> Optional[dict]:
    cursor = await db.execute("SELECT * FROM users WHERE id = %s", (user_id,))
    row = await cursor.fetchone()
    if row:
        return dict(row)
    return None


async def create_user(db: AsyncConnection, email: str, password_hash: str, login_type: str = "email") -> int:
    cursor = await db.execute(
        "INSERT INTO users (email, password_hash, login_type) VALUES (%s, %s, %s) RETURNING id",
        (email, password_hash, login_type)
    )
    row = await cursor.fetchone()
    await db.commit()
    return int(row["id"])


async def create_verification_token(db: AsyncConnection, user_id: int, token_type: str) -> str:
    token = generate_token()
    expires_at = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=24)
    await db.execute(
        "INSERT INTO verification_tokens (user_id, token, type, expires_at) VALUES (%s, %s, %s, %s)",
        (user_id, token, token_type, expires_at)
    )
    await db.commit()
    return token


async def verify_token(db: AsyncConnection, token: str, token_type: str) -> Optional[int]:
    cursor = await db.execute(
        "SELECT user_id, expires_at FROM verification_tokens WHERE token = %s AND type = %s AND used = FALSE",
        (token, token_type)
    )
    row = await cursor.fetchone()
    if not row:
        return None
    row = dict(row)
    expires_at = row["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=datetime.timezone.utc)
    if expires_at < datetime.datetime.now(datetime.timezone.utc):
        return None
    await db.execute("UPDATE verification_tokens SET used = TRUE WHERE token = %s", (token,))
    return row["user_id"]
