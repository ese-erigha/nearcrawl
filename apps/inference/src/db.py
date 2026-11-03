import asyncpg

from src.config import get_config
from src.errors import UnavailableError

_pool: asyncpg.Pool | None = None


async def get_pool() -> asyncpg.Pool:
    global _pool
    if _pool is None:
        _pool = await _open_pool()
    return _pool


async def _open_pool() -> asyncpg.Pool:
    try:
        pool = await asyncpg.create_pool(get_config().database_url, min_size=1, max_size=5)
    except (OSError, asyncpg.PostgresError):
        raise UnavailableError from None
    return pool
