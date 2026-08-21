import datetime
import logging
from decimal import Decimal

from psycopg import AsyncConnection

from src.quota import get_user_daily_usage, consume_user_daily_quota

_logger = logging.getLogger(__name__)

PLANS = [
    {"id": "daily", "name": "Day Pass", "duration_days": 1, "price_usd": 0.99},
    {"id": "weekly", "name": "Week Pass", "duration_days": 7, "price_usd": 4.99},
    {"id": "monthly", "name": "Monthly", "duration_days": 30, "price_usd": 9.99},
    {"id": "yearly", "name": "Yearly", "duration_days": 365, "price_usd": 59.99},
    {
        "id": "lifetime",
        "name": "Lifetime Access",
        "duration_days": None,
        "price_usd": 79.00,
    },
]

def _as_datetime(value) -> datetime.datetime | None:
    if not value:
        return None
    if isinstance(value, datetime.datetime):
        parsed = value
    else:
        parsed = datetime.datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=datetime.timezone.utc)
    return parsed


async def get_subscription_status(db: AsyncConnection, user_id: int) -> dict:
    await db.execute(
        "UPDATE subscriptions SET status = 'expired', updated_at = NOW() "
        "WHERE user_id = %s AND status IN ('active', 'scheduled', 'cancelled', 'suspended') "
        "AND current_period_end IS NOT NULL AND current_period_end <= NOW()",
        (user_id,),
    )
    cursor = await db.execute(
        "SELECT id FROM subscriptions WHERE user_id = %s "
        "AND status IN ('active', 'scheduled', 'cancelled', 'suspended') "
        "AND current_period_start <= NOW() "
        "AND (current_period_end IS NULL OR current_period_end > NOW()) "
        "LIMIT 1",
        (user_id,),
    )
    current = await cursor.fetchone()
    if not current:
        cursor = await db.execute(
            "SELECT plan_id, current_period_start FROM subscriptions "
            "WHERE user_id = %s AND billing_type = 'recurring' "
            "AND status IN ('approval_pending', 'scheduled') AND cancelled_at IS NULL "
            "ORDER BY created_at DESC LIMIT 1",
            (user_id,),
        )
        upcoming = await cursor.fetchone()
        await db.commit()
        return {
            "status": "none",
            "plan_id": None,
            "period_end": None,
            "billing_type": None,
            "auto_renew": False,
            "scheduled_auto_renew": bool(upcoming),
            "scheduled_plan_id": upcoming["plan_id"] if upcoming else None,
            "scheduled_start": (
                upcoming["current_period_start"].isoformat()
                if upcoming and hasattr(upcoming["current_period_start"], "isoformat")
                else (upcoming["current_period_start"] if upcoming else None)
            ),
        }

    cursor = await db.execute(
        "SELECT * FROM subscriptions WHERE user_id = %s "
        "AND status IN ('active', 'scheduled', 'cancelled', 'suspended') "
        "AND current_period_start <= NOW() "
        "AND (current_period_end IS NULL OR current_period_end > NOW()) "
        "ORDER BY current_period_end DESC, id DESC LIMIT 1",
        (user_id,),
    )
    row = await cursor.fetchone()
    if not row:
        return {"status": "none", "plan_id": None, "period_end": None}
    subscription = dict(row)
    cursor = await db.execute(
        "SELECT plan_id, current_period_start FROM subscriptions "
        "WHERE user_id = %s AND billing_type = 'recurring' "
        "AND status IN ('approval_pending', 'scheduled') AND cancelled_at IS NULL "
        "AND (current_period_start IS NULL OR current_period_start > NOW()) "
        "ORDER BY created_at DESC LIMIT 1",
        (user_id,),
    )
    upcoming = await cursor.fetchone()
    period_end = subscription["current_period_end"]
    if subscription.get("billing_type", "one_time") == "one_time":
        # One-time passes are stored as consecutive active/scheduled rows. Show
        # the end of the full paid-through chain, not merely the end of the row
        # that happens to be active right now.
        cursor = await db.execute(
            "SELECT MAX(current_period_end) AS paid_through "
            "FROM subscriptions WHERE user_id = %s "
            "AND billing_type = 'one_time' "
            "AND status IN ('active', 'scheduled', 'cancelled', 'suspended') "
            "AND current_period_end > NOW()",
            (user_id,),
        )
        paid_through = await cursor.fetchone()
        if paid_through and paid_through["paid_through"]:
            period_end = paid_through["paid_through"]
    await db.commit()
    return {
        "status": "active",
        "plan_id": subscription["plan_id"],
        "period_end": (
            period_end.isoformat() if hasattr(period_end, "isoformat") else period_end
        ),
        "billing_type": subscription.get("billing_type", "one_time"),
        "auto_renew": (
            subscription.get("billing_type") == "recurring"
            and subscription.get("status") in ("active", "scheduled")
            and not subscription.get("cancelled_at")
        ),
        "provider_status": subscription.get("provider_status"),
        "scheduled_auto_renew": bool(upcoming),
        "scheduled_plan_id": upcoming["plan_id"] if upcoming else None,
        "scheduled_start": (
            upcoming["current_period_start"].isoformat()
            if upcoming and hasattr(upcoming["current_period_start"], "isoformat")
            else (upcoming["current_period_start"] if upcoming else None)
        ),
    }


async def sync_recurring_subscription(
    db: AsyncConnection,
    user_id: int,
    subscription_id: str,
    plan_id: str,
    details: dict,
    commit: bool = True,
) -> dict:
    """Synchronize a PayPal subscription while preserving the paid-through date."""
    cursor = await db.execute(
        "SELECT user_id, current_period_start, current_period_end, cancelled_at "
        "FROM subscriptions WHERE paypal_subscription_id = %s LIMIT 1",
        (subscription_id,),
    )
    existing = await cursor.fetchone()
    if existing and int(existing["user_id"]) != int(user_id):
        raise ValueError("Subscription belongs to another user")

    provider_status = str(details.get("status") or "APPROVAL_PENDING").upper()
    status_map = {
        "APPROVAL_PENDING": "approval_pending",
        "APPROVED": "approval_pending",
        "ACTIVE": "active",
        "SUSPENDED": "suspended",
        "CANCELLED": "cancelled",
        "EXPIRED": "expired",
    }
    local_status = status_map.get(provider_status, "approval_pending")
    billing_info = details.get("billing_info") or {}
    last_payment = billing_info.get("last_payment") or {}
    starts_at = (
        _as_datetime(last_payment.get("time"))
        or _as_datetime(details.get("start_time"))
        or (existing and _as_datetime(existing["current_period_start"]))
    )
    ends_at = (
        _as_datetime(billing_info.get("next_billing_time"))
        or (existing and _as_datetime(existing["current_period_end"]))
    )
    if provider_status == "APPROVED" and starts_at:
        now = datetime.datetime.now(datetime.timezone.utc)
        if starts_at > now:
            local_status = "scheduled"
            if ends_at and ends_at <= starts_at:
                # Before the first charge, PayPal reports the start as the next
                # billing time. It is not the end of the first paid period.
                ends_at = None
    if local_status == "active" and not ends_at:
        plan = next((item for item in PLANS if item["id"] == plan_id), None)
        if not plan:
            raise ValueError("Unknown subscription plan")
        starts_at = starts_at or datetime.datetime.now(datetime.timezone.utc)
        ends_at = starts_at + datetime.timedelta(days=plan["duration_days"])
    elif local_status == "scheduled" and starts_at and not ends_at:
        plan = next((item for item in PLANS if item["id"] == plan_id), None)
        if not plan:
            raise ValueError("Unknown subscription plan")
        ends_at = starts_at + datetime.timedelta(days=plan["duration_days"])

    cancelled_at = None
    if local_status == "cancelled":
        cancelled_at = (
            _as_datetime(details.get("status_update_time"))
            or datetime.datetime.now(datetime.timezone.utc)
        )
    elif existing:
        cancelled_at = existing["cancelled_at"]

    await db.execute(
        "INSERT INTO subscriptions "
        "(user_id, paypal_subscription_id, plan_id, status, billing_type, "
        "provider_status, current_period_start, current_period_end, cancelled_at) "
        "VALUES (%s, %s, %s, %s, 'recurring', %s, %s, %s, %s) "
        "ON CONFLICT (paypal_subscription_id) DO UPDATE SET "
        "plan_id = EXCLUDED.plan_id, status = EXCLUDED.status, "
        "billing_type = 'recurring', provider_status = EXCLUDED.provider_status, "
        "current_period_start = COALESCE(EXCLUDED.current_period_start, "
        "subscriptions.current_period_start), "
        "current_period_end = COALESCE(EXCLUDED.current_period_end, "
        "subscriptions.current_period_end), "
        "cancelled_at = COALESCE(EXCLUDED.cancelled_at, subscriptions.cancelled_at), "
        "updated_at = NOW()",
        (
            user_id,
            subscription_id,
            plan_id,
            local_status,
            provider_status,
            starts_at,
            ends_at,
            cancelled_at,
        ),
    )
    if commit:
        await db.commit()
    return {
        "subscription_id": subscription_id,
        "plan_id": plan_id,
        "status": local_status,
        "period_start": starts_at.isoformat() if starts_at else None,
        "period_end": ends_at.isoformat() if ends_at else None,
        "auto_renew": local_status in ("active", "scheduled") and not cancelled_at,
    }


async def get_recurring_subscription(
    db: AsyncConnection, user_id: int
) -> dict | None:
    cursor = await db.execute(
        "SELECT * FROM subscriptions WHERE user_id = %s "
        "AND billing_type = 'recurring' "
        "AND status IN ('approval_pending', 'scheduled', 'active', 'suspended', 'cancelled') "
        "ORDER BY created_at DESC LIMIT 1",
        (user_id,),
    )
    row = await cursor.fetchone()
    return dict(row) if row else None


async def mark_recurring_cancelled(
    db: AsyncConnection, user_id: int, subscription_id: str
) -> None:
    await db.execute(
        "UPDATE subscriptions SET status = 'cancelled', provider_status = 'CANCELLED', "
        "cancelled_at = COALESCE(cancelled_at, NOW()), updated_at = NOW() "
        "WHERE user_id = %s AND paypal_subscription_id = %s",
        (user_id, subscription_id),
    )
    await db.commit()


async def check_daily_usage(db: AsyncConnection, user_id: int) -> dict:
    return await get_user_daily_usage(db, user_id)


async def consume_usage(db: AsyncConnection, user_id: int) -> bool:
    usage = await consume_user_daily_quota(db, user_id)
    return usage["allowed"]


async def create_access_pass(
    db: AsyncConnection,
    user_id: int,
    paypal_order_id: str,
    paypal_capture_id: str,
    plan_id: str,
    duration_days: int | None,
    commit: bool = True,
) -> dict:
    """Activate a one-time access pass, extending any remaining paid time."""
    cursor = await db.execute(
        "SELECT current_period_end FROM subscriptions "
        "WHERE user_id = %s "
        "AND status IN ('active', 'scheduled', 'cancelled', 'suspended') "
        "AND current_period_end > NOW() "
        "ORDER BY current_period_end DESC NULLS LAST LIMIT 1 FOR UPDATE",
        (user_id,),
    )
    row = await cursor.fetchone()
    now = datetime.datetime.now(datetime.timezone.utc)
    starts_at = now
    if row and row["current_period_end"]:
        current_end = row["current_period_end"]
        if isinstance(current_end, str):
            current_end = datetime.datetime.fromisoformat(current_end)
        if current_end.tzinfo is None:
            current_end = current_end.replace(tzinfo=datetime.timezone.utc)
        if current_end > starts_at:
            starts_at = current_end
    ends_at = (
        starts_at + datetime.timedelta(days=duration_days)
        if duration_days is not None
        else None
    )
    status = "scheduled" if starts_at > now else "active"

    cursor = await db.execute(
        "INSERT INTO subscriptions "
        "(user_id, paypal_order_id, plan_id, status, current_period_start, "
        "current_period_end) "
        "VALUES (%s, %s, %s, %s, %s, %s) "
        "ON CONFLICT (paypal_order_id) DO NOTHING "
        "RETURNING id, current_period_start, current_period_end",
        (user_id, paypal_order_id, plan_id, status, starts_at, ends_at),
    )
    inserted = await cursor.fetchone()
    if not inserted:
        cursor = await db.execute(
            "SELECT id, current_period_start, current_period_end FROM subscriptions "
            "WHERE paypal_order_id = %s AND user_id = %s",
            (paypal_order_id, user_id),
        )
        inserted = await cursor.fetchone()
        if not inserted:
            if commit:
                await db.rollback()
            raise RuntimeError("Paid order could not be activated")

    await db.execute(
        "UPDATE orders SET status = 'completed', paypal_capture_id = %s, "
        "completed_at = COALESCE(completed_at, NOW()), updated_at = NOW() "
        "WHERE paypal_order_id = %s AND user_id = %s",
        (paypal_capture_id, paypal_order_id, user_id),
    )
    if commit:
        await db.commit()
    actual_start = inserted["current_period_start"]
    actual_end = inserted["current_period_end"]
    return {
        "subscription_id": int(inserted["id"]),
        "plan_id": plan_id,
        "period_start": (
            actual_start.isoformat()
            if hasattr(actual_start, "isoformat")
            else actual_start
        ),
        "period_end": (
            actual_end.isoformat() if hasattr(actual_end, "isoformat") else actual_end
        ),
    }


async def revoke_access_pass(
    db: AsyncConnection,
    paypal_order_id: str,
    order_status: str,
    commit: bool = True,
) -> None:
    await db.execute(
        "UPDATE subscriptions SET status = 'revoked', current_period_end = "
        "LEAST(current_period_end, NOW()), updated_at = NOW() "
        "WHERE paypal_order_id = %s AND status IN ('active', 'scheduled')",
        (paypal_order_id,),
    )
    await db.execute(
        "UPDATE orders SET status = %s, updated_at = NOW() "
        "WHERE paypal_order_id = %s",
        (order_status, paypal_order_id),
    )
    if commit:
        await db.commit()


async def record_refund(
    db: AsyncConnection,
    paypal_order_id: str,
    refund_amount: Decimal,
    commit: bool = True,
) -> bool:
    cursor = await db.execute(
        "UPDATE orders SET refunded_amount_usd = refunded_amount_usd + %s, "
        "updated_at = NOW() WHERE paypal_order_id = %s "
        "RETURNING amount_usd, refunded_amount_usd",
        (refund_amount, paypal_order_id),
    )
    row = await cursor.fetchone()
    if not row:
        return False
    fully_refunded = Decimal(str(row["refunded_amount_usd"])) >= Decimal(
        str(row["amount_usd"])
    )
    status = "refunded" if fully_refunded else "partially_refunded"
    await db.execute(
        "UPDATE orders SET status = %s, updated_at = NOW() "
        "WHERE paypal_order_id = %s",
        (status, paypal_order_id),
    )
    if fully_refunded:
        await db.execute(
            "UPDATE subscriptions SET status = 'revoked', current_period_end = "
            "LEAST(current_period_end, NOW()), updated_at = NOW() "
            "WHERE paypal_order_id = %s AND status IN ('active', 'scheduled')",
            (paypal_order_id,),
        )
    if commit:
        await db.commit()
    return fully_refunded


async def record_webhook_event(
    db: AsyncConnection, event_id: str, event_type: str
) -> bool:
    cursor = await db.execute(
        "INSERT INTO paypal_webhook_events (event_id, event_type) VALUES (%s, %s) "
        "ON CONFLICT (event_id) DO NOTHING RETURNING event_id",
        (event_id, event_type),
    )
    return bool(await cursor.fetchone())


async def complete_webhook_event(db: AsyncConnection, event_id: str) -> None:
    await db.execute(
        "UPDATE paypal_webhook_events SET status = 'processed', processed_at = NOW() "
        "WHERE event_id = %s",
        (event_id,),
    )
