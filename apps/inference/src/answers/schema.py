from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator


class ExplanationBody(BaseModel):
    model_config = ConfigDict(extra="forbid", populate_by_name=True)
    article_id: UUID = Field(alias="articleId")


class ComparisonBody(BaseModel):
    model_config = ConfigDict(extra="forbid", populate_by_name=True)
    story_id: str = Field(alias="storyId")

    @field_validator("story_id")
    @classmethod
    def reject_uuid(cls, value: str) -> str:
        text = value.strip()
        if text == "":
            raise ValueError("storyId is required")
        try:
            UUID(text)
        except ValueError:
            return text
        raise ValueError("storyId must not be a uuid")


class BriefStoryBody(BaseModel):
    model_config = ConfigDict(extra="forbid", populate_by_name=True)
    title: str = Field(min_length=1, max_length=500)
    source_name: str = Field(alias="sourceName", min_length=1, max_length=200)
    description: str = Field(default="", max_length=500)


class BriefSummaryBody(BaseModel):
    model_config = ConfigDict(extra="forbid")
    stories: list[BriefStoryBody] = Field(min_length=1, max_length=20)


class SearchBody(BaseModel):
    model_config = ConfigDict(extra="forbid")
    query: str = Field(min_length=1, max_length=500)

    @field_validator("query", mode="before")
    @classmethod
    def trim_query(cls, value: object) -> object:
        if isinstance(value, str):
            return value.strip()
        return value
