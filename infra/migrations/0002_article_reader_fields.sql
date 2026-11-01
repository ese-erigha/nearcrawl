-- Null text columns follow the APITube field reference lines that say the value may be absent.
ALTER TABLE articles
  ADD COLUMN description text,
  ADD COLUMN image_url text,
  ADD COLUMN body_html text,
  ADD COLUMN author_name text,
  ADD COLUMN favicon_url text,
  ADD COLUMN source_home_url text,
  ADD COLUMN source_country_name text,
  ADD COLUMN source_country_code text,
  ADD COLUMN read_time_minutes integer,
  ADD COLUMN words_count integer,
  ADD COLUMN is_free boolean,
  ADD COLUMN source_rank integer,
  ADD COLUMN share_count integer NOT NULL DEFAULT 0,
  ADD COLUMN is_duplicate boolean NOT NULL DEFAULT false;
--> statement-breakpoint
UPDATE articles SET description = summary;
--> statement-breakpoint
ALTER TABLE articles DROP COLUMN summary;
--> statement-breakpoint
CREATE TABLE article_countries (
  article_id uuid NOT NULL REFERENCES articles (id) ON DELETE CASCADE,
  country_code text NOT NULL,
  PRIMARY KEY (article_id, country_code)
);
--> statement-breakpoint
CREATE INDEX article_countries_country_code_idx ON article_countries (country_code);
--> statement-breakpoint
ALTER TABLE article_categories ADD COLUMN score double precision;
