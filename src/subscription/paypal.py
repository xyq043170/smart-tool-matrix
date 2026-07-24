import logging
import os
import uuid

import httpx

from src.config import settings as app_settings

_logger = logging.getLogger(__name__)

PAYPAL_CLIENT_ID = os.getenv("PAYPAL_CLIENT_ID", "") or app_settings.paypal_client_id
PAYPAL_CLIENT_SECRET = (
    os.getenv("PAYPAL_CLIENT_SECRET", "") or app_settings.paypal_client_secret
)
PAYPAL_MODE = (os.getenv("PAYPAL_MODE", "") or app_settings.paypal_mode).lower()
PAYPAL_WEBHOOK_ID = (
    os.getenv("PAYPAL_WEBHOOK_ID", "") or app_settings.paypal_webhook_id
)
PAYPAL_PLAN_IDS = {
    "daily": os.getenv("PAYPAL_PLAN_DAILY", "") or app_settings.paypal_plan_daily,
    "weekly": os.getenv("PAYPAL_PLAN_WEEKLY", "") or app_settings.paypal_plan_weekly,
    "monthly": os.getenv("PAYPAL_PLAN_MONTHLY", "") or app_settings.paypal_plan_monthly,
    "yearly": os.getenv("PAYPAL_PLAN_YEARLY", "") or app_settings.paypal_plan_yearly,
}
PAYPAL_BASE_URL = (
    "https://api-m.paypal.com"
    if PAYPAL_MODE == "live"
    else "https://api-m.sandbox.paypal.com"
)


class PayPalAPIError(RuntimeError):
    """A safe, user-independent summary of a PayPal API failure."""


async def _request(method: str, path: str, **kwargs) -> httpx.Response:
    try:
        timeout = httpx.Timeout(connect=10.0, read=30.0, write=20.0, pool=10.0)
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.request(
                method, f"{PAYPAL_BASE_URL}{path}", **kwargs
            )
            response.raise_for_status()
            return response
    except httpx.HTTPStatusError as exc:
        _logger.error(
            "PayPal API rejected request: method=%s path=%s status=%s response=%s",
            method,
            path,
            exc.response.status_code,
            exc.response.text[:1000],
        )
        raise PayPalAPIError(
            f"PayPal API returned HTTP {exc.response.status_code}"
        ) from exc
    except httpx.HTTPError as exc:
        _logger.error(
            "PayPal API connection failed: method=%s path=%s error=%r",
            method,
            path,
            exc,
        )
        raise PayPalAPIError("PayPal API connection failed") from exc


async def _get_access_token() -> str:
    response = await _request(
        "POST",
        "/v1/oauth2/token",
        auth=(PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET),
        data={"grant_type": "client_credentials"},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    return response.json()["access_token"]


async def create_order(
    package_id: str,
    package_name: str,
    amount_usd: float,
    user_id: int,
    return_url: str,
    cancel_url: str,
) -> dict:
    token = await _get_access_token()
    response = await _request(
        "POST",
        "/v2/checkout/orders",
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        },
        json={
            "intent": "CAPTURE",
            "purchase_units": [
                {
                    "reference_id": package_id,
                    "custom_id": str(user_id),
                    "description": package_name,
                    "amount": {
                        "currency_code": "USD",
                        "value": f"{amount_usd:.2f}",
                    },
                }
            ],
            "payment_source": {
                "paypal": {
                    "experience_context": {
                        "brand_name": "Smart Tool Matrix",
                        "shipping_preference": "NO_SHIPPING",
                        "return_url": return_url,
                        "cancel_url": cancel_url,
                        "user_action": "PAY_NOW",
                    }
                }
            },
        },
    )
    data = response.json()
    approve_link = next(
        (
            link["href"]
            for link in data.get("links", [])
            if link.get("rel") in ("approve", "payer-action")
        ),
        None,
    )
    if not approve_link:
        raise PayPalAPIError("PayPal order did not include an approval URL")
    return {"order_id": data["id"], "approve_url": approve_link}


async def capture_order(order_id: str) -> dict:
    token = await _get_access_token()
    response = await _request(
        "POST",
        f"/v2/checkout/orders/{order_id}/capture",
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "PayPal-Request-Id": f"capture-{order_id}",
        },
        json={},
    )
    return response.json()


async def get_order_details(order_id: str) -> dict:
    token = await _get_access_token()
    response = await _request(
        "GET",
        f"/v2/checkout/orders/{order_id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    return response.json()


async def create_subscription(
    plan_id: str,
    user_id: int,
    return_url: str,
    cancel_url: str,
    start_time: str | None = None,
) -> dict:
    token = await _get_access_token()
    payload = {
        "plan_id": plan_id,
        "custom_id": str(user_id),
        "application_context": {
            "brand_name": "Smart Tool Matrix",
            "shipping_preference": "NO_SHIPPING",
            "user_action": "SUBSCRIBE_NOW",
            "return_url": return_url,
            "cancel_url": cancel_url,
        },
    }
    if start_time:
        payload["start_time"] = start_time
    response = await _request(
        "POST",
        "/v1/billing/subscriptions",
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "PayPal-Request-Id": str(uuid.uuid4()),
        },
        json=payload,
    )
    data = response.json()
    approve_link = next(
        (
            link["href"]
            for link in data.get("links", [])
            if link.get("rel") == "approve"
        ),
        None,
    )
    if not approve_link:
        raise PayPalAPIError("PayPal subscription did not include an approval URL")
    return {"subscription_id": data["id"], "approve_url": approve_link}


async def get_subscription_details(subscription_id: str) -> dict:
    token = await _get_access_token()
    response = await _request(
        "GET",
        f"/v1/billing/subscriptions/{subscription_id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    return response.json()


async def cancel_subscription(subscription_id: str) -> None:
    token = await _get_access_token()
    await _request(
        "POST",
        f"/v1/billing/subscriptions/{subscription_id}/cancel",
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        },
        json={"reason": "Cancelled by customer"},
    )


async def verify_webhook_signature(headers: dict, event: dict) -> bool:
    if not PAYPAL_WEBHOOK_ID:
        raise PayPalAPIError("PAYPAL_WEBHOOK_ID is not configured")
    token = await _get_access_token()
    response = await _request(
        "POST",
        "/v1/notifications/verify-webhook-signature",
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        },
        json={
            "auth_algo": headers.get("paypal-auth-algo", ""),
            "cert_url": headers.get("paypal-cert-url", ""),
            "transmission_id": headers.get("paypal-transmission-id", ""),
            "transmission_sig": headers.get("paypal-transmission-sig", ""),
            "transmission_time": headers.get("paypal-transmission-time", ""),
            "webhook_id": PAYPAL_WEBHOOK_ID,
            "webhook_event": event,
        },
    )
    return response.json().get("verification_status") == "SUCCESS"
