import logging
import os

import httpx

from src.config import settings as app_settings

_logger = logging.getLogger(__name__)

IMAGE_API_KEY = os.getenv("IMAGE_API_KEY", "") or app_settings.image_api_key
IMAGE_API_BASE = (
    os.getenv("IMAGE_API_BASE", "") or app_settings.image_api_base
).rstrip("/")
IMAGE_MODEL = os.getenv("IMAGE_MODEL", "") or app_settings.image_model
IMAGE_QUALITY = os.getenv("IMAGE_QUALITY", "") or app_settings.image_quality
IMAGE_OUTPUT_FORMAT = (
    os.getenv("IMAGE_OUTPUT_FORMAT", "") or app_settings.image_output_format
)

DIVINATION_COST = 3
PORTRAIT_COST = 3


async def generate_image(prompt: str, size: str = "1024x1024") -> dict:
    """Call the configured OpenAI-compatible image generation endpoint."""
    if not IMAGE_API_KEY:
        raise ValueError("IMAGE_API_KEY not configured")

    url = f"{IMAGE_API_BASE}/images/generations"
    headers = {
        "Authorization": f"Bearer {IMAGE_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": IMAGE_MODEL,
        "prompt": prompt,
        "size": size,
        "n": 1,
    }
    if IMAGE_QUALITY:
        payload["quality"] = IMAGE_QUALITY
    if IMAGE_OUTPUT_FORMAT:
        payload["output_format"] = IMAGE_OUTPUT_FORMAT

    _logger.info(
        "Generating image with model=%s prompt=%s...", IMAGE_MODEL, prompt[:100]
    )

    try:
        timeout = httpx.Timeout(connect=15.0, read=90.0, write=30.0, pool=15.0)
        async with httpx.AsyncClient(timeout=timeout) as client:
            resp = await client.post(url, json=payload, headers=headers)
            resp.raise_for_status()
            data = resp.json()
    except httpx.HTTPStatusError as exc:
        _logger.error(
            "Image API rejected the request: model=%s status=%s response=%s",
            IMAGE_MODEL,
            exc.response.status_code,
            exc.response.text[:1000],
        )
        raise RuntimeError(
            f"Image API returned HTTP {exc.response.status_code}"
        ) from exc
    except httpx.TimeoutException as exc:
        _logger.error("Image API timed out: model=%s error=%r", IMAGE_MODEL, exc)
        raise RuntimeError("Image API timed out") from exc
    except httpx.TransportError as exc:
        _logger.error(
            "Image API connection failed: model=%s error=%r", IMAGE_MODEL, exc
        )
        raise RuntimeError("Image API connection failed") from exc
    except ValueError as exc:
        _logger.error("Image API returned invalid JSON: model=%s", IMAGE_MODEL)
        raise RuntimeError("Image API returned invalid JSON") from exc

    if isinstance(data.get("data"), list) and data["data"]:
        image_data = data["data"][0]
        image_url = image_data.get("url", "")
        if image_url:
            return {"image_url": image_url, "prompt_used": prompt}

        image_base64 = image_data.get("b64_json", "")
        if image_base64:
            return {
                "image_url": f"data:image/png;base64,{image_base64}",
                "prompt_used": prompt,
            }

    _logger.error(
        "Image API returned no usable image: model=%s response_keys=%s",
        IMAGE_MODEL,
        list(data.keys()) if isinstance(data, dict) else [],
    )
    raise RuntimeError("No image returned from API")
