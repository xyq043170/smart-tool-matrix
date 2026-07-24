import logging
from typing import Optional
from fastapi import Request
from src.auth.service import decode_jwt
from src.models import User

_logger = logging.getLogger(__name__)


async def get_user(request: Request) -> Optional[User]:
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return None
    token = auth_header[7:]
    if token == "xxx":
        return None
    payload = decode_jwt(token)
    if not payload:
        return None
    return User(
        user_id=payload.get("user_id", 0),
        login_type=payload.get("login_type", "email"),
        user_name=payload.get("email", ""),
        expire_at=payload.get("exp", 0),
    )
