import logging

from src.database.connection import open_database

_logger = logging.getLogger(__name__)

SCHEMA = (
"""
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    login_type TEXT NOT NULL,
    google_id TEXT UNIQUE,
    display_name TEXT,
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
)
""",
"""
CREATE TABLE IF NOT EXISTS verification_tokens (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used BOOLEAN NOT NULL DEFAULT FALSE
)
""",
"""
CREATE TABLE IF NOT EXISTS credits (
    user_id BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    balance INTEGER NOT NULL DEFAULT 0,
    total_purchased INTEGER NOT NULL DEFAULT 0,
    total_consumed INTEGER NOT NULL DEFAULT 0
)
""",
"""
CREATE TABLE IF NOT EXISTS credit_transactions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    type TEXT NOT NULL,
    description TEXT,
    paypal_order_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
)
""",
"""
CREATE TABLE IF NOT EXISTS orders (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    paypal_order_id TEXT UNIQUE,
    package_id TEXT NOT NULL,
    amount_usd REAL NOT NULL,
    credits INTEGER NOT NULL,
    status TEXT DEFAULT 'pending',
    paypal_capture_id TEXT,
    refunded_amount_usd NUMERIC(12, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
)
""",
"""
CREATE TABLE IF NOT EXISTS subscriptions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    paypal_subscription_id TEXT UNIQUE,
    paypal_order_id TEXT UNIQUE,
    plan_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    billing_type TEXT NOT NULL DEFAULT 'one_time',
    provider_status TEXT,
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
)
""",
"""
CREATE TABLE IF NOT EXISTS daily_usage (
    identity_key TEXT NOT NULL,
    usage_date DATE NOT NULL,
    usage_count INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY(identity_key, usage_date)
)
""",
"""
CREATE TABLE IF NOT EXISTS paypal_webhook_events (
    event_id TEXT PRIMARY KEY,
    event_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'processing',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ
)
""",
"CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status ON subscriptions(user_id, status)",
"ALTER TABLE subscriptions ALTER COLUMN paypal_subscription_id DROP NOT NULL",
"ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS paypal_order_id TEXT",
"ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS billing_type TEXT NOT NULL DEFAULT 'one_time'",
"ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS provider_status TEXT",
"CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_paypal_order ON subscriptions(paypal_order_id)",
"ALTER TABLE orders ADD COLUMN IF NOT EXISTS paypal_capture_id TEXT",
"ALTER TABLE orders ADD COLUMN IF NOT EXISTS refunded_amount_usd NUMERIC(12, 2) NOT NULL DEFAULT 0",
"ALTER TABLE orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()",
"CREATE INDEX IF NOT EXISTS idx_daily_usage_date ON daily_usage(usage_date)",
)


async def run_migrations():
    """Create the Neon PostgreSQL schema safely on startup."""
    _logger.info("Running Neon PostgreSQL migrations")
    db = await open_database()
    try:
        for statement in SCHEMA:
            await db.execute(statement)
        await db.commit()
    finally:
        await db.close()
    _logger.info("Neon PostgreSQL migrations complete")
