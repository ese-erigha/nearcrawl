from src.answers.llm import complete_text
from src.answers.schema import BriefStoryBody

_INSTRUCTIONS = (
    "Summarize these news items in one short paragraph. "
    "Use only the title, the source, and the description. "
    "Leave out dates, story counts, and any detail that is not in the list."
)

_DESCRIPTION_LIMIT = 500


async def summarize_brief(stories: list[BriefStoryBody]) -> str:
    rows = [_story_for_model(story) for story in stories]
    return await complete_text(_INSTRUCTIONS, rows)


def _story_for_model(story: BriefStoryBody) -> dict[str, object]:
    return {
        "title": story.title,
        "sourceName": story.source_name,
        "description": story.description[:_DESCRIPTION_LIMIT],
    }
