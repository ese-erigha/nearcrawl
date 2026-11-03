from src.answers.context import PreparedAnswer
from src.articles.repository import BBox, get_article_repository
from src.config import get_config
from src.geocode import geocode_place

_JOINER = " in "
_INSTRUCTIONS = (
    "Answer the search from the stored articles. "
    "Cite a stored article with [[cite:ARTICLE_ID]] and use only ids from the list."
)


def split_place_and_topic(query: str) -> tuple[str | None, str]:
    index = query.lower().rfind(_JOINER)
    if index == -1:
        return query, ""
    place = query[index + len(_JOINER) :].strip()
    topic = query[:index].strip()
    if place == "":
        return None, query
    return place, topic


async def load_search(query: str) -> PreparedAnswer:
    place, topic = split_place_and_topic(query)
    box = await _box_for(place)
    topic_arg = _topic_arg(topic, box, query)
    if box is None and topic_arg is None:
        return PreparedAnswer(rows=[], instructions="")
    rows = await get_article_repository().list_for_search(
        box,
        topic_arg,
        get_config().brief_article_cap,
    )
    if not rows:
        return PreparedAnswer(rows=[], instructions="")
    return PreparedAnswer(rows=rows, instructions=_INSTRUCTIONS)


async def _box_for(place: str | None) -> BBox | None:
    if place is None:
        return None
    return await geocode_place(place)


def _topic_arg(topic: str, box: BBox | None, query: str) -> str | None:
    if box is None:
        return query
    if topic == "":
        return None
    return topic
