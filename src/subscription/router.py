import logging
from decimal import Decimal, InvalidOperation
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from psycopg import AsyncConnection

from src.auth.service import decode_jwt
from src.config import settings as app_settings
from src.database import get_db
from src.subscription import paypal
from src.subscription.service import (
    PLANS,
    check_daily_usage,
    complete_webhook_event,
    consume_usage,
    create_access_pass,
    get_recurring_subscription,
    get_subscription_status,
    mark_recurring_cancelled,
    record_refund,
    record_webhook_event,
    revoke_access_pass,
    sync_recurring_subscription,
)

router = APIRouter(prefix="/api/v1", tags=["Subscription"])
_logger = logging.getLogger(__name__)


def _get_user_id(request: Request) -> int:
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    payload = decode_jwt(auth_header[7:])
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    return payload["user_id"]


def _get_plan(plan_id: str) -> dict | None:
    return next((plan for plan in PLANS if plan["id"] == plan_id), None)


def _get_local_plan_id(paypal_plan_id: str) -> str | None:
    return next(
        (
            local_id
            for local_id, remote_id in paypal.PAYPAL_PLAN_IDS.items()
            if remote_id and remote_id == paypal_plan_id
        ),
        None,
    )


@router.get("/subscription/plans")
async def list_plans():
    return PLANS


@router.get("/subscription/status")
async def subscription_status(
    request: Request, db: AsyncConnection = Depends(get_db)
):
    user_id = _get_user_id(request)
    status = await get_subscription_status(db, user_id)
    usage = await check_daily_usage(db, user_id)
    return {**status, "daily_usage": usage}


class CreatePaymentRequest(BaseModel):
    plan_id: str
    billing_type: Literal["one_time", "recurring"] = "one_time"


@router.post("/subscription/create")
async def create_payment(
    body: CreatePaymentRequest,
    request: Request,
    db: AsyncConnection = Depends(get_db),
):
    user_id = _get_user_id(request)
    plan = _get_plan(body.plan_id)
    if not plan:
        raise HTTPException(status_code=400, detail="Invalid plan")
    if not paypal.PAYPAL_CLIENT_ID or not paypal.PAYPAL_CLIENT_SECRET:
        raise HTTPException(
            status_code=503,
            detail={
                "code": "paypal_not_configured",
                "message": "PayPal payment is not configured",
            },
        )

    app_url = (app_settings.app_url or str(request.base_url)).rstrip("/")
    try:
        if body.billing_type == "recurring":
            paypal_plan_id = paypal.PAYPAL_PLAN_IDS.get(plan["id"], "")
            if not paypal_plan_id:
                raise HTTPException(
                    status_code=503,
                    detail={
                        "code": "paypal_plan_not_configured",
                        "message": "PayPal subscription plan is not configured",
                    },
                )
            existing = await get_recurring_subscription(db, user_id)
            if existing and existing["status"] == "approval_pending":
                existing_id = existing.get("paypal_subscription_id")
                if existing_id:
                    details = await paypal.get_subscription_details(existing_id)
                    if details.get("status") in ("APPROVED", "ACTIVE", "SUSPENDED"):
                        existing_plan_id = _get_local_plan_id(details.get("plan_id", ""))
                        if existing_plan_id:
                            await sync_recurring_subscription(
                                db,
                                user_id,
                                existing_id,
                                existing_plan_id,
                                details,
                            )
                        raise HTTPException(
                            status_code=409,
                            detail={
                                "code": "subscription_exists",
                                "message": "An automatic subscription already exists",
                            },
                        )
                    if details.get("status") != "CANCELLED":
                        await paypal.cancel_subscription(existing_id)
                    await mark_recurring_cancelled(db, user_id, existing_id)
            elif existing and existing["status"] in (
                "scheduled",
                "active",
                "suspended",
            ):
                raise HTTPException(
                    status_code=409,
                    detail={
                        "code": "subscription_exists",
                        "message": "An automatic subscription already exists",
                    },
                )
            current_access = await get_subscription_status(db, user_id)
            start_time = (
                current_access.get("period_end")
                if current_access.get("status") == "active"
                else None
            )
            result = await paypal.create_subscription(
                paypal_plan_id,
                user_id,
                f"{app_url}/subscription?checkout=subscription_return",
                f"{app_url}/subscription?checkout=subscription_cancel",
                start_time=start_time,
            )
            await sync_recurring_subscription(
                db,
                user_id,
                result["subscription_id"],
                plan["id"],
                {"status": "APPROVAL_PENDING"},
            )
            return {**result, "billing_type": "recurring"}

        existing_recurring = await get_recurring_subscription(db, user_id)
        if existing_recurring and existing_recurring["status"] in (
            "approval_pending",
            "scheduled",
            "active",
            "suspended",
        ):
            raise HTTPException(
                status_code=409,
                detail={
                    "code": "subscription_exists",
                    "message": "Cancel the automatic subscription before buying a one-time pass",
                },
            )
        result = await paypal.create_order(
            plan["id"],
            plan["name"],
            plan["price_usd"],
            user_id,
            f"{app_url}/subscription?checkout=return",
            f"{app_url}/subscription?checkout=cancel",
        )
        await db.execute(
            "INSERT INTO orders "
            "(user_id, paypal_order_id, package_id, amount_usd, credits, status) "
            "VALUES (%s, %s, %s, %s, 0, 'pending') "
            "ON CONFLICT (paypal_order_id) DO NOTHING",
            (user_id, result["order_id"], plan["id"], plan["price_usd"]),
        )
        await db.commit()
        return result
    except HTTPException:
        raise
    except paypal.PayPalAPIError:
        _logger.exception("Failed to create PayPal order for plan=%s", body.plan_id)
        raise HTTPException(
            status_code=502,
            detail={
                "code": "paypal_unavailable",
                "message": "PayPal is temporarily unavailable",
            },
        )


class SubscriptionIdRequest(BaseModel):
    subscription_id: str | None = Field(
        default=None,
        min_length=3, max_length=64, pattern=r"^[A-Z0-9-]+$"
    )


@router.post("/subscription/confirm")
async def confirm_subscription(
    body: SubscriptionIdRequest,
    request: Request,
    db: AsyncConnection = Depends(get_db),
):
    user_id = _get_user_id(request)
    subscription_id = body.subscription_id
    if not subscription_id:
        pending = await get_recurring_subscription(db, user_id)
        subscription_id = pending and pending.get("paypal_subscription_id")
    if not subscription_id:
        raise HTTPException(status_code=404, detail="Pending subscription not found")
    try:
        details = await paypal.get_subscription_details(subscription_id)
    except paypal.PayPalAPIError:
        raise HTTPException(
            status_code=502,
            detail={"code": "paypal_unavailable", "message": "PayPal confirmation failed"},
        )
    if str(details.get("custom_id", "")) != str(user_id):
        raise HTTPException(status_code=403, detail="Subscription ownership mismatch")
    plan_id = _get_local_plan_id(details.get("plan_id", ""))
    if not plan_id:
        raise HTTPException(status_code=400, detail="Unknown PayPal subscription plan")
    result = await sync_recurring_subscription(
        db, user_id, subscription_id, plan_id, details
    )
    return {"success": result["status"] in ("active", "scheduled"), **result}


@router.post("/subscription/cancel")
async def cancel_recurring_subscription(
    request: Request, db: AsyncConnection = Depends(get_db)
):
    user_id = _get_user_id(request)
    subscription = await get_recurring_subscription(db, user_id)
    if not subscription or not subscription.get("paypal_subscription_id"):
        raise HTTPException(status_code=404, detail="Automatic subscription not found")
    if subscription["status"] == "cancelled":
        return {"success": True, "already_cancelled": True}
    subscription_id = subscription["paypal_subscription_id"]
    try:
        await paypal.cancel_subscription(subscription_id)
    except paypal.PayPalAPIError:
        try:
            details = await paypal.get_subscription_details(subscription_id)
        except paypal.PayPalAPIError:
            raise HTTPException(
                status_code=502,
                detail={"code": "paypal_unavailable", "message": "Unable to cancel subscription"},
            )
        if details.get("status") != "CANCELLED":
            raise HTTPException(
                status_code=502,
                detail={"code": "paypal_unavailable", "message": "Unable to cancel subscription"},
            )
    await mark_recurring_cancelled(db, user_id, subscription_id)
    return {
        "success": True,
        "period_end": (
            subscription["current_period_end"].isoformat()
            if hasattr(subscription.get("current_period_end"), "isoformat")
            else subscription.get("current_period_end")
        ),
    }


class CaptureOrderRequest(BaseModel):
    order_id: str = Field(min_length=10, max_length=64, pattern=r"^[A-Z0-9]+$")


def _captured_payment(capture: dict) -> tuple[str, Decimal, str, str, str]:
    try:
        purchase = capture["purchase_units"][0]
        payment = purchase["payments"]["captures"][0]
        amount = payment["amount"]
        return (
            amount["currency_code"],
            Decimal(amount["value"]),
            purchase.get("reference_id", ""),
            purchase.get("custom_id", ""),
            payment.get("id", ""),
        )
    except (KeyError, IndexError, InvalidOperation, TypeError) as exc:
        raise ValueError("Invalid PayPal capture response") from exc


async def _get_order(
    db: AsyncConnection, order_id: str, user_id: int | None = None
) -> dict | None:
    if user_id is None:
        cursor = await db.execute(
            "SELECT * FROM orders WHERE paypal_order_id = %s LIMIT 1",
            (order_id,),
        )
    else:
        cursor = await db.execute(
            "SELECT * FROM orders WHERE paypal_order_id = %s AND user_id = %s LIMIT 1",
            (order_id, user_id),
        )
    row = await cursor.fetchone()
    return dict(row) if row else None


async def _sync_paypal_subscription(
    db: AsyncConnection, subscription_id: str, details: dict | None = None
) -> bool:
    if not subscription_id:
        return False
    if details is None or not details.get("plan_id"):
        details = await paypal.get_subscription_details(subscription_id)
    plan_id = _get_local_plan_id(details.get("plan_id", ""))
    if not plan_id:
        _logger.warning(
            "Ignoring PayPal subscription with unknown plan: subscription=%s plan=%s",
            subscription_id,
            details.get("plan_id"),
        )
        return False
    cursor = await db.execute(
        "SELECT user_id FROM subscriptions WHERE paypal_subscription_id = %s LIMIT 1",
        (subscription_id,),
    )
    row = await cursor.fetchone()
    custom_id = details.get("custom_id")
    user_id = int(row["user_id"]) if row else int(custom_id or 0)
    if not user_id or (custom_id and str(custom_id) != str(user_id)):
        raise ValueError("PayPal subscription user mismatch")
    await sync_recurring_subscription(
        db, user_id, subscription_id, plan_id, details, commit=False
    )
    return True


async def _activate_captured_order(
    db: AsyncConnection,
    order: dict,
    capture: dict,
    commit: bool = True,
) -> dict:
    if capture.get("status") != "COMPLETED":
        raise ValueError("Payment is not completed")
    try:
        currency, amount, reference_id, custom_id, capture_id = _captured_payment(
            capture
        )
    except ValueError as exc:
        raise ValueError("Invalid PayPal response") from exc

    expected_amount = Decimal(str(order["amount_usd"])).quantize(Decimal("0.01"))
    if (
        currency != "USD"
        or amount != expected_amount
        or reference_id != order["package_id"]
        or custom_id != str(order["user_id"])
        or not capture_id
    ):
        _logger.error(
            "PayPal capture mismatch order=%s expected=USD %s package=%s user=%s",
            order["paypal_order_id"],
            expected_amount,
            order["package_id"],
            order["user_id"],
        )
        raise ValueError("Payment verification failed")

    plan = _get_plan(order["package_id"])
    if not plan:
        raise ValueError("Invalid order plan")
    return await create_access_pass(
        db,
        order["user_id"],
        order["paypal_order_id"],
        capture_id,
        plan["id"],
        plan["duration_days"],
        commit=commit,
    )


@router.post("/subscription/capture")
async def capture_payment(
    body: CaptureOrderRequest,
    request: Request,
    db: AsyncConnection = Depends(get_db),
):
    user_id = _get_user_id(request)
    order = await _get_order(db, body.order_id, user_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order["status"] == "completed":
        return {"success": True, "already_captured": True}

    try:
        capture = await paypal.capture_order(body.order_id)
    except paypal.PayPalAPIError as capture_exc:
        # The previous capture attempt may have reached PayPal even when our
        # response handling failed. Recover completed orders instead of asking
        # PayPal to capture them a second time.
        try:
            details = await paypal.get_order_details(body.order_id)
        except paypal.PayPalAPIError:
            _logger.exception("Failed to capture PayPal order=%s", body.order_id)
            raise HTTPException(
                status_code=502,
                detail={
                    "code": "paypal_unavailable",
                    "message": "PayPal capture failed",
                },
            ) from capture_exc
        if details.get("status") != "COMPLETED":
            _logger.exception(
                "Failed to capture PayPal order=%s status=%s",
                body.order_id,
                details.get("status"),
                exc_info=capture_exc,
            )
            raise HTTPException(
                status_code=502,
                detail={
                    "code": "paypal_unavailable",
                    "message": "PayPal capture failed",
                },
            ) from capture_exc
        capture = details
    else:
        # PayPal's capture response may omit purchase-unit metadata used by our
        # verification. The order-details response contains the canonical
        # reference_id/custom_id plus the completed capture.
        try:
            details = await paypal.get_order_details(body.order_id)
            if details.get("status") == "COMPLETED":
                capture = details
        except paypal.PayPalAPIError:
            _logger.warning(
                "Unable to refresh captured PayPal order=%s; "
                "validating the capture response",
                body.order_id,
            )

    try:
        access = await _activate_captured_order(db, order, capture)
        return {"success": True, **access}
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.post("/paypal/webhook")
async def paypal_webhook(request: Request, db: AsyncConnection = Depends(get_db)):
    try:
        event = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid webhook JSON")
    try:
        verified = await paypal.verify_webhook_signature(
            {key.lower(): value for key, value in request.headers.items()}, event
        )
    except paypal.PayPalAPIError:
        _logger.exception("Unable to verify PayPal webhook")
        raise HTTPException(status_code=503, detail="Webhook verification unavailable")
    if not verified:
        raise HTTPException(status_code=400, detail="Invalid PayPal webhook signature")

    event_id = event.get("id", "")
    event_type = event.get("event_type", "")
    if not event_id or not event_type:
        raise HTTPException(status_code=400, detail="Invalid PayPal webhook event")
    if not await record_webhook_event(db, event_id, event_type):
        await db.rollback()
        return {"status": "duplicate"}

    try:
        resource = event.get("resource") or {}
        related_ids = (resource.get("supplementary_data") or {}).get(
            "related_ids"
        ) or {}
        order_id = related_ids.get("order_id", "")

        subscription_events = {
            "BILLING.SUBSCRIPTION.CREATED",
            "BILLING.SUBSCRIPTION.ACTIVATED",
            "BILLING.SUBSCRIPTION.UPDATED",
            "BILLING.SUBSCRIPTION.EXPIRED",
            "BILLING.SUBSCRIPTION.CANCELLED",
            "BILLING.SUBSCRIPTION.SUSPENDED",
        }

        if event_type in subscription_events:
            subscription_id = resource.get("id", "")
            await _sync_paypal_subscription(db, subscription_id, resource)

        elif event_type == "BILLING.SUBSCRIPTION.PAYMENT.FAILED":
            subscription_id = resource.get("id", "") or related_ids.get(
                "subscription_id", ""
            )
            if subscription_id:
                await db.execute(
                    "UPDATE subscriptions SET provider_status = 'PAYMENT_FAILED', "
                    "updated_at = NOW() WHERE paypal_subscription_id = %s",
                    (subscription_id,),
                )

        elif event_type == "PAYMENT.SALE.COMPLETED":
            subscription_id = resource.get("billing_agreement_id", "") or related_ids.get(
                "subscription_id", ""
            )
            await _sync_paypal_subscription(db, subscription_id)

        elif event_type in (
            "PAYMENT.SALE.DENIED",
            "PAYMENT.SALE.REFUNDED",
            "PAYMENT.SALE.REVERSED",
        ):
            subscription_id = resource.get("billing_agreement_id", "") or related_ids.get(
                "subscription_id", ""
            )
            if subscription_id:
                provider_status = event_type.rsplit(".", 1)[-1]
                await db.execute(
                    "UPDATE subscriptions SET provider_status = %s, updated_at = NOW() "
                    "WHERE paypal_subscription_id = %s",
                    (provider_status, subscription_id),
                )

        elif event_type == "CHECKOUT.ORDER.APPROVED":
            order_id = resource.get("id", "")
            order = await _get_order(db, order_id)
            if order and order["status"] != "completed":
                capture = await paypal.capture_order(order_id)
                await _activate_captured_order(db, order, capture, commit=False)

        elif event_type == "PAYMENT.CAPTURE.COMPLETED":
            order = await _get_order(db, order_id)
            if order and order["status"] != "completed":
                details = await paypal.get_order_details(order_id)
                await _activate_captured_order(db, order, details, commit=False)

        elif event_type == "PAYMENT.CAPTURE.PENDING":
            await db.execute(
                "UPDATE orders SET status = 'capture_pending', updated_at = NOW() "
                "WHERE paypal_order_id = %s AND status != 'completed'",
                (order_id,),
            )

        elif event_type in (
            "PAYMENT.CAPTURE.DENIED",
            "CHECKOUT.PAYMENT-APPROVAL.REVERSED",
        ):
            order_id = order_id or resource.get("id", "")
            await db.execute(
                "UPDATE orders SET status = %s, updated_at = NOW() "
                "WHERE paypal_order_id = %s AND status != 'completed'",
                (
                    "capture_denied"
                    if event_type == "PAYMENT.CAPTURE.DENIED"
                    else "approval_reversed",
                    order_id,
                ),
            )

        elif event_type == "PAYMENT.CAPTURE.REFUNDED":
            amount = resource.get("amount") or {}
            if amount.get("currency_code") == "USD" and order_id:
                await record_refund(
                    db,
                    order_id,
                    Decimal(amount.get("value", "0")),
                    commit=False,
                )

        elif event_type == "PAYMENT.CAPTURE.REVERSED" and order_id:
            await revoke_access_pass(db, order_id, "reversed", commit=False)

        await complete_webhook_event(db, event_id)
        await db.commit()
        return {"status": "ok"}
    except Exception:
        await db.rollback()
        _logger.exception("Failed to process PayPal webhook event=%s", event_id)
        raise HTTPException(status_code=500, detail="Webhook processing failed")


@router.get("/usage/today")
async def usage_today(request: Request, db: AsyncConnection = Depends(get_db)):
    user_id = _get_user_id(request)
    return await check_daily_usage(db, user_id)


@router.post("/usage/consume")
async def use_once(request: Request, db: AsyncConnection = Depends(get_db)):
    user_id = _get_user_id(request)
    subscription = await get_subscription_status(db, user_id)
    if subscription["status"] == "active":
        return {"allowed": True, "subscribed": True}
    success = await consume_usage(db, user_id)
    if not success:
        raise HTTPException(status_code=403, detail="Daily limit reached")
    return {"allowed": True, "subscribed": False}
