from src.articles.repository import BBox, search_statement


def test_when_the_box_crosses_the_antimeridian_then_the_lookup_uses_either_side() -> None:
    box = BBox(west=170.0, south=-10.0, east=-170.0, north=10.0)
    statement, args = search_statement(box, "ports", 14, 12)
    assert "longitude >=" in statement
    assert "websearch_to_tsquery" in statement
    assert args == [14, -10.0, 10.0, 170.0, -170.0, "ports", 12]


def test_when_the_search_has_no_place_then_the_lookup_has_no_latitude_check() -> None:
    statement, args = search_statement(None, "ports", 14, 12)
    assert "latitude BETWEEN" not in statement
    assert args == [14, "ports", 12]
