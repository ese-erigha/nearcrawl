import asyncio
from collections import OrderedDict

import httpx

from src.articles.repository import BBox
from src.config import get_config
from src.errors import UnavailableError

MIN_PLACE_CONFIDENCE = 0.5
_MAX_CACHED_PLACES = 256
_MIN_INTERVAL_SECONDS = 0.2
_USER_AGENT = "NearCrawl inference"

_cache: OrderedDict[str, BBox | None] = OrderedDict()
_lock = asyncio.Lock()
_next_at = 0.0


def clear_place_cache() -> None:
    global _next_at
    _cache.clear()
    _next_at = 0.0


async def geocode_place(place: str) -> BBox | None:
    key = place.casefold()
    cached = _cache.get(key)
    if key in _cache:
        return cached
    await _wait_turn()
    box = await _fetch_box(place)
    _store(key, box)
    return box


async def _wait_turn() -> None:
    global _next_at
    async with _lock:
        loop = asyncio.get_running_loop()
        now = loop.time()
        if now < _next_at:
            await asyncio.sleep(_next_at - now)
        _next_at = loop.time() + _MIN_INTERVAL_SECONDS


def _store(key: str, box: BBox | None) -> None:
    _cache[key] = box
    _cache.move_to_end(key)
    while len(_cache) > _MAX_CACHED_PLACES:
        _cache.popitem(last=False)


async def _fetch_box(place: str) -> BBox | None:
    config = get_config()
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.get(
                config.geoapify_base_url,
                params={
                    "text": place,
                    "format": "json",
                    "limit": 1,
                    "apiKey": config.geoapify_api_key,
                },
                headers={"user-agent": _USER_AGENT},
            )
            payload = response.json()
    except (httpx.HTTPError, ValueError):
        raise UnavailableError from None
    if response.status_code != 200:
        raise UnavailableError
    return _first_box(payload)


def _first_box(payload: object) -> BBox | None:
    if not isinstance(payload, dict):
        return None
    results = payload.get("results")
    if not isinstance(results, list) or not results:
        return None
    first = results[0]
    if not isinstance(first, dict):
        return None
    return _box_from_result(first)


def _box_from_result(result: dict[str, object]) -> BBox | None:
    rank = result.get("rank")
    if not isinstance(rank, dict):
        return None
    confidence = rank.get("confidence")
    if not isinstance(confidence, int | float) or confidence < MIN_PLACE_CONFIDENCE:
        return None
    bbox = result.get("bbox")
    if not isinstance(bbox, dict):
        return None
    try:
        lon1 = _coordinate(bbox.get("lon1"))
        lat1 = _coordinate(bbox.get("lat1"))
        lon2 = _coordinate(bbox.get("lon2"))
        lat2 = _coordinate(bbox.get("lat2"))
    except (TypeError, ValueError):
        return None
    return BBox(
        west=min(lon1, lon2),
        south=min(lat1, lat2),
        east=max(lon1, lon2),
        north=max(lat1, lat2),
    )


def _coordinate(value: object) -> float:
    if isinstance(value, bool) or not isinstance(value, int | float | str):
        raise TypeError
    return float(value)
