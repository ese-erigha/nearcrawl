import asyncio
import json
from collections.abc import AsyncIterator

from src.answers.context import PreparedAnswer, articles_for_model
from src.answers.llm import CitationChunk, ModelEvent, TokenChunk, open_completion
from src.articles.repository import ArticleRecord

KEEPALIVE_SECONDS = 25
_END = object()


async def start_answer(prepared: PreparedAnswer) -> AsyncIterator[bytes]:
    if not prepared.rows:
        return _empty()
    model = await open_completion(prepared.instructions, articles_for_model(prepared.rows))
    return _cited(model, prepared.rows)


def format_event(name: str, payload: dict[str, object]) -> bytes:
    data = json.dumps(payload, separators=(",", ":"))
    return f"event: {name}\ndata: {data}\n\n".encode()


async def _empty() -> AsyncIterator[bytes]:
    yield format_event("empty", {})
    yield format_event("done", {})


async def _cited(
    model: AsyncIterator[ModelEvent],
    rows: list[ArticleRecord],
) -> AsyncIterator[bytes]:
    allowed = {row.id.casefold(): row for row in rows}
    try:
        async for event in _with_keepalive(model):
            chunk = _chunk(event, allowed)
            if chunk is not None:
                yield chunk
    except Exception:
        yield format_event("error", {"error": "Inference service is unavailable"})
        return
    yield format_event("done", {})


def _chunk(event: ModelEvent | None, allowed: dict[str, ArticleRecord]) -> bytes | None:
    if event is None:
        return b": keepalive\n\n"
    if isinstance(event, TokenChunk):
        return format_event("token", {"text": event.text})
    row = allowed.get(event.article_id.casefold())
    if row is None:
        return None
    return format_event(
        "citation",
        {"articleId": row.id, "title": row.title, "sourceUrl": row.source_url},
    )


async def _with_keepalive(model: AsyncIterator[ModelEvent]) -> AsyncIterator[ModelEvent | None]:
    iterator = model.__aiter__()
    pending: asyncio.Task[ModelEvent | object] | None = None
    try:
        while True:
            if pending is None:
                pending = asyncio.create_task(_next_event(iterator))
            done, _ = await asyncio.wait({pending}, timeout=KEEPALIVE_SECONDS)
            if not done:
                yield None
                continue
            event = pending.result()
            pending = None
            if event is _END:
                return
            if isinstance(event, TokenChunk | CitationChunk):
                yield event
    finally:
        if pending is not None and not pending.done():
            pending.cancel()


async def _next_event(iterator: AsyncIterator[ModelEvent]) -> ModelEvent | object:
    try:
        return await iterator.__anext__()
    except StopAsyncIteration:
        return _END
