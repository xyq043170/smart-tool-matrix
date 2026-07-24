import datetime
import hashlib
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from psycopg import AsyncConnection

from src.config import settings
from src.models import User


def _quota_timezone() -> datetime.tzinfo:
    try:
        return ZoneInfo(settings.daily_quota_timezone)
    except ZoneInfoNotFoundError:
        return datetime.timezone.utc


def _quota_date() -> datetime.date:
    return datetime.datetime.now(_quota_timezone()).date()


def _user_identity(user_id: int) -> tuple[str, int]:
    return (
        f"{settings.project_name}:daily:user:{user_id}",
        settings.daily_free_limit_user,
    )


def _quota_identity(user: User | None, real_ip: str) -> tuple[str, int]:
    if user:
        return _user_identity(user.user_id)
    visitor_hash = hashlib.sha256(
        f"{settings.jwt_secret}:{real_ip}".encode("utf-8")
    ).hexdigest()[:32]
    return (
        f"{settings.project_name}:daily:guest:{visitor_hash}",
        settings.daily_free_limit_guest,
    )


async def _get_usage(db: AsyncConnection, identity_key: str, limit: int) -> dict:
    cursor = await db.execute(
        "SELECT usage_count FROM daily_usage WHERE identity_key = %s AND usage_date = %s",
        (identity_key, _quota_date()),
    )
    row = await cursor.fetchone()
    used = int(row["usage_count"]) if row else 0
    return {
        "allowed": used < limit,
        "used": used,
        "limit": limit,
        "remaining": max(0, limit - used),
    }


async def _consume_usage(db: AsyncConnection, identity_key: str, limit: int) -> dict:
    if limit <= 0:
        return {"allowed": False, "used": 0, "limit": limit, "remaining": 0}
    cursor = await db.execute(
        """
        INSERT INTO daily_usage (identity_key, usage_date, usage_count)
        VALUES (%s, %s, 1)
        ON CONFLICT (identity_key, usage_date) DO UPDATE
        SET usage_count = daily_usage.usage_count + 1, updated_at = NOW()
        WHERE daily_usage.usage_count < %s
        RETURNING usage_count
        """,
        (identity_key, _quota_date(), limit),
    )
    row = await cursor.fetchone()
    if row:
        used = int(row["usage_count"])
        await db.commit()
        return {
            "allowed": True,
            "used": used,
            "limit": limit,
            "remaining": max(0, limit - used),
        }

    # The conditional ON CONFLICT update returns no row once the limit is reached.
    usage = await _get_usage(db, identity_key, limit)
    await db.commit()
    return usage


async def get_daily_usage(
    db: AsyncConnection, user: User | None, real_ip: str
) -> dict:
    identity_key, limit = _quota_identity(user, real_ip)
    return await _get_usage(db, identity_key, limit)


async def consume_daily_quota(
    db: AsyncConnection, user: User | None, real_ip: str
) -> dict:
    identity_key, limit = _quota_identity(user, real_ip)
    return await _consume_usage(db, identity_key, limit)


async def get_user_daily_usage(db: AsyncConnection, user_id: int) -> dict:
    identity_key, limit = _user_identity(user_id)
    return await _get_usage(db, identity_key, limit)


async def consume_user_daily_quota(db: AsyncConnection, user_id: int) -> dict:
    identity_key, limit = _user_identity(user_id)
    return await _consume_usage(db, identity_key, limit)
