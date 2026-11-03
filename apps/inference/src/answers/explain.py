from src.answers.context import PreparedAnswer
from src.articles.repository import get_article_repository
from src.config import get_config
from src.errors import NotFoundError

_INSTRUCTIONS = (
    "Explain this news story in a short paragraph. "
    "Cite a stored article with [[cite:ARTICLE_ID]] and use only ids from the list."
)


async def load_explanation(article_id: str) -> PreparedAnswer:
    repository = get_article_repository()
    article = await repository.find_by_id(article_id)
    if article is None:
        raise NotFoundError("Article not found")
    rows = [article]
    if article.story_id is not None:
        others = await repository.list_by_story_id(
            article.story_id,
            get_config().brief_article_cap - 1,
            article.id,
        )
        rows.extend(others)
    return PreparedAnswer(rows=rows, instructions=_INSTRUCTIONS)
