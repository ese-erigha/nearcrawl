# Ingest the news feed

`apps/ingestion` pulls APITube and writes Neon. The gateway only reads. Part 1 of the gateway is done. This plan is Part 2.

The app today prints a line and waits. Replace that wait with two scheduled jobs on the same Worker. Do not add a request route. The handler reads `controller.cron` and runs one job. A pull failure does not run the purge. A purge failure does not run the pull.

## Folders

```text
packages/db/src/
  article.repository.ts
  category.repository.ts
apps/ingestion/
  wrangler.toml
  src/
    index.ts
    config.ts
    sentry.ts
    pull-news/
      pull-news.ts
      resolve-article-categories.ts
      apitube.client.ts
    purge-articles/
      purge-articles.ts
```

Group by job, not by file type. A flat `src/` mixes the pull and the purge. Cloudflare still runs one Worker. `index.ts` is only the switch on `controller.cron`. The job folders own the work.

- `pull-news/pull-news.ts` runs the pull.
- `pull-news/resolve-article-categories.ts` decides the categories for one APITube item. It does not read the catalog, and it does not write a row. The pull passes the loaded categories and the item. The function returns the pin id and the join ids. `upsertByApitubeId` stores that result.
- `pull-news/apitube.client.ts` calls APITube. The purge does not import it.
- `purge-articles/purge-articles.ts` runs the purge. It does not import the pull folder.
- `config.ts` and `sentry.ts` sit above both jobs. Both jobs use them.
- `article.repository.ts` is the one article repository. The gateway and both jobs construct it. Reads stay `findInBBox`, `findById`, and `listByCategory`. Writes are `upsertByApitubeId` and the purge method.
- `category.repository.ts` is the one category repository. The pull loads `id`, `parent_id`, and `medtop_id` from it. The gateway reads stay on it.

Local dev calls `pull-news/pull-news.ts` once. A test file sits next to the unit it proves. This app does not import the gateway. The gateway keeps `getArticleRepository` and `getCategoryRepository`. Each getter returns the shared class when `DATABASE_URL` is set, and the memory class when it is absent. The memory classes stay in the gateway.

Walletza puts `ExpenseRepository` in `packages/shared/db`. The API and the expense-purge cron both construct that class. NearCrawl does the same with `packages/db`. The class runs the SQL already in that package. It does not use Drizzle. The gateway does not import `drizzle-orm`.

## APITube client

Closetza uses Axios in `apps/pwa`. `createHttpClient` builds one client with a base URL, returns `response.data`, and turns a failed response into an error that carries the status. Tests pass an Axios instance into that factory.

Closetza ingestion does not use Axios. `replicate-api.client.ts` and the fal clients call `fetch`. A non-OK status throws. The caller passes the token and the input. The client owns the URL and the request.

NearCrawl ingestion is a Worker, so it follows the ingestion client, not the PWA client. Do not add the Axios package.

`pull-news/apitube.client.ts` calls `fetch` for `GET /v1/news/everything`. It reads `APITUBE_API_KEY` from config inside the client. `pull-news/pull-news.ts` calls that function and passes the page. It does not pass `fetch` or an Axios instance. A non-OK status throws. Tests mock `apitube.client.ts` the same way gateway tests mock a repository.

## Pull cron

The pull expression is `*/20 * * * *`. It matches `INGESTION_INTERVAL_MINUTES`. That line is off in `wrangler.toml`. Put it back in `crons` to turn the pull on. Change the cron and the var together. The handler does not sleep and does not call `setInterval`.

One invocation does these steps in order.

1. Load `id`, `parent_id`, and `medtop_id` from `categories`. That query is the only category list this app uses. Do not import `categoryCatalog`.
2. Call `apitube.client.ts` for `GET /v1/news/everything`. Page until a page is empty, or until every item on the page is older than the feed window.
3. Leave out an item with no latitude and longitude. Leave out an item whose place name is missing from the title and the opening. Skip an item whose coordinate is outside the article checks (`latitude` from -90 to 90, `longitude` from -180 to 180). None of these items is written.
4. File the item, then call `upsertByApitubeId`.

This job does not delete.

Local `pnpm --filter ingestion dev` runs the pull once, then exits. It does not purge, and it does not wait forever.

## Purge cron

The purge expression is `0 0 * * *`, once a day at 00:00 UTC. That line is off in `wrangler.toml`. The handler still accepts it. Put the expression back in `crons` to turn the purge on. The purge does not call APITube.

One invocation deletes articles whose `published_at` is older than `FEED_RETENTION_DAYS`. `article_categories` rows leave with the article. The foreign key is `ON DELETE CASCADE`. Do not write a second delete.

## Filing

Match each IPTC id on the item to `categories.medtop_id`. General has a null `medtop_id`, so it never matches.

1. Each match adds that category, and every ancestor, to `article_categories`. Walk `parent_id` from the rows loaded in step 1.
2. `articles.category_id` is the pin. Walk each match to its root. The root with the smallest id wins. Ids 1 through 17 are the menu order, Politics first and Human interest last.
3. No match sets `category_id` to the loaded root whose `medtop_id` is null. In the seed that row is 18, General. The join row for that article is that root only.

The pull builds one category index from that load. An unknown medtop id is skipped and counted on the pull log. A missing parent fails the pull.

A topic change on a later pull replaces the join rows for that article. Stale topics do not remain.

The details and the central-bank example are in [news-categories.md](news-categories.md).

## What one upsert writes

`upsertByApitubeId` is the only article write. The key is `apitube_id`. A second pull of the same id updates the row. It does not insert a duplicate.

The method writes these columns:

- `apitube_id`
- `title`
- `summary`
- `body`
- `source_name`
- `source_url`
- `latitude`
- `longitude`
- `category_id`
- `tags`
- `published_at`
- `is_breaking`
- `story_id`

`location` is generated from the coordinates. Do not write it. `id` comes from the database default. `ingested_at` is set on the insert and stays on later updates.

`story_id` is stored for product Phase 2. No gateway route reads it.

Map the APITube JSON fields onto this list when you write the pull. Confirm the field names against a real `/v1/news/everything` payload. Do not invent a second article shape.

The write SQL lives in `packages/db`, next to the gateway read. `upsertByApitubeId` and the purge method live on the shared article repository in that package. The gateway calls the read methods only.

## Purge

```sql
DELETE FROM articles
WHERE published_at < now() - make_interval(days => :retention_days);
```

`:retention_days` is `FEED_RETENTION_DAYS`. The statement uses `now()`, so it stays out of every sealed live query.

## Stay out

- Do not call APITube from the gateway.
- Do not edit `0000_create_articles.sql` or `0001_news_categories.sql`.
- Do not run `drizzle-kit generate` or `drizzle-kit push`.
- The deploy job is `deploy-ingestion` in `.github/workflows/deploy-staging.yml`. A push to `develop` runs it when ingestion files change.
- Auth, bookmarks, briefs, and re-rank are not this part.

## Config

`apps/ingestion/wrangler.toml` holds the limits.

- `INGESTION_INTERVAL_MINUTES` is `20`.
- `FEED_RETENTION_DAYS` is `14`.
- `APITUBE_MAX_PAGES` is `400`. One pull fails when APITube returns more pages than this.

After the Worker exists, set these secrets in the Cloudflare dashboard. They are not GitHub secrets.

- `DATABASE_URL` is the pooled Neon URL. The host contains `-pooler`. This is the same value as on `nearcrawl-gateway`. It is not the direct host stored for the migrate job.
- `APITUBE_API_KEY` is the APITube key. A missing key fails the run.
- `SENTRY_DSN` is the client key for a new Sentry project `nearcrawl-ingestion`.

Add `SENTRY_ENVIRONMENT` = `production` under `[vars]` when the handler is real. Local dev does not set that name, so the SDK stays off.

## Sentry

Create the Sentry project `nearcrawl-ingestion` before the first deploy. The platform snippet does not matter. The Worker uses the Cloudflare SDK, the same way the gateway does.

- A thrown pull or upsert is an Issue and an error log. The pull log counts pulled, upserted, and skipped.
- A thrown purge is an Issue and an error log. The purge log counts purged.
- A skipped item is not an Issue.
- Do not send the APITube key, `DATABASE_URL`, or the article body.

## Tests

- When an item has no coordinates, then the upsert is not called.
- When the same `apitube_id` arrives twice, then one row remains and the join rows match the second filing.
- When the only topic is central bank (`medtop:20000350`), then the pin is Finance and the join includes that topic and each ancestor.
- When no topic matches, then `category_id` is 18.
- When `published_at` is older than the retention window, then the purge deletes that row.
- The sealed gateway SQL still does not contain `now()`.

## Deploy

The job is `deploy-ingestion` in `.github/workflows/deploy-staging.yml`. A push to `develop` runs it when `apps/ingestion/`, `packages/`, or that workflow file changes. A manual run deploys this Worker when **Deploy the ingestion Worker even when ingestion files did not change?** is true.

The Worker name is `nearcrawl-ingestion`. The first deploy creates it. Reuse the GitHub secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`. Do not create a Cloudflare account.

The pull cron is off until you add `*/20 * * * *` back to `crons`. The purge cron is off until you add `0 0 * * *` back to `crons`.

Check after the first successful pull:

1. `GET /api/spatial/news?bbox=-180,-90,180,90` on `nearcrawl-gateway` returns articles.
2. A second pull does not double those articles.
3. An article with no coordinates never appears.

Check after the first purge. An article older than `FEED_RETENTION_DAYS` is gone. A newer article remains.
