import json
from collections.abc import AsyncIterator

import pytest
from httpx import ASGITransport, AsyncClient

from src.answers import compare, explain, search
from src.answers.llm import CitationChunk, ModelEvent, TokenChunk
from src.articles.repository import BBox
from src.main import app
from tests.fakes import UNKNOWN_ARTICLE_ID, FakeArticles, make_article

SECRET = "test-inference-secret"
EAST_ASIA = BBox(west=90.0, south=-10.0, east=150.0, north=50.0)


@pytest.fixture
async def client() -> AsyncIterator[AsyncClient]:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as http:
        yield http


@pytest.fixture
def articles(monkeypatch: pytest.MonkeyPatch) -> FakeArticles:
    fake = FakeArticles()
    for module in (explain, compare, search):
        monkeypatch.setattr(module, "get_article_repository", lambda fake=fake: fake)
    return fake


@pytest.fixture
def opened(monkeypatch: pytest.MonkeyPatch) -> list[str]:
    calls: list[str] = []

    async def fake_open(
        instructions: str,
        rows: list[dict[str, object]],
    ) -> AsyncIterator[ModelEvent]:
        calls.append(instructions)

        async def generate() -> AsyncIterator[ModelEvent]:
            for row in rows:
                yield TokenChunk(text="Noted ")
                article_id = row["id"]
                if isinstance(article_id, str):
                    yield CitationChunk(article_id=article_id)
            yield CitationChunk(article_id=UNKNOWN_ARTICLE_ID)

        return generate()

    monkeypatch.setattr("src.answers.stream.open_completion", fake_open)
    return calls


def auth() -> dict[str, str]:
    return {"authorization": f"Bearer {SECRET}"}


def parse_events(body: str) -> list[tuple[str, dict[str, object]]]:
    found: list[tuple[str, dict[str, object]]] = []
    for block in body.split("\n\n"):
        if block.strip() == "" or block.startswith(":"):
            continue
        name = ""
        data = ""
        for line in block.split("\n"):
            if line.startswith("event:"):
                name = line.split(":", 1)[1].strip()
            if line.startswith("data:"):
                data = line.split(":", 1)[1].strip()
        payload = json.loads(data)
        assert isinstance(payload, dict)
        found.append((name, payload))
    return found


def citation_ids(body: str) -> set[str]:
    ids: set[str] = set()
    for name, payload in parse_events(body):
        if name == "citation":
            article_id = payload["articleId"]
            assert isinstance(article_id, str)
            ids.add(article_id)
    return ids


async def test_when_the_health_route_is_called_then_the_body_is_ok(client: AsyncClient) -> None:
    response = await client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


async def test_when_the_bearer_secret_is_wrong_then_an_answer_route_returns_401(
    client: AsyncClient,
) -> None:
    response = await client.post(
        "/explanations",
        json={"articleId": "11111111-1111-4111-8111-111111111111"},
        headers={"authorization": "Bearer wrong"},
    )
    assert response.status_code == 401
    assert response.json() == {"error": "Unauthorized"}


async def test_when_the_clicked_article_exists_then_the_explanation_stream_cites_only_that_story(
    client: AsyncClient,
    articles: FakeArticles,
    opened: list[str],
) -> None:
    del opened
    clicked = make_article()
    other = make_article(
        id="22222222-2222-4222-8222-222222222222",
        source_country_code="FR",
        source_url="https://example.com/fr",
    )
    outsider = make_article(id="33333333-3333-4333-8333-333333333333", story_id="story-other")
    articles.articles[clicked.id] = clicked
    articles.stories[clicked.story_id or ""] = [clicked, other]
    articles.stories[outsider.story_id or ""] = [outsider]
    response = await client.post("/explanations", json={"articleId": clicked.id}, headers=auth())
    assert response.status_code == 200
    assert citation_ids(response.text) == {clicked.id, other.id}


async def test_when_the_story_has_one_source_country_then_the_comparison_emits_empty_and_done(
    client: AsyncClient,
    articles: FakeArticles,
    opened: list[str],
) -> None:
    only = make_article()
    articles.stories[only.story_id or ""] = [only]
    response = await client.post("/comparisons", json={"storyId": only.story_id}, headers=auth())
    assert response.status_code == 200
    assert [name for name, _payload in parse_events(response.text)] == ["empty", "done"]
    assert opened == []


async def test_when_the_story_has_two_source_countries_then_the_comparison_cites_both(
    client: AsyncClient,
    articles: FakeArticles,
    opened: list[str],
) -> None:
    del opened
    japan = make_article()
    france = make_article(
        id="22222222-2222-4222-8222-222222222222",
        source_country_code="FR",
    )
    articles.stories[japan.story_id or ""] = [japan, france]
    response = await client.post("/comparisons", json={"storyId": japan.story_id}, headers=auth())
    assert citation_ids(response.text) == {japan.id, france.id}


async def test_when_the_model_returns_an_unknown_article_id_then_the_stream_omits_that_citation(
    client: AsyncClient,
    articles: FakeArticles,
    opened: list[str],
) -> None:
    del opened
    clicked = make_article(story_id=None)
    articles.articles[clicked.id] = clicked
    response = await client.post("/explanations", json={"articleId": clicked.id}, headers=auth())
    assert UNKNOWN_ARTICLE_ID not in citation_ids(response.text)
    assert clicked.id in citation_ids(response.text)


async def test_when_the_article_id_is_unknown_then_the_explanation_route_returns_404(
    client: AsyncClient,
    articles: FakeArticles,
    opened: list[str],
) -> None:
    del articles, opened
    response = await client.post(
        "/explanations",
        json={"articleId": "11111111-1111-4111-8111-111111111111"},
        headers=auth(),
    )
    assert response.status_code == 404
    assert response.json() == {"error": "Article not found"}


async def test_when_the_story_id_is_unknown_then_the_comparison_route_returns_404(
    client: AsyncClient,
    articles: FakeArticles,
    opened: list[str],
) -> None:
    del articles, opened
    response = await client.post("/comparisons", json={"storyId": "story-missing"}, headers=auth())
    assert response.status_code == 404
    assert response.json() == {"error": "Story not found"}


async def test_when_the_search_text_names_a_topic_and_a_place_then_the_lookup_uses_that_box(
    client: AsyncClient,
    articles: FakeArticles,
    opened: list[str],
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    del opened

    async def fake_geocode(place: str) -> BBox | None:
        if place.casefold() == "east asia":
            return EAST_ASIA
        return None

    monkeypatch.setattr(search, "geocode_place", fake_geocode)
    articles.search_rows = [make_article()]
    response = await client.post(
        "/search",
        json={"query": "supply chain in East Asia"},
        headers=auth(),
    )
    assert response.status_code == 200
    assert articles.search_calls == [(EAST_ASIA, "supply chain", 12)]
    assert any(name == "token" for name, _payload in parse_events(response.text))


async def test_when_the_search_text_has_no_place_then_the_topic_lookup_still_streams_an_answer(
    client: AsyncClient,
    articles: FakeArticles,
    opened: list[str],
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    del opened

    async def fake_geocode(place: str) -> BBox | None:
        del place
        return None

    monkeypatch.setattr(search, "geocode_place", fake_geocode)
    articles.search_rows = [make_article()]
    response = await client.post("/search", json={"query": "supply chain"}, headers=auth())
    assert articles.search_calls == [(None, "supply chain", 12)]
    assert any(name == "token" for name, _payload in parse_events(response.text))
