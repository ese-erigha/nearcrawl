from src.answers.context import PreparedAnswer
from src.articles.repository import get_article_repository
from src.config import get_config
from src.errors import NotFoundError

_MIN_SOURCE_COUNTRIES = 2
_INSTRUCTIONS = (
    "Compare how outlets in different countries cover this story. "
    "Cite a stored article with [[cite:ARTICLE_ID]] and use only ids from the list."
)


async def load_comparison(story_id: str) -> PreparedAnswer:
    rows = await get_article_repository().list_by_story_id(
        story_id,
        get_config().brief_article_cap,
        None,
    )
    if not rows:
        raise NotFoundError("Story not found")
    countries = {row.source_country_code for row in rows if row.source_country_code}
    if len(countries) < _MIN_SOURCE_COUNTRIES:
        return PreparedAnswer(rows=[], instructions="")
    return PreparedAnswer(rows=rows, instructions=_INSTRUCTIONS)
