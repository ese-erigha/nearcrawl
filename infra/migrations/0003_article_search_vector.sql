-- array_to_string is stable. A generated column needs an immutable expression.
-- For text, the joined value does not depend on session settings.
CREATE FUNCTION immutable_array_to_string(items text[], separator text)
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $$
  SELECT array_to_string(items, separator)
$$;
--> statement-breakpoint
-- Title, description, and tags. Body stays out so the index stays small.
ALTER TABLE articles
  ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    to_tsvector(
      'english'::regconfig,
      coalesce(title, '') || ' ' ||
      coalesce(description, '') || ' ' ||
      coalesce(immutable_array_to_string(tags, ' '), '')
    )
  ) STORED;
--> statement-breakpoint
CREATE INDEX articles_search_vector_idx
  ON articles USING GIN (search_vector);
