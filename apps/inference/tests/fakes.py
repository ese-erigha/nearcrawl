from dataclasses import dataclass, field, replace
from datetime import UTC, datetime

from src.articles.repository import ArticleRecord, BBox

UNKNOWN_ARTICLE_ID = "00000000-0000-4000-8000-000000000099"


def make_article(**overrides: object) -> ArticleRecord:
    row = ArticleRecord(
        id="11111111-1111-4111-8111-111111111111",
        title="Ports slow",
        description="Ships wait",
        body="Body text " * 50,
        source_name="Harbor Desk",
        source_country_code="JP",
        published_at=datetime(2026, 11, 1, tzinfo=UTC),
        source_url="https://example.com/ports",
        story_id="story-ports",
    )
    return replace(row, **overrides)


@dataclass
class FakeArticles:
    articles: dict[str, ArticleRecord] = field(default_factory=dict)
    stories: dict[str, list[ArticleRecord]] = field(default_factory=dict)
    search_calls: list[tuple[BBox | None, str | None, int]] = field(default_factory=list)
    search_rows: list[ArticleRecord] = field(default_factory=list)

    async def find_by_id(self, article_id: str) -> ArticleRecord | None:
        return self.articles.get(article_id)

    async def list_by_story_id(
        self,
        story_id: str,
        limit: int,
        exclude_id: str | None,
    ) -> list[ArticleRecord]:
        rows = [row for row in self.stories.get(story_id, []) if row.id != exclude_id]
        return rows[:limit]

    async def list_for_search(
        self,
        box: BBox | None,
        topic: str | None,
        limit: int,
    ) -> list[ArticleRecord]:
        self.search_calls.append((box, topic, limit))
        return self.search_rows[:limit]
