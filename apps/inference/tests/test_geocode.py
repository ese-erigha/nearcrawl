import pytest

from src.articles.repository import BBox
from src.geocode import clear_place_cache, geocode_place


async def test_when_the_same_place_is_searched_again_then_geoapify_is_called_once(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    clear_place_cache()
    calls: list[str] = []

    async def fake_fetch(place: str) -> BBox | None:
        calls.append(place)
        return BBox(west=1.0, south=2.0, east=3.0, north=4.0)

    monkeypatch.setattr("src.geocode._fetch_box", fake_fetch)
    first = await geocode_place("Lyon")
    second = await geocode_place("lyon")
    assert first == second
    assert calls == ["Lyon"]
