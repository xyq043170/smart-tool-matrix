import logging
from typing import Optional
from google.oauth2 import id_token
from google.auth.transport import requests

from src.config import settings

_logger = logging.getLogger(__name__)


async def verify_google_token(token: str) -> Optional[dict]:
    """Verify Google ID token and return user info."""
    try:
        idinfo = id_token.verify_oauth2_token(
            token, requests.Request(), settings.google_client_id
        )
        if idinfo["iss"] not in ["accounts.google.com", "https://accounts.google.com"]:
            return None
        return {
            "google_id": idinfo["sub"],
            "email": idinfo["email"],
            "name": idinfo.get("name", ""),
            "email_verified": idinfo.get("email_verified", False),
        }
    except Exception as e:
        _logger.error(f"Google token verification failed: {e}")
        return None
