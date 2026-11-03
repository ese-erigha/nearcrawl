import json
from collections.abc import AsyncIterator
from dataclasses import dataclass
from uuid import UUID

import httpx

from src.config import get_config
from src.errors import UnavailableError

_MARKER_START = "[[cite:"
_MARKER_END = "]]"


@dataclass(frozen=True)
class TokenChunk:
    text: str


@dataclass(frozen=True)
class CitationChunk:
    article_id: str


ModelEvent = TokenChunk | CitationChunk


class CiteParser:
    def __init__(self) -> None:
        self._buffer = ""

    def push(self, text: str) -> list[ModelEvent]:
        self._buffer += text
        events: list[ModelEvent] = []
        while True:
            start = self._buffer.find(_MARKER_START)
            if start == -1:
                events.extend(self._flush_plain())
                return events
            if start > 0:
                events.append(TokenChunk(self._buffer[:start]))
                self._buffer = self._buffer[start:]
            end = self._buffer.find(_MARKER_END, len(_MARKER_START))
            if end == -1:
                return events
            raw_id = self._buffer[len(_MARKER_START) : end]
            self._buffer = self._buffer[end + len(_MARKER_END) :]
            events.append(_citation_or_text(raw_id))

    def finish(self) -> list[ModelEvent]:
        if self._buffer == "":
            return []
        text = self._buffer
        self._buffer = ""
        return [TokenChunk(text)]

    def _flush_plain(self) -> list[ModelEvent]:
        hold = _marker_prefix_size(self._buffer)
        emit = self._buffer[: len(self._buffer) - hold]
        self._buffer = self._buffer[len(self._buffer) - hold :]
        if emit == "":
            return []
        return [TokenChunk(emit)]


async def open_completion(
    instructions: str,
    rows: list[dict[str, object]],
) -> AsyncIterator[ModelEvent]:
    config = get_config()
    client = httpx.AsyncClient(timeout=httpx.Timeout(60.0, read=120.0))
    try:
        response = await client.send(
            client.build_request(
                "POST",
                f"{config.openrouter_base_url}/chat/completions",
                json={
                    "model": config.openrouter_model,
                    "stream": True,
                    "messages": [
                        {"role": "system", "content": instructions},
                        {"role": "user", "content": json.dumps(rows)},
                    ],
                },
                headers={"authorization": f"Bearer {config.openrouter_api_key}"},
            ),
            stream=True,
        )
    except httpx.HTTPError:
        await client.aclose()
        raise UnavailableError from None
    if response.status_code != 200:
        await response.aclose()
        await client.aclose()
        raise UnavailableError
    return _read_events(response, client)


async def _read_events(
    response: httpx.Response,
    client: httpx.AsyncClient,
) -> AsyncIterator[ModelEvent]:
    parser = CiteParser()
    try:
        async for line in response.aiter_lines():
            for event in _events_from_line(parser, line):
                yield event
        for event in parser.finish():
            yield event
    finally:
        await response.aclose()
        await client.aclose()


def _events_from_line(parser: CiteParser, line: str) -> list[ModelEvent]:
    if not line.startswith("data:"):
        return []
    data = line.removeprefix("data:").strip()
    if data == "" or data == "[DONE]":
        return []
    try:
        payload = json.loads(data)
    except json.JSONDecodeError:
        return []
    text = _delta_text(payload)
    if text is None:
        return []
    return parser.push(text)


def _delta_text(payload: object) -> str | None:
    if not isinstance(payload, dict):
        return None
    choices = payload.get("choices")
    if not isinstance(choices, list) or not choices:
        return None
    choice = choices[0]
    if not isinstance(choice, dict):
        return None
    delta = choice.get("delta")
    if not isinstance(delta, dict):
        return None
    content = delta.get("content")
    if not isinstance(content, str) or content == "":
        return None
    return content


def _citation_or_text(raw_id: str) -> ModelEvent:
    try:
        UUID(raw_id)
    except ValueError:
        return TokenChunk(f"{_MARKER_START}{raw_id}{_MARKER_END}")
    return CitationChunk(raw_id)


def _marker_prefix_size(text: str) -> int:
    for size in range(len(_MARKER_START) - 1, 0, -1):
        if text.endswith(_MARKER_START[:size]):
            return size
    return 0
