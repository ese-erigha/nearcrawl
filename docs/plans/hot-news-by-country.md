# Hot news by country

A home visit passes the visitor country. The gateway returns a short list of recent stories that mention that country. Breaking stories come first, then stories with more shares, then newer stories.

One article can mention places in many countries. `article_countries` stores one row for each distinct country on that article. A visitor in any of those countries sees the story.

The globe pin stays one place. That place is the first `locations_mentioned` entry with `lat` and `lng` whose `name` appears in the title or the opening. The home list keeps a story when `article_countries` contains a requested code.

## Fields from APITube

The pull already calls `GET /v1/news/everything`. Read these fields from that same payload. Leave the pull on one request.

- `locations_mentioned` is a list of places. Each place has `name`, `country`, `lat`, `lng`, and `type`. `country` is an ISO 3166-1 alpha-2 code, such as `US`. Collect every distinct code on the article. Paris and Lyon both store one `FR` row. A place with no country adds no row.
- `shares.total` is the attention count. Leave the Facebook, Twitter, and Reddit counts off the table.
- `is_breaking` is already a column.
- `is_duplicate` is true when the article repeats another article.
- `source.rankings.opr` is the publisher rank. A higher number is a stronger publisher. Store it on every upsert so a later order can use it without a backfill.
- `source.location.country_code` is the publisher country. Leave it off the story countries.

## Tables

Add the new table and the new article columns in one SQL file under `infra/migrations`. Leave `0000_create_articles.sql` and `0001_news_categories.sql` unchanged.

`articles` gains these columns.

- `share_count integer NOT NULL DEFAULT 0`.
- `is_duplicate boolean NOT NULL DEFAULT false`.
- `source_rank integer`. Null when the payload has no `source.rankings.opr`.

`is_breaking` and `published_at` stay. `articles` has no `country_code` column.

`article_countries` follows `article_categories`.

- `article_id uuid NOT NULL` references `articles.id` on delete cascade.
- `country_code text NOT NULL`.
- The primary key is `(article_id, country_code)`.
- The index is `article_countries_country_code_idx` on `country_code`.

There is no `countries` table. The country code is the key.

Update `packages/db/src/schema/articles.ts` and add `packages/db/src/schema/article-countries.ts` so they match the SQL. The article upsert writes `share_count`, `is_duplicate`, and `source_rank`. The same upsert replaces that article's country rows. `ingested_at` still stays on a repeat.

Rows already stored keep zero shares, `is_duplicate` false, null rank, and no country rows until a later pull rewrites them.

## Diagram

```
articles                              article_countries
+-----------------------------+       +------------------------------+
| PK  id                      |----<  | PK,FK  article_id            |
|     title                   |       | PK     country_code          |
|     share_count             |       +------------------------------+
|     is_duplicate            |
|     source_rank             |
|     is_breaking             |
|     published_at            |
|     latitude                |
|     longitude               |
+-----------------------------+

----<  means one article, many country rows.

One country code appears on many articles.
The code is the key. There is no countries table.
```

## Worked example

Three stories arrive in one pull.

| article_id | title | places in the payload | is_breaking | share_count | is_duplicate |
| --- | --- | --- | --- | --- | --- |
| a1 | Talks in Paris and New York | Paris FR, New York US | true | 40 | false |
| a2 | Strike in Lyon and Paris | Lyon FR, Paris FR | false | 12 | false |
| a3 | Markets roundup | none | false | 3 | false |

The pull stores one row per distinct country. Lyon and Paris collapse to one `FR` row. Story `a3` stores no country row.

| article_id | country_code |
| --- | --- |
| a1 | FR |
| a1 | US |
| a2 | FR |

A visitor in France sees `a1` and `a2`. A visitor in the United States sees `a1`. Story `a3` stays off every home list. It can still appear on the globe when it has coordinates.

## Index

`article_countries_country_code_idx` finds the articles for one country. The read then keeps the recent rows, drops duplicates, and sorts that set.

`source_rank` stays off that index. Add it to an index only when a query filters or sorts by it.

The globe indexes stay. Those are the location GiST index, the latitude and longitude index, and the category and `published_at` index.

Copy `published_at`, `is_breaking`, `share_count`, and `is_duplicate` onto `article_countries` only after a measured read is slow. I do not know how many rows one country holds inside the 14-day window.

## Home read

The visitor country comes from the request. It is not a column on `articles`. The gateway accepts that country code on the hot-news read.

The read is a normal `GET`. Pass the time cutoff as a parameter. Leave `now()` out of the SQL.

1. Join `article_countries` to `articles` on `article_id`.
2. `country_code` equals the visitor country.
3. `published_at` is at or after the cutoff.
4. `is_duplicate` is false.
5. Order by `is_breaking` descending, then `share_count` descending, then `published_at` descending.
6. Limit the list.

`source_rank` is selected with the row and stays out of this order. A later change can break a tie with it.

## Out of this change

- No daily full walk and no change to the known-page stop.
- The pull cron is off. This change does not edit it.
- No LightGBM re-rank. That work stays in Phase 3.
