-- Title, description, and tags. Body stays out so the index stays small.
ALTER TABLE articles
  ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    to_tsvector(
      'english',
      coalesce(title, '') || ' ' ||
      coalesce(description, '') || ' ' ||
      coalesce(array_to_string(tags, ' '), '')
    )
  ) STORED;
--> statement-breakpoint
CREATE INDEX articles_search_vector_idx
  ON articles USING GIN (search_vector);
