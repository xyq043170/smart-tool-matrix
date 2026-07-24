from collections.abc import AsyncGenerator

from psycopg import AsyncConnection
from psycopg.rows import dict_row

from src.config import settings


async def open_database() -> AsyncConnection:
    if not settings.database_url:
        raise RuntimeError("DATABASE_URL is required. Add the Neon PostgreSQL connection string.")
    return await AsyncConnection.connect(
        settings.database_url,
        row_factory=dict_row,
        connect_timeout=10,
    )


async def get_db() -> AsyncGenerator[AsyncConnection, None]:
    """Open one Neon PostgreSQL connection for the current API request."""
    db = await open_database()
    try:
        yield db
    except Exception:
        await db.rollback()
        raise
    finally:
        await db.close()
