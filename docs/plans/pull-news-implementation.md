# Implement the pull design

This file is the code change for [pull-news-design.md](pull-news-design.md). The cron loop stays. There is no queue and no last-fetch cursor.

The pull still requests `published_at.start` as now minus `FEED_RETENTION_DAYS`. `pullNews` still loads `categories` once, builds the index, and pages until an empty page, a page with no successor, or a page older than the feed window.

## Do not call the category URL for the parent

`links.self` on an article is `GET /v1/news/category/iptc_mediatopics/{medtop}`. That endpoint returns articles in the category. It does not return the category name or the parent.

The documented article category object has `name`, `taxonomy`, `links.self`, and `score`. It has no parent medtop. `medtopIds` in `apitube.client.ts` already reads the medtop id from `links.self` and drops `name`.

Read `name` from that object. Insert a `categories` row only when the same object also carries a parent medtop and that parent is already in the filing index. When the parent medtop is absent, warn once and file the article from the topics the index already knows. The pin is General when none of them match. That is the design path for a response that names no parent, and it is the path this API documents today.

Do not add a SQL migration. The `categories` table already exists. `medtop_id` is unique. Postgres assigns the next `id`.

## Page write

`storePage` in `apps/ingestion/src/pull-news/pull-news.ts` awaits `upsertByApitubeId` once per article. Replace that with one write for the page.

1. Split the page in memory. An item older than the cutoff stays off both lists. `fresh` stays 0 for that item. An item with a missing or out-of-range coordinate goes on the failure list and counts as fresh. A valid item is resolved, then goes on the write list.
2. Dedupe the write list on `apitubeId`. Keep the later item. Two copies of the same id in one `INSERT` make Postgres reject the page.
3. Warn for each failed item, then write the write list. An empty write list skips the database call.
4. `unknownTopics` counts distinct medtop ids the page could not place. Two articles with the same unresolved id count once.

`upsertArticleSql` in `packages/db/src/articles.sql.ts` writes one article. Add `upsertArticlesSql` beside it. The statement is the same shape for many rows.

- One `INSERT` into `articles` with one `VALUES` list and `ON CONFLICT (apitube_id) DO UPDATE`.
- `RETURNING id, apitube_id`.
- Delete `article_categories` rows for those ids whose `category_id` is absent from that article's new set.
- Insert the new join rows with `ON CONFLICT (article_id, category_id) DO NOTHING`.
- Do not write `ingested_at`. Do not use `now()`.

`DbArticleRepository.upsertByApitubeIds` calls that statement once. Leave `upsertByApitubeId` in place until the pull no longer calls it, then delete it. The gateway does not call either method.

`packages/db/src/articles.write.test.ts` compiles the multi-row statement. Assert the conflict clause, the join delete, the join insert, the absence of `ingested_at`, and the absence of `now()`. Assert that two articles bind both `apitube_id` values.

## Warnings

Add two functions in `apps/ingestion/src/sentry.ts`. Each prints `console.warn` and calls `logger.warn`. Neither calls `captureException`.

- `warnSkippedArticle(apitubeId, medtopIds)` prints `article skipped, apitube id ${apitubeId}, medtop ids ${medtopIds}`.
- `warnUnknownMedtop(medtopId)` prints `unknown medtop ${medtopId}`.

Leave the title, the body, the API key, and `DATABASE_URL` out of both lines. `logPullCounts` stays `logger.info`.

A dropped APITube result, one `toNewsItem` rejects, stays a skip count. It has no APITube id to warn.

## Category insert

`toNewsItem` keeps one topic as `{ medtopId, name, parentMedtopId }`. `parentMedtopId` is null for the documented object. `medtopIds` on `NewsItem` can stay a derived list so the current resolver tests keep their input.

Add `insertCategorySql` in `packages/db/src/categories.sql.ts`.

```sql
INSERT INTO categories (name, parent_id, medtop_id)
VALUES (:name, :parent_id, :medtop_id)
ON CONFLICT (medtop_id) DO UPDATE
SET medtop_id = EXCLUDED.medtop_id
RETURNING id, parent_id, medtop_id
```

The update assigns `medtop_id` to itself so `RETURNING` yields the existing row. It does not change `name` or `parent_id` on a row that is already stored. Omit `id` so a new row uses the identity.

`DbCategoryRepository.insertByMedtop` runs that statement and returns a `FilingCategory`. The pull calls it before the article statement. `article_categories.category_id` references `categories.id`.

`addToFilingIndex` in `resolve-article-categories.ts` records that row. The parent chain is already in `chainById`. The new chain is the new id followed by the parent chain. A second article on the page with the same medtop id reads that chain and does not insert again.

`buildFilingIndex` still throws before page 1 when a loaded row's parent is missing or when a parent cycle exists. A new topic does not take that path. The pull leaves the index unchanged and warns.

## Gateway filter

`categoryIdSchema` in `apps/gateway/src/domain/articles/articles.validation.ts` calls `isCategoryId`, which reads `categoryCatalog`. A row that exists only in Neon is `Unknown category` and the route returns 400.

Leave `isCategoryId` and `categoryCatalog` as the list for a gateway with no database. Remove the catalog refine from `categoryIdSchema`. The schema still requires a positive integer.

Add `findById` to `CategoryRepository`. The memory class reads `categoryCatalog`. The database class runs `categoryByIdSql`. `listSpatialNews` and `sealSpatialNews` call `findById` when `categoryId` is present. A miss throws a validation error. `handleErrors` maps that error to 400, with the message `Unknown category`.

`GET /api/categories/:id` already uses `findWithChildren`. A Neon row returns 200. An absent row stays 404. The menu query is still `parent_id IS NULL`, so a new child does not join the menu. It appears under its parent.

`app.test.ts` has no database, so `categoryId=999999` stays 400 through the memory class.

## Tests

Rename a test only when its body changes.

- `pull-news.test.ts`: one page of two valid items calls `upsertByApitubeIds` once. The duplicate `apitubeId` case keeps the later filing and calls the batch method once. A coordinate failure warns and does not enter the batch. An unresolved medtop warns once, counts `unknownTopics` as 1, and the article is still in the batch. Two articles with that same medtop warn once.
- `resolve-article-categories.test.ts`: `addToFilingIndex` after a parent that is already indexed makes the next resolve return the new chain. The missing-parent index build still throws.
- `articles.write.test.ts`: the multi-row statement, as above.
- A categories SQL test compiles `insertCategorySql` and asserts `ON CONFLICT (medtop_id)` and `RETURNING`.
- `apitube.client.test.ts`: a category object with `name` keeps that name, and `parentMedtopId` is null.
- `app.test.ts`: the unknown category id stays 400.

## Leave alone

- The `while` loop, `APITUBE_MAX_PAGES`, and the 14-day `published_at.start`.
- `0000_create_articles.sql` and `0001_news_categories.sql`.
- Ids 1 through 18 and General.
- The purge cron. It stays off.
