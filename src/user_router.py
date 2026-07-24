import logging

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from psycopg import AsyncConnection

from src.config import settings
from src.models import SettingsInfo, User
from src.user import get_user
from src.database import get_db
from src.limiter import get_real_ipaddr
from src.quota import get_daily_usage
from src.quota import consume_daily_quota
from src.subscription.service import get_subscription_status

router = APIRouter()
_logger = logging.getLogger(__name__)


@router.get("/api/v1/settings", tags=["User"])
async def info(
    request: Request,
    user: Optional[User] = Depends(get_user),
    db: AsyncConnection = Depends(get_db),
):
    subscription = (
        await get_subscription_status(db, user.user_id)
        if user
        else {"status": "none", "plan_id": None, "period_end": None}
    )
    usage = await get_daily_usage(db, user, get_real_ipaddr(request))
    return SettingsInfo(
        login_type=user.login_type if user else "",
        user_name=user.user_name if user else "",
        ad_client=settings.ad_client,
        ad_slot=settings.ad_slot,
        rate_limit=settings.get_human_rate_limit(),
        user_rate_limit=settings.get_human_user_rate_limit(),
        enable_login=True,
        google_client_id=settings.google_client_id,
        enable_rate_limit=settings.enable_rate_limit,
        default_api_base=settings.default_api_base,
        default_model=settings.default_model,
        purchase_url=settings.purchase_url,
        subscription_status=subscription["status"],
        subscription_plan=subscription.get("plan_id"),
        subscription_end=subscription.get("period_end"),
        subscription_billing_type=subscription.get("billing_type"),
        subscription_auto_renew=subscription.get("auto_renew", False),
        subscription_scheduled_auto_renew=subscription.get(
            "scheduled_auto_renew", False
        ),
        subscription_scheduled_plan=subscription.get("scheduled_plan_id"),
        subscription_scheduled_start=subscription.get("scheduled_start"),
        daily_usage=usage["used"],
        daily_limit=usage["limit"],
        daily_remaining=usage["remaining"],
    )


@router.post("/api/v1/quota/consume", tags=["User"])
async def consume_tool_quota(
    request: Request,
    user: Optional[User] = Depends(get_user),
    db: AsyncConnection = Depends(get_db),
):
    if user:
        subscription = await get_subscription_status(db, user.user_id)
        if subscription["status"] == "active":
            return {"allowed": True, "subscribed": True}

    usage = await consume_daily_quota(db, user, get_real_ipaddr(request))
    if not usage["allowed"]:
        raise HTTPException(
            status_code=403,
            detail={"code": "daily_limit_reached", **usage},
        )
    return {**usage, "subscribed": False}
