from collections.abc import AsyncIterator

import pytest
from httpx import ASGITransport, AsyncClient

from src.main import app

SECRET = "test-inference-secret"


@pytest.fixture
async def client() -> AsyncIterator[AsyncClient]:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as http:
        yield http


def auth() -> dict[str, str]:
    return {"authorization": f"Bearer {SECRET}"}


async def test_when_brief_stories_are_sent_then_the_summary_uses_the_title_and_leaves_the_body_out(
    client: AsyncClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    seen: list[dict[str, object]] = []

    async def fake_complete(instructions: str, rows: list[dict[str, object]]) -> str:
        assert "one short paragraph" in instructions
        seen.extend(rows)
        return "Ports closed overnight."

    monkeypatch.setattr("src.answers.brief.complete_text", fake_complete)
    response = await client.post(
        "/brief-summaries",
        headers=auth(),
        json={
            "stories": [
                {
                    "title": "Port closure",
                    "sourceName": "Harbor Desk",
                    "description": "Shipping halted overnight.",
                }
            ]
        },
    )

    assert response.status_code == 200
    assert response.json() == {"summary": "Ports closed overnight."}
    assert seen == [
        {
            "title": "Port closure",
            "sourceName": "Harbor Desk",
            "description": "Shipping halted overnight.",
        }
    ]


async def test_when_the_bearer_secret_is_wrong_then_the_summary_route_returns_401(
    client: AsyncClient,
) -> None:
    response = await client.post(
        "/brief-summaries",
        json={
            "stories": [
                {"title": "Port closure", "sourceName": "Harbor Desk", "description": ""},
            ]
        },
    )
    assert response.status_code == 401
