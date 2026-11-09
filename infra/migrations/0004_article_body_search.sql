-- search_vector indexes the title, the description, and the tags.
-- The body stays out of that column so the index stays small.
-- Mentions also match a word in the body, and they skip duplicates.
CREATE INDEX articles_body_search_idx
  ON articles USING GIN (to_tsvector('english'::regconfig, body))
  WHERE is_duplicate = false;
