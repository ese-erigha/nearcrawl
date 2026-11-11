# APITube article fields

Checked against the article object on the APITube response structure page on 31 October 2026.

The pull reads `categories` where `taxonomy` is `iptc_mediatopics`. It does not read the `topics` array. The two lists are different systems. The globe menu comes from the first one.

`NewsTopic` in `apps/ingestion/src/pull-news/apitube.client.ts` is the parsed IPTC category. The name collides with APITube `topics`. The value still comes from `categories`.

## Categories and topics

APITube `categories` are IPTC Media Topics.

- Each item has a name, a score from 0 to 1, a taxonomy, and `links.self`.
- The taxonomy on the items we keep is `iptc_mediatopics`.
- `links.self` holds the `medtop` id, such as `medtop:04000000`.
- The sample article is "economy, business and finance" with `medtop:04000000`. That id is the Finance root in [news-categories.md](news-categories.md).
- Their category `id`, such as `258`, is their integer. It is not the `medtop` id and it is not our menu id.

APITube `topics` are a separate list.

- The id is a string, such as `market_news.commodities.potash` or `industry.financial_news`.
- Each item has a name and a score from 0 to 1.
- An item has no `medtop` id and no parent.
- `industries` is a third list, with its own integer id and name.

The menu stays on IPTC categories. A topic such as potash market news is not a child of Finance in that tree.

## Why the pull maps categories onto our rows

The article payload has no parent. A reader who chooses Finance must also see central bank. The same rule covers music and jazz music.

APITube's own filter matches one id, skips children, and accepts at most three ids. The seed in `categories` walks each `medtop` up to its menu root. The pull writes the match and every ancestor into `article_categories`. `articles.category_id` is the pin. The pin is the matched root with the smallest id. No match uses General.

The category URL returns articles in that category. It does not return the parent, so the pull does not call it to learn the tree. The parent comes from the IPTC tree already stored in `categories`. The catalog and the menu ids are in [news-categories.md](news-categories.md).

## Category score

One article can belong to many categories. Each APITube category carries its own score, from 0 to 1. The score says how strongly that article belongs to that category. `source.rankings.opr` says how strong the publisher is. A strong publisher can still file a weak match, so the rank cannot stand in for the score.

The globe filter already works without the score. A row in `article_categories` means the article is in that category. The score matters when a reader asks for news relevant to their categories and the list is ordered by the strength of that match.

The score belongs on `article_categories`. The primary key is already `article_id` plus `category_id`. Add `score double precision`. A null score means the payload omitted it. A second table would store the same pair again.

APITube scores only the categories it sends. The pull also writes each ancestor. Copy the child score onto those ancestor rows. When two children point at the same ancestor, keep the higher score. A query for Finance can then order by `score` on the Finance row. Use `source_rank` after that, as a tie-break between articles that match equally well.

The current insert uses `ON CONFLICT DO NOTHING`. A repeat pull would keep the old score. When the column exists, that conflict updates `score`.

## What the reader sees

A card on the home list, the hot list, or the globe shows the picture, the title, and `description`. A click opens the article page. That page shows the byline, the same `description`, and the formatted body.

APITube `description` and APITube `summary` are different fields. Store `description` in `articles.description`. Do not store `summary`. When `description` is absent, the card shows the title. Do not fill `description` from a summary sentence.

`keywords` are already `articles.tags`.

### Card

- `image` is the picture. Some articles omit it. Store it as `image_url`.
- `title` is already stored.
- `description` is the blurb. Store it as `description`.
- `source.domain`, stored as `source_name`, is the publisher name.
- `source.favicon` is the small mark beside that name. Store it as `favicon_url`.
- `published_at` and `is_breaking` are already stored.
- `read_time` is the "3 min read" label. Store it as `read_time_minutes`.
- `is_free` tells the reader the original article may sit behind a paywall.
- `shares.total` is the attention count. The hot-news plan stores it as `share_count`.

### Article page

The page repeats the card, then adds the rest.

- `author.name` is the byline. Store it as `author_name`. Leave `author.id` off. An empty name stays null.
- `source.home_page_url` is the publisher's site. Store it as `source_home_url`. `href`, already `source_url`, stays the link to this article.
- `source.location.country_name` is the publisher country in the byline, such as "United Kingdom". Store it as `source_country_name`. Store `source.location.country_code` as `source_country_code` so the byline can draw a flag. These two are the publisher. They stay off `article_countries`. The hot list still uses `locations_mentioned.country`.
- `body_html` is the formatted article. Store it beside `body`. The page renders `body_html` and falls back to `body` when the HTML is absent. Sanitize the HTML before render. The subscription plan may shorten both fields.
- `words_count` sits next to the read time, as in "3 min read · 800 words".
- `tags` are the keyword chips. They are already stored.
- The filed categories are already stored.

`description`, `read_time_minutes`, `words_count`, `image_url`, `author_name`, `source_home_url`, `source_country_name`, `source_country_code`, `favicon_url`, and `body_html` are null when the payload omits them. `is_free` is true only when the payload says the article is free. A missing flag stays null.

## Translations

`translations.en.title` and `translations.en.description` are the English title and description. The body stays in the original language. Both fields are null when the article is already English, and when the language has no translation.

The pull requests `language.code=en`, so this block is null on the rows we store. It becomes useful only if that language filter comes off. It does not replace the category tree.

## Sentiment

`sentiment` is the tone of the title, the body, and the whole article.

- `score` runs from -1 to 1.
- `polarity` is `positive`, `negative`, or `neutral`.
- The card and the article page do not show this tone yet.
- The divergence view and the later rank can use `sentiment.overall`.
- Tone toward one person or organization sits on `entities`, with its own score. That belongs with tracked people in Phase 3.

## Column map

The alter is [0002_article_reader_fields.sql](../../infra/migrations/0002_article_reader_fields.sql). Leave `0000_create_articles.sql` and `0001_news_categories.sql` unchanged. The file copies `articles.summary` into `description`, then drops `summary`. Today's `summary` values are the description the pull wrote. They are not the APITube `summary` array.

The field reference marks a value as optional only when the line says it may be absent or null.

- `description` may be absent, so `description` is null.
- `body_html` may be absent, so `body_html` is null.
- `image` may be absent, so `image_url` is null.
- `author.id` may be null, and the name can be missing, so `author_name` is null.
- `translations.en` is null for an English article. That block is not stored.

The same table lists `read_time`, `words_count`, `is_free`, and `source` with no absent line. Rows already stored have no value for them. A default of 0 or false would paint a false card, so those new columns are null until a pull writes them. Nested source fields are null for the same reason. `shares.total` uses 0 as the empty count. `is_duplicate` uses false. `is_breaking` already uses false.

`title`, `body`, `href`, `published_at`, and `id` have no absent line. Those columns stay `NOT NULL`.

### New columns

- `articles.description text` null stores `description`.
- `articles.image_url text` null stores `image`.
- `articles.body_html text` null stores `body_html`.
- `articles.author_name text` null stores `author.name`.
- `articles.favicon_url text` null stores `source.favicon`.
- `articles.source_home_url text` null stores `source.home_page_url`.
- `articles.source_country_name text` null stores `source.location.country_name`.
- `articles.source_country_code text` null stores `source.location.country_code`.
- `articles.read_time_minutes integer` null stores `read_time`.
- `articles.words_count integer` null stores `words_count`.
- `articles.is_free boolean` null stores `is_free`.
- `articles.source_rank integer` null stores `source.rankings.opr`.
- `articles.share_count integer NOT NULL DEFAULT 0` stores `shares.total`.
- `articles.is_duplicate boolean NOT NULL DEFAULT false` stores `is_duplicate`.
- `article_countries.country_code text NOT NULL` stores each distinct `locations_mentioned.country`. A row exists only when the code is present. See [hot-news-by-country.md](hot-news-by-country.md).
- `article_categories.score double precision` null stores `categories.score`. Copy the child score onto each ancestor, and keep the higher score. See [Category score](#category-score).

### Altered columns

- Drop `articles.summary`. APITube `summary` is not stored. The card and the article page read `description`.

### SQL

```sql
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

UPDATE articles SET description = summary;

ALTER TABLE articles DROP COLUMN summary;

CREATE TABLE article_countries (
  article_id uuid NOT NULL REFERENCES articles (id) ON DELETE CASCADE,
  country_code text NOT NULL,
  PRIMARY KEY (article_id, country_code)
);

CREATE INDEX article_countries_country_code_idx ON article_countries (country_code);

ALTER TABLE article_categories ADD COLUMN score double precision;
```

### Columns that stay

- `articles.apitube_id` stores `id`.
- `articles.title` stores `title`.
- `articles.body` stores `body`.
- `articles.source_name` stores `source.domain`.
- `articles.source_url` stores `href`.
- `articles.latitude` and `articles.longitude` store the first `locations_mentioned` place with numeric `lat` and `lng` whose `name` appears in the title or the opening.
- `articles.tags` stores `keywords`.
- `articles.published_at` stores `published_at`.
- `articles.is_breaking` stores `is_breaking`.
- `articles.story_id` stores `story.id`.
- `articles.category_id` is the pin. It is our root id, not an APITube field.
- `language` limits the request to English. It is not a column.

## Fields for a later screen

- `sentiment.overall` is a tone marker for the divergence view and the later rank.
- `source.bias` is the outlet lean on that divergence view. Examples are `left`, `right`, and `center`.
- `entities` help tracked people in Phase 3. Each entity has an id, a name, and a type such as `person` or `organization`. Store the positions and the metadata with that feature, not before it.

## Fields that stay off

A reader does not see these, and they do not filter the globe.

- `topics` and `industries` are other catalogs.
- `author.id`, `source.id`, and `source.type` sit behind the byline. The page shows the author name, the domain, and the homepage.
- `readability` is a set of grade formulas. The page shows `read_time` and `words_count` instead.
- `sentences_count`, `paragraphs_count`, and `characters_count` repeat what the read time and the word count already tell the reader.
- `links` are URLs inside the article. `body_html` already carries the formatted text.
- `media` repeats `image` and adds extra files. The card uses `image`.
- `shares.facebook`, `shares.twitter`, and `shares.reddit` stay off. `shares.total` is the attention count.
- `summary` stays off. That includes each sentence and its tone. The card and the article page use `description`.
