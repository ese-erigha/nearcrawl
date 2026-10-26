CREATE EXTENSION IF NOT EXISTS postgis;
--> statement-breakpoint
CREATE TABLE articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  apitube_id text NOT NULL UNIQUE,
  title text NOT NULL,
  summary text NOT NULL,
  body text NOT NULL,
  source_name text NOT NULL,
  source_url text NOT NULL,
  latitude double precision NOT NULL CHECK (latitude BETWEEN -90 AND 90),
  longitude double precision NOT NULL CHECK (longitude BETWEEN -180 AND 180),
  location geography(Point, 4326) GENERATED ALWAYS AS (
    ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
  ) STORED,
  category text NOT NULL CHECK (category IN ('Finance', 'Tech', 'Geopolitics', 'General')),
  tags text[] NOT NULL DEFAULT '{}',
  published_at timestamptz NOT NULL,
  is_breaking boolean NOT NULL DEFAULT false,
  story_id text,
  ingested_at timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX articles_location_gix ON articles USING GIST (location);
--> statement-breakpoint
CREATE INDEX articles_lat_lng_idx ON articles (latitude, longitude);
--> statement-breakpoint
CREATE INDEX articles_published_at_idx ON articles (published_at);
--> statement-breakpoint
CREATE INDEX articles_category_published_at_idx ON articles (category, published_at DESC);
