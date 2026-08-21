import asyncio
from datetime import datetime, timezone
import unittest

from src.subscription.service import create_access_pass


class Cursor:
    def __init__(self, row=None):
        self.row = row

    async def fetchone(self):
        return self.row


class Database:
    def __init__(self):
        self.calls = []
        self.rows = [None, {"id": 7, "current_period_start": datetime(2026, 8, 21, tzinfo=timezone.utc), "current_period_end": None}, None]

    async def execute(self, query, params=()):
        self.calls.append((query, params))
        return Cursor(self.rows.pop(0))

    async def commit(self):
        self.committed = True


class LifetimeAccessPassTests(unittest.TestCase):
    def test_lifetime_access_pass_has_no_expiry(self):
        result = asyncio.run(
            create_access_pass(
                Database(),
                user_id=42,
                paypal_order_id="ORDER-123",
                paypal_capture_id="CAPTURE-123",
                plan_id="lifetime",
                duration_days=None,
            )
        )

        self.assertEqual(result["plan_id"], "lifetime")
        self.assertIsNone(result["period_end"])
