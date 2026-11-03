from src.answers.llm import CitationChunk, CiteParser, TokenChunk


def test_when_a_citation_is_split_across_chunks_then_the_parser_emits_one_citation() -> None:
    parser = CiteParser()
    article_id = "11111111-1111-4111-8111-111111111111"
    first = parser.push(f"Ports [[{'cite:'}")
    second = parser.push(f"{article_id}]] wait")
    events = [*first, *second, *parser.finish()]
    assert events == [
        TokenChunk("Ports "),
        CitationChunk(article_id),
        TokenChunk(" wait"),
    ]
