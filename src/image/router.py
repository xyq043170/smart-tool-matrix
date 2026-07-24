import logging
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel

from src.auth.service import decode_jwt
from src.image import generate_image
from src.image.prompts import build_portrait_prompt

router = APIRouter(prefix="/api/v1/image", tags=["Image"])
_logger = logging.getLogger(__name__)


def _get_user_id(request: Request) -> int:
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    payload = decode_jwt(auth_header[7:])
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    return payload["user_id"]


class PortraitRequest(BaseModel):
    gender: str
    birthday: str
    style: str = "mystical"


@router.post("/portrait")
async def generate_portrait(
    body: PortraitRequest,
    request: Request,
):
    _get_user_id(request)

    prompt = build_portrait_prompt(body.gender, body.birthday, body.style)

    try:
        result = await generate_image(prompt)
        return result
    except Exception:
        _logger.exception("Portrait generation failed")
        raise HTTPException(status_code=500, detail="Portrait generation failed")
