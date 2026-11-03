from dataclasses import dataclass
from datetime import datetime
from typing import Protocol

import asyncpg

from src.config import get_config
from src.db import get_pool
from src.errors import UnavailableError

_COLUMNS = """
    id, title, description, body, source_name, source_country_code,
    published_at, source_url, story_id
"""

_FRESH = """
    is_duplicate = false
    AND published_at >= now() - make_interval(days => $1::int)
"""


@dataclass(frozen=True)
class BBox:
    west: float
    south: float
    east: float
    north: float


@dataclass(frozen=True)
class ArticleRecord:
    id: str
    title: str
    description: str | None
    body: str
    source_name: str
    source_country_code: str | None
    published_at: datetime
    source_url: str
    story_id: str | None


class ArticleRepository(Protocol):
    async def find_by_id(self, article_id: str) -> ArticleRecord | None: ...

    async def list_by_story_id(
        self,
        story_id: str,
        limit: int,
        exclude_id: str | None,
    ) -> list[ArticleRecord]: ...

    async def list_for_search(
        self,
        box: BBox | None,
        topic: str | None,
        limit: int,
    ) -> list[ArticleRecord]: ...


def search_statement(
    box: BBox | None,
    topic: str | None,
    retention_days: int,
    limit: int,
) -> tuple[str, list[object]]:
    args: list[object] = [retention_days]
    clauses = [_FRESH.strip()]
    if box is not None:
        args.extend([box.south, box.north, box.west, box.east])
        south, north, west, east = len(args) - 3, len(args) - 2, len(args) - 1, len(args)
        clauses.append(_box_clause(south, north, west, east))
    order = "published_at DESC, id DESC"
    if topic is not None:
        args.append(topic)
        topic_index = len(args)
        clauses.append(f"search_vector @@ websearch_to_tsquery('english', ${topic_index})")
        order = f"ts_rank(search_vector, websearch_to_tsquery('english', ${topic_index})) DESC"
    args.append(limit)
    statement = f"""
        SELECT {_COLUMNS}
        FROM articles
        WHERE {" AND ".join(clauses)}
        ORDER BY {order}
        LIMIT ${len(args)}
    """
    return statement, args


def _box_clause(south: int, north: int, west: int, east: int) -> str:
    return f"""latitude BETWEEN ${south} AND ${north}
        AND (
          (${west} <= ${east} AND longitude BETWEEN ${west} AND ${east})
          OR (${west} > ${east} AND (longitude >= ${west} OR longitude <= ${east}))
        )"""


class DbArticleRepository:
    async def find_by_id(self, article_id: str) -> ArticleRecord | None:
        statement = f"""
            SELECT {_COLUMNS}
            FROM articles
            WHERE id = $2::uuid
              AND {_FRESH}
        """
        rows = await _fetch(statement, [get_config().feed_retention_days, article_id])
        if not rows:
            return None
        return _record(rows[0])

    async def list_by_story_id(
        self,
        story_id: str,
        limit: int,
        exclude_id: str | None,
    ) -> list[ArticleRecord]:
        statement = f"""
            SELECT {_COLUMNS}
            FROM articles
            WHERE story_id = $2
              AND ($3::uuid IS NULL OR id <> $3::uuid)
              AND {_FRESH}
            ORDER BY published_at DESC, id DESC
            LIMIT $4
        """
        rows = await _fetch(
            statement,
            [get_config().feed_retention_days, story_id, exclude_id, limit],
        )
        return [_record(row) for row in rows]

    async def list_for_search(
        self,
        box: BBox | None,
        topic: str | None,
        limit: int,
    ) -> list[ArticleRecord]:
        statement, args = search_statement(box, topic, get_config().feed_retention_days, limit)
        rows = await _fetch(statement, args)
        return [_record(row) for row in rows]


_repository: ArticleRepository | None = None


def get_article_repository() -> ArticleRepository:
    global _repository
    if _repository is None:
        _repository = DbArticleRepository()
    return _repository


async def _fetch(statement: str, args: list[object]) -> list[asyncpg.Record]:
    try:
        pool = await get_pool()
        async with pool.acquire() as connection:
            return list(await connection.fetch(statement, *args))
    except UnavailableError:
        raise
    except (OSError, asyncpg.PostgresError):
        raise UnavailableError from None


def _record(row: asyncpg.Record) -> ArticleRecord:
    published_at = row["published_at"]
    if not isinstance(published_at, datetime):
        raise UnavailableError
    description = row["description"]
    country = row["source_country_code"]
    story_id = row["story_id"]
    return ArticleRecord(
        id=str(row["id"]),
        title=str(row["title"]),
        description=description if isinstance(description, str) else None,
        body=str(row["body"]),
        source_name=str(row["source_name"]),
        source_country_code=country if isinstance(country, str) else None,
        published_at=published_at,
        source_url=str(row["source_url"]),
        story_id=story_id if isinstance(story_id, str) else None,
    )
