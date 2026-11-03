from dataclasses import dataclass

from src.articles.repository import ArticleRecord
from src.config import get_config


@dataclass(frozen=True)
class PreparedAnswer:
    rows: list[ArticleRecord]
    instructions: str


def articles_for_model(rows: list[ArticleRecord]) -> list[dict[str, object]]:
    limit = get_config().brief_body_chars
    return [_article_for_model(row, limit) for row in rows]


def _article_for_model(row: ArticleRecord, body_limit: int) -> dict[str, object]:
    return {
        "id": row.id,
        "title": row.title,
        "description": row.description,
        "body": row.body[:body_limit],
        "sourceName": row.source_name,
        "sourceCountryCode": row.source_country_code,
        "publishedAt": row.published_at.isoformat(),
        "sourceUrl": row.source_url,
    }
