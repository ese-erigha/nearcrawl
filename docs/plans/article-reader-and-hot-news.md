# Article reader and hot news

This plan implements [apitube-article-fields.md](apitube-article-fields.md) and [hot-news-by-country.md](hot-news-by-country.md).

The SQL is already in [0002_article_reader_fields.sql](../../infra/migrations/0002_article_reader_fields.sql). Leave `0000_create_articles.sql` and `0001_news_categories.sql` unchanged. Do not add a second migration for these columns.

The pull still writes `articles.summary`. Apply `0002` only in the same release as the pull change below. A migrate that runs first drops `summary`, and the current upsert then fails.

One pull still calls `GET /v1/news/everything` once per page. Read every field below from that payload.

## Field match

Each database column has one APITube path. A missing value follows the null rule in the SQL file.

### Article columns that stay

- `apitube_id` stores `id`, as text.
- `title` stores `title`.
- `body` stores `body`. The column stays `NOT NULL`. When `body` is absent, store `description`. When `description` is also absent, store `title`. Do not read `summary` for this fallback.
- `source_name` stores `source.domain`.
- `source_url` stores `href`.
- `latitude` and `longitude` store the first `locations_mentioned` item whose `lat` and `lng` are both numbers and whose `name` appears in the title or the opening.
- `tags` stores `keywords`. An absent array stores `{}`.
- `published_at` stores `published_at`.
- `is_breaking` stores `is_breaking`. An absent flag stores false.
- `story_id` stores `story.id`, as text. `story.uri` stays off the table.
- `category_id` is the pin. It is our menu root id. It is not `categories.id`.

### Article columns this change adds

- `description` stores `description`. It may be absent, so the column is null. Do not copy a `summary` sentence into it. Do not copy the title into it.
- `image_url` stores `image`. It may be absent, so the column is null.
- `body_html` stores `body_html`. It may be absent, so the column is null.
- `author_name` stores `author.name`. A blank name stores null. `author.id` stays off the table.
- `favicon_url` stores `source.favicon`.
- `source_home_url` stores `source.home_page_url`.
- `source_country_name` stores `source.location.country_name`.
- `source_country_code` stores `source.location.country_code`, in uppercase. This is the publisher country. It is not a story country.
- `read_time_minutes` stores `read_time` when that value is an integer. Any other value stores null.
- `words_count` stores `words_count` when that value is an integer. Any other value stores null.
- `is_free` stores `is_free` when the payload sends true or false. An absent flag stores null.
- `share_count` stores `shares.total` when that value is an integer. An absent total stores 0. `shares.facebook`, `shares.twitter`, and `shares.reddit` stay off the table.
- `is_duplicate` stores `is_duplicate`. An absent flag stores false.
- `source_rank` stores `source.rankings.opr` when that value is an integer. Any other value stores null.

`source.location.country_name` and `source.location.country_code` are null when the nested value is absent. The same rule covers `source.favicon` and `source.home_page_url`.

### Country rows

`article_countries.country_code` stores `locations_mentioned[].country`.

- Keep a code only when it is two letters.
- Store it in uppercase. `us` and `US` become one row, `US`.
- Paris and Lyon both store one `FR` row.
- A place with no country adds no row.
- `locations_mentioned[].name` and `locations_mentioned[].type` stay off the table.
- The publisher country does not add a row here.

The primary key is `(article_id, country_code)`. `article_id` references `articles.id` and deletes with the article. The index is `article_countries_country_code_idx` on `country_code`.

### Category score

`article_categories.score` stores `categories[].score` for an item whose `taxonomy` is `iptc_mediatopics`.

- The score is a number from 0 to 1. An absent score stores null.
- `categories[].id` is APITube's integer. It is not stored.
- The medtop id still comes from `categories[].links.self`.
- The pull still writes the match and each ancestor. Copy the child score onto those ancestor rows. When two children share an ancestor, keep the higher score.
- The insert list has one row per category. The higher score is chosen before the write.
- `ON CONFLICT (article_id, category_id) DO UPDATE SET score = EXCLUDED.score`. The current `DO NOTHING` would keep a stale score.

### Fields that stay off

- `summary`, including each sentence and its tone.
- `topics` and `industries`.
- `translations`. The pull still requests `language.code=en`.
- `entities`, `sentiment`, `source.bias`, `readability`, `links`, and `media`.
- `sentences_count`, `paragraphs_count`, and `characters_count`.
- `source.id` and `source.type`.

## Database code

Update the Drizzle tables so they match `0002`.

- `packages/db/src/schema/articles.ts` drops `summary` and adds the new article columns.
- `packages/db/src/schema/article-countries.ts` is the new table.
- `packages/db/src/schema/article-categories.ts` adds `score`.
- Export the new table from `packages/db/src/schema/index.ts`.

`upsertArticlesSql` writes `description` in place of `summary`, plus the new article columns. Cast integer columns with `::int`, boolean columns with `::boolean`, and `source_rank` with `::int`. An untyped parameter becomes text, and that cast is what keeps the write from failing.

The same statement replaces `article_countries` for each upserted article. Delete codes that are absent from the new set. Insert the new codes with `ON CONFLICT DO NOTHING`.

The filed values gain `score`. Cast it with `::float8`.

`ingested_at` still stays on a repeat.

Add `listHotByCountry`. It joins `article_countries` to `articles`. The caller passes the country code and the time cutoff. The SQL does not call `now()`.

1. `country_code` equals the visitor country.
2. `published_at` is at or after the cutoff.
3. `is_duplicate` is false.
4. Order by `is_breaking` descending, then `share_count` descending, then `published_at` descending.
5. Limit with the cap from the gateway config.

`source_rank` is selected with the row and is not part of this order.

The spatial `SELECT` and the article `SELECT` read `description` and the card columns. The article `SELECT` also reads the article-page columns. The sealed SQL uses those same column lists. A seal still binds the box and the category inside the query.

## Ingestion

`toNewsItem` returns `description` as `string | null`. Remove the fallback that copies the first `summary` sentence into that text.

Collect the distinct uppercase country codes. Collect `categories[].score` by medtop id.

`processBatch` passes the new fields into `upsertByApitubeIds`. The country replace and the score update happen in that write.

A repeat pull updates `description`, the card columns, the country rows, and `score`.

## Gateway

JSON fields are camelCase. The response field `summary` becomes `description`.

### Card

`GET /api/spatial/news` and the hot list return a card.

- `description` from `description`
- `imageUrl` from `image_url`
- `faviconUrl` from `favicon_url`
- `readTimeMinutes` from `read_time_minutes`
- `isFree` from `is_free`
- `shareCount` from `share_count`
- `title`, `sourceName`, `sourceUrl`, `publishedAt`, `isBreaking`, `categoryId`, `categories`, `tags`, `latitude`, and `longitude` stay

The card shows `title` when `description` is null.

### Article page

`GET /api/articles/:id` returns the card plus these fields.

- `body` from `body`
- `bodyHtml` from `body_html`
- `authorName` from `author_name`
- `sourceHomeUrl` from `source_home_url`
- `sourceCountryName` from `source_country_name`
- `sourceCountryCode` from `source_country_code`
- `wordsCount` from `words_count`

The page renders `bodyHtml` and falls back to `body` when `bodyHtml` is null. Sanitize `bodyHtml` before render. `sourceCountryCode` is the publisher. It does not decide the hot list.

`sourceRank` and `score` stay in the database. This change does not return them.

### Hot list

Add `GET /` on the articles router, and register it before `GET /:id`. The path is `GET /api/articles?country=US`.

- `country` is required. It is two letters. The gateway stores the uppercase form and passes that to `listHotByCountry`.
- A missing or invalid `country` is a 400.
- The cutoff is now minus `FEED_RETENTION_DAYS`. Add that var to `apps/gateway/wrangler.toml`, with the same value as ingestion, `14`. Pass the timestamp into the SQL.
- The limit is `HOT_NEWS_CAP` in that same `[vars]` block. Set it to `20`.
- The response is `{ "articles": [ ...cards ] }`.
- A story with no `article_countries` row stays off this list. It can still appear on the globe.

`apps/web` bookmark types replace `summary` with `description`.

## Tests

- When `description` is absent and `summary` has sentences, then the stored description is null.
- When `body` is absent and `description` is present, then `body` stores that description.
- When two places use `FR`, then one `article_countries` row is stored.
- When places use `FR` and `US`, then both rows are stored.
- When `source.location.country_code` is `us`, then `source_country_code` is `US` and `article_countries` does not gain a row from it.
- When two children share an ancestor, then that ancestor row keeps the higher score.
- When a repeat pull sends a new score, then the stored score changes.
- When the hot country is `FR`, then a duplicate is excluded and a breaking story comes before a story with more shares.
- When `country` is missing, then `GET /api/articles` returns 400.
- When the spatial read runs, then the card field is `description`.

## Out of this change

- The pull cron is off. This change does not edit it.
- No daily full walk and no change to the known-page stop.
- No LightGBM re-rank.
- No tone marker and no tracked-entity store.
