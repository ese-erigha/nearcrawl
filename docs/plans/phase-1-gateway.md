# Phase 1 backend

Backend work is two parts. Part 1 is `apps/gateway`. Part 2 is `apps/ingestion`. Auth and rate limiting stay out. Product Phase 2 briefs and Phase 3 re-rank are not routes yet.

Only `apps/ingestion` calls APITube. It pulls `/v1/news/everything` and writes Neon. `apps/gateway` reads that table and seals live queries. The gateway never requests APITube.

`apps/web` stays the shell that is already in the repo. Neither part draws the globe, subscribes from the browser, writes IndexedDB, or initializes `@sentry/react`. The JSON shapes below are the contract that shell will call later.

The articles SQL is `infra/migrations/0000_create_articles.sql`. The matching Drizzle table is `packages/db/src/schema/articles.ts`. `packages/db/src/client.ts` opens Neon with the HTTP driver. GitHub Actions applies that SQL on a push to `develop`. The gateway reads `articles` only after that migrate job has succeeded.

Local `.env.var` has `DATABASE_URL`, `SENTRY_DSN`, `NEON_REALTIME_URL`, and `NEON_REALTIME_SECRET`. That file stays gitignored. An empty `SENTRY_DSN` leaves the SDK off, which is how `pnpm dev` avoids the free-tier quota. A missing Realtime URL or secret makes the live routes return 503. Credentials and the event rules are in [Sentry](sentry.md). Part 1 uses the gateway rows of that doc and skips the web section.

## Part 1 — Gateway

Build this first. The feed stays empty until Part 2 writes rows. Reads of an empty table are valid.

| In | Out |
| --- | --- |
| `apps/gateway` routes, use cases, Neon reads, live query sealing | `apps/web` UI, browser Realtime client, IndexedDB |
| Sentry on the gateway process (`@sentry/hono`) | Sentry on the web app. The web project and its DSN stay unused until that app is built |
| `packages/db` and `infra/migrations/0000_create_articles.sql`, which are already written | A new SQL file. Do not generate one |
| | Part 2. The ingestion stub stays until the gateway can read `articles` |
| | Cloudflare deploy. `index.ts` listens with `@hono/node-server` |

## Part 2 — Ingestion

Start this after Part 1 reads `articles`. `apps/ingestion` stays off the request path.

- Pull APITube `/v1/news/everything` on the interval in `INGESTION_INTERVAL_MINUTES`. That var is in `apps/ingestion/wrangler.toml`.
- Skip an item that has no coordinates.
- `upsertByApitubeId` writes the columns APITube owns. `story_id` is stored and unused until product Phase 2.
- Category labels follow [news-categories.md](news-categories.md). The menu is 17 top-level categories, and every APITube topic under them is a subcategory the reader can filter. Ingestion files each topic on that row and on every ancestor.
- One purge method deletes rows whose `published_at` is older than `FEED_RETENTION_DAYS` in that same file. That `DELETE` uses `now()`, so it stays out of every sealed query.
- Sentry project `nearcrawl-ingestion` is created with this part. The gateway project is already enough for Part 1.

The gateway use cases keep calling `findInBBox` and `findById`. They do not gain a write method.

## User id

Closetza puts user-owned routes under `/api/users/:userId/...`. Middleware copies that path param onto the Hono context, and use cases call `getUserId()` instead of taking the id as an argument. The repository then receives `userId` and scopes the query. Catalog routes such as `/api/brands` sit outside that prefix and never read a user id.

Phase 1 news is one shared feed. These routes follow the catalog pattern:

- `GET /health`
- `GET /api/spatial/news`
- `POST /api/spatial/news/live`
- `GET /api/articles/:id`
- `POST /api/articles/:id/live`

None of them call `getUserId()`. The Hono app still installs context storage, so a later `/users/:userId` route can set `userId` the same way Closetza does. There is no `users` table in this phase.

## Endpoints

### `GET /health`

Reports that the process is serving requests.

```json
{ "status": "ok" }
```

### `GET /api/spatial/news`

Pins and summary metadata for the current globe viewport.

Query:

| Name | Required | Shape |
| --- | --- | --- |
| `bbox` | yes | `west,south,east,north` as decimal degrees. West and east are longitude. South and north are latitude. |
| `categoryId` | no | An integer primary key from the category catalog, such as `6` (Finance) or `204` (central bank) |

Example: `/api/spatial/news?bbox=-10,-20,10,30&categoryId=1`

The box is inclusive. Latitude must be between -90 and 90, longitude between -180 and 180, and `south` must be less than or equal to `north`. When `west` is less than or equal to `east`, the match is `longitude BETWEEN west AND east`. When `west` is greater than `east`, the box crosses the antimeridian and the match is `longitude >= west OR longitude <= east`.

`categoryId` limits the pins to that category and every topic filed under it. Omitting it returns every category. The integers are in [news-categories.md](news-categories.md). An unknown integer is a 400.

The handler returns the newest articles in the box, up to `SPATIAL_NEWS_CAP` in `apps/gateway/wrangler.toml`. Order is `published_at` descending, then `id` descending. `truncated` is `true` when more rows matched. The client draws the heatmap from these pins.

```json
{
  "articles": [
    {
      "id": "6b1c0c3e-1f4a-4a0e-9c1d-2a6f0b9e8d11",
      "title": "Port closure",
      "summary": "Shipping halted overnight.",
      "sourceName": "Harbor Desk",
      "sourceUrl": "https://example.com/port",
      "latitude": 1.3,
      "longitude": 103.8,
      "categoryId": 1,
      "categories": [{ "id": 1, "name": "Politics" }],
      "tags": ["shipping"],
      "publishedAt": "2026-10-26T12:00:00.000Z",
      "isBreaking": false
    }
  ],
  "truncated": false
}
```

Errors:

| Status | When |
| --- | --- |
| 400 | `bbox` is missing, not four numbers, out of range, or `south` is greater than `north`. `categoryId` is present and not in the catalog. |

### `POST /api/spatial/news/live`

Seals the same bounding-box read as a Neon Realtime live query. The browser subscribes with the sealed value. The secret stays on the gateway.

The client calls this after the globe settles on a viewport. Spinning, drawing a box, and changing category keep using `GET /api/spatial/news` for the immediate pin set, then replace the subscription.

Body:

```json
{
  "bbox": [-10, -20, 10, 30],
  "categoryId": 1
}
```

`bbox` is `[west, south, east, north]`. `categoryId` is optional and uses the same integers as the GET.

```json
{
  "sealedQuery": {}
}
```

`sealedQuery` is the opaque value returned by `@neon/realtime/server`. The client passes it to `subscribe` from `@neon/realtime/client` with `NEON_REALTIME_URL`. Each change replaces the pin set for that viewport. The payload matches the `articles` array from `GET /api/spatial/news`, including the same cap. `truncated` is `true` when the live result hits that cap.

The sealed SQL is the spatial read below, with `ORDER BY published_at DESC, id DESC` so ties are stable. It does not call `now()`. The feed window is the purge delete. A deleted row leaves the live result, and an inserted row joins it. The window length is `FEED_RETENTION_DAYS` in `apps/ingestion/wrangler.toml`.

Errors:

| Status | When |
| --- | --- |
| 400 | Same bbox and category rules as `GET /api/spatial/news`. |
| 503 | The live query sealer is not configured. Body is `{ "error": "Live query sealer is not configured" }`. |

### `GET /api/articles/:id`

One article for the drawer. `id` is the article uuid.

```json
{
  "id": "6b1c0c3e-1f4a-4a0e-9c1d-2a6f0b9e8d11",
  "title": "Port closure",
  "summary": "Shipping halted overnight.",
  "body": "The port stopped night traffic after the channel was closed.",
  "sourceName": "Harbor Desk",
  "sourceUrl": "https://example.com/port",
  "latitude": 1.3,
  "longitude": 103.8,
  "categoryId": 1,
  "categories": [{ "id": 1, "name": "Politics" }],
  "tags": ["shipping"],
  "publishedAt": "2026-10-26T12:00:00.000Z",
  "isBreaking": false
}
```

Errors:

| Status | When |
| --- | --- |
| 400 | `id` is not a uuid. |
| 404 | No article has that id. |

### `POST /api/articles/:id/live`

Seals `SELECT` of that article. The open drawer subscribes after `GET /api/articles/:id` paints it. An ingestion update to the row, including `is_breaking`, title, or summary, replaces the drawer contents. Closing the drawer unsubscribes.

Errors:

| Status | When |
| --- | --- |
| 400 | `id` is not a uuid. |
| 404 | No article has that id. |
| 503 | The live query sealer is not configured. |

### Errors

Controllers wrap every handler in `handleErrors`, the same helper Closetza uses.

| Status | Body | When |
| --- | --- | --- |
| 400 | `{ "error": "Validation failed", "details": [{ "path", "message" }] }` | Zod rejected the query, body, or id. |
| 404 | `{ "error": "Article not found" }` or `{ "error": "Category not found" }` | `getArticle` or `getCategory` throws `NotFoundError`. |
| 503 | `{ "error": "Live query sealer is not configured" }` | A live route throws `LiveQuerySealerMissingError`. |
| 500 | `{ "error": "Internal server error" }` | The article repository or the live query sealer throws anything else. |

`handleErrors` reports 500s and a missing live query sealer to Sentry. The 400 and 404 rows stay out of Sentry. Wiring is in [Sentry on the gateway](#sentry-on-the-gateway).

## Repository

```ts
type BBox = {
  west: number
  south: number
  east: number
  north: number
}

type SpatialNewsQuery = {
  bbox: BBox
  categoryId?: number
  limit: number
}

interface ArticleRepository {
  findInBBox(query: SpatialNewsQuery): Promise<{ rows: ArticleRow[]; truncated: boolean }>
  findById(id: string): Promise<ArticleRow | null>
  listByCategory(categoryId: number, limit: number): Promise<ArticleRow[]>
}
```

`getArticleRepository()` is the seam. It returns the in-memory class until `DATABASE_URL` is set, then `DbArticleRepository`, which calls `createDbClient` from `packages/db`. Use cases call the getter. They do not construct either class. The spatial use cases pass `SPATIAL_NEWS_CAP` from `apps/gateway/wrangler.toml` as `limit`. The [application design](#application-design) section is the layout.

The spatial read:

```sql
SELECT id, title, summary, source_name, source_url,
       latitude, longitude, category_id, tags, published_at, is_breaking
FROM articles
WHERE latitude BETWEEN :south AND :north
  AND (
    (:west <= :east AND longitude BETWEEN :west AND :east)
    OR (:west > :east AND (longitude >= :west OR longitude <= :east))
  )
  AND (
    :categoryId::int IS NULL
    OR EXISTS (
      SELECT 1 FROM article_categories
      WHERE article_categories.article_id = articles.id
        AND article_categories.category_id = :categoryId
    )
  )
ORDER BY published_at DESC, id DESC
LIMIT 201;
```

The 201st row is discarded and `truncated` is set. The article read is `SELECT ... FROM articles WHERE id = :id`.

The live queries use that same SQL. Parameters are bound inside the sealed query, so the browser cannot widen the box or drop the category.

## Neon Realtime

Realtime is enabled on the `production` branch in `us-east-2`. Local `.env.var` holds `NEON_REALTIME_URL` and `NEON_REALTIME_SECRET`. The URL is the Live SQL address the browser will use. The secret stays on `apps/gateway`.

To copy them again: Neon Console → the project → Postgres database → Realtime. The same pair is `neon realtime enable` on the linked branch, then `neon env pull --service realtime`, which writes `.env.local` (or `.env` if that file exists). Copy the two names into `.env.var`. Do not commit either value.

The gateway does not stream rows. `POST /api/spatial/news/live` checks the box, seals that `SELECT` with the secret, and returns `sealedQuery`. When `apps/web` is built, the page paints with `GET /api/spatial/news`, then calls `subscribe` from `@neon/realtime/client` with `NEON_REALTIME_URL` and `sealedQuery`. Neon pushes the result to the open page when a matching row is inserted, updated, or deleted.

What the open globe gains from that subscription:

- Ingestion inserts an article inside the box, and the pin appears while the globe stays still.
- A title, summary, or `is_breaking` change replaces the pin and an open drawer.
- The purge deletes the row, and the pin leaves the globe. The window is `FEED_RETENTION_DAYS`.
- A category filter stays inside the sealed SQL, so a finance subscription does not receive a later story that is only filed under sport.

Moving the globe drops the subscription, paints with `GET /api/spatial/news`, and seals the new box. That subscribe step belongs to `apps/web` and is not built in this pass. The gateway only validates the box and returns `sealedQuery`.

Bookmarks and history are not part of this pass. Realtime does not sync them.

Realtime is in beta. The sealed query has to be a read-only deterministic `SELECT`, so the live SQL omits `now()` and `gen_random_uuid()`. There is no row-level security yet. Sealing on the gateway is the access control, and this feed is public. Holding a subscription open does not keep the Neon compute awake. Starting a live query can wake it. During the beta the Realtime service has no charge on the Free plan. Database compute and egress still count against the plan allowance. On the Free plan, exhausting the 100 CU-hours or the 5 GB of public transfer suspends the compute until the next period. It does not add a Realtime bill.

The in-memory fixture has no live feed. The two `POST` routes return 503 until `NEON_REALTIME_URL` and `NEON_REALTIME_SECRET` exist. Tests inject a fake `LiveQuerySealer` and also assert that 503.

## Neon schema

The article table is in `infra/migrations/0000_create_articles.sql`. Categories, `article_categories`, and `articles.category_id` are in `infra/migrations/0001_news_categories.sql`. The Drizzle tables in `packages/db` match those files, including the PostGIS `geography` column. The gateway only reads. `0001` reaches Neon when the migrate job on `develop` applies it.

`apitube_id` is the ingestion upsert key. `story_id` is stored for Phase 2 and is unused by these routes. Bounding-box reads filter `latitude` and `longitude`. `location` is the spatial index for a later query shape.

The purge, when ingestion is built, is:

```sql
DELETE FROM articles
WHERE published_at < now() - make_interval(days => :retention_days);
```

`:retention_days` is `FEED_RETENTION_DAYS` from `apps/ingestion/wrangler.toml`.

That statement uses `now()`, so it stays out of every sealed live query. Articles with no coordinates are not inserted. The gateway never writes those rows.

## Application design

Phase 1 uses the Closetza API shape: a Hono app, a thin controller per route group, one use case per endpoint, and a repository getter that reads the database from request context.

Closetza wires it like this.

- `apps/api/src/index.ts` registers `contextStorage()` first, builds config from the Worker env, then mounts `/health` and `/api`.
- `apps/api/src/routes/api.routes.ts` mounts a controller at a prefix. User-owned prefixes copy `:userId` onto the context before the controller runs. Catalog prefixes such as `/brands` do not.
- A controller such as `wardrobe.controller.ts` parses with a Zod schema, calls one use case, and returns `c.json`. `handleErrors` turns a `ZodError` into 400 and an `AppError` into its status. The controller does not touch the database.
- A use case such as `listWardrobeItems` calls `getUserId()` and `getWardrobeItemRepository()`. It throws `NotFoundError` or `ValidationError`. It has no Hono types.
- `getWardrobeItemRepository()` in the API app does `new WardrobeItemRepository(getDb())`. `getDb()` reads the database from Hono context storage. The SQL lives on the repository class in `packages/db`.
- Tests replace `getWardrobeItemRepository` and `getUserId` with `mock.module` before importing the use case.

Phase 1 keeps that split and leaves out the pieces this pass does not need: auth middleware, the `/users/:userId` copier, `getUserId()`, and OpenAPI. `Variables` still has an optional `userId` so a later route can set it without changing the app type. Request failures go to Sentry, not to a separate logger.

```text
apps/gateway/src/
├── index.ts
├── app.ts
├── types.ts
├── config.ts
├── service.ts
├── lib/
│   ├── context.ts
│   ├── errors.ts
│   └── sentry.ts
├── routes/
│   └── health.routes.ts
└── domain/
    └── articles/
        ├── articles.controller.ts
        ├── spatial-news.controller.ts
        ├── articles.validation.ts
        ├── articles.mappers.ts
        ├── articles.repository.ts
        ├── memory-article.repository.ts
        ├── live-query-sealer.ts
        └── usecases/
            ├── list-spatial-news.usecase.ts
            ├── get-article.usecase.ts
            ├── seal-spatial-news.usecase.ts
            └── seal-article.usecase.ts
```

`index.ts` listens with `@hono/node-server` for `pnpm --filter gateway dev`. `app.ts` exports the Hono app and its `fetch` handler, which is the Worker entry when Cloudflare is added.

`app.ts` follows the Closetza entry order. Context storage is first. The next middleware builds config from the environment and stores it with `c.set('config', config)`. Routes mount after that.

```ts
app.use('*', contextStorage())
app.use('*', async (c, next) => {
  c.set('config', createConfig(c.env))
  await next()
})
app.route('/health', healthRoutes)
app.route('/api/spatial/news', spatialNewsController)
app.route('/api/articles', articlesController)
```

`createConfig` reads `DATABASE_URL`, `NEON_REALTIME_URL`, `NEON_REALTIME_SECRET`, `SENTRY_DSN`, and `SENTRY_ENVIRONMENT`. Any of them may be absent. An empty `SENTRY_DSN` disables Sentry. `lib/context.ts` exposes `getConfig()`. It does not expose `getUserId()` yet.

`app.ts` registers `sentry()` from `@sentry/hono/cloudflare` before the routes. The SDK starts when `SENTRY_DSN` is set and `SENTRY_ENVIRONMENT` is `production`. `tracesSampleRate` is `0.05` in that case, and `0` otherwise. `dataCollection` leaves user info, headers, and bodies off.

`GET /health` returns `{ "status": "ok" }` and does not open a database. Closetza's health route pings its database. That check waits until `DATABASE_URL` is wired.

### Controllers

`spatial-news.controller.ts` is mounted at `/api/spatial/news`. `articles.controller.ts` is mounted at `/api/articles`. Paths inside each file are relative, which is how Closetza mounts `wardrobe.controller.ts` at `/users/:userId/wardrobe` and declares `/items` inside the file.

```ts
app.get(
  '/',
  handleErrors(async (c) => {
    const query = spatialNewsQuerySchema.parse(c.req.query())
    return c.json(await listSpatialNews(query))
  }),
)

app.post(
  '/live',
  handleErrors(async (c) => {
    const body: unknown = await c.req.json().catch(() => ({}))
    const parsed = spatialNewsLiveBodySchema.parse(body)
    return c.json(await sealSpatialNews(parsed))
  }),
)
```

The article controller does the same for `GET /:id` and `POST /:id/live`. Zod parses the id. A missing row is a `NotFoundError` from the use case, not a branch in the controller.

`articles.validation.ts` holds the spatial schemas. The bbox query is the string `west,south,east,north`. The live body is `{ bbox: [west, south, east, north], categoryId? }`. Both refine the range rules in the endpoint section. `categoryId` must be an integer in `categoryCatalog`. Bodies use `.strict()`. `categories.controller.ts` serves `GET /api/categories`, `GET /api/categories/:id`, and `GET /api/categories/:id/articles`. A missing category id is a 404.

### Use cases

Each file exports one function. The list and get functions call `getArticleRepository()`, map rows with `articles.mappers.ts`, and return the JSON shape in the endpoint section. `getArticle` throws `NotFoundError` when `findById` returns null.

The seal functions validate through the same bbox rules, then call `getLiveQuerySealer()`. A missing `NEON_REALTIME_URL` or `NEON_REALTIME_SECRET` throws `LiveQuerySealerMissingError`. `sealArticle` also calls `findById` and throws `NotFoundError` before sealing. The sealed SQL is built here, with the box and category bound inside it.

`articles.mappers.ts` turns a row into a pin or an article. `source_name` becomes `sourceName`, `published_at` becomes `publishedAt`. Controllers return the mapped value unchanged.

### Repository

### Sentry on the gateway

Account, projects, and token setup stay in [Sentry](sentry.md). This pass initializes the gateway project only.

`handleErrors` reports after it maps the throw:

- `ZodError` and `NotFoundError` return their JSON and do not call Sentry.
- `LiveQuerySealerMissingError` calls `Sentry.captureException` and `Sentry.logger.error` with `route` and `requestId`, then returns 503.
- Any other throw calls `Sentry.captureException` and `Sentry.logger.error`, then returns 500 `{ "error": "Internal server error" }`. The client still does not receive the exception message.

`requestId` is `crypto.randomUUID()`, stored on the Hono context, and copied onto the Sentry scope for that request. A log record includes `route`, `method`, and `requestId`. It does not include `DATABASE_URL`, `NEON_REALTIME_SECRET`, `SENTRY_AUTH_TOKEN`, request headers, or the article body.

`SENTRY_AUTH_TOKEN` is a CI secret for source maps. The gateway process does not read it. Local `pnpm dev` leaves `SENTRY_DSN` empty. A temporary `GET /debug-sentry` is how the [Sentry](sentry.md) doc checks ingest, and that route is removed after the issue appears. It is not a Phase 1 endpoint.

### Repository

`articles.repository.ts` is only the getter, matching `getWardrobeItemRepository`.

```ts
export function getArticleRepository(): ArticleRepository {
  const databaseUrl = getConfig().databaseUrl
  if (!databaseUrl) {
    return new MemoryArticleRepository()
  }
  return new DbArticleRepository(databaseUrl)
}
```

`ArticleRepository` is the interface in the repository section. `MemoryArticleRepository` holds the fixture and implements `findInBBox` and `findById`, including the antimeridian split and the 201-row truncation. `DbArticleRepository` takes the client from `createDbClient(databaseUrl)` and runs the SQL in that section. Use cases, controllers, and tests keep calling `getArticleRepository()`.

`live-query-sealer.ts` is the same kind of getter. `getLiveQuerySealer()` returns a `LiveQuerySealer` from `@neon/realtime/server` when both env vars are set, and returns null otherwise. `sealSpatialNews` and `sealArticle` are the only callers. The sealer’s job is `seal(sql)`, which produces the `sealedQuery` those routes return.

### Tests

Use case tests follow Closetza: `mock.module` replaces `getArticleRepository` or `getLiveQuerySealer`, then the test imports the use case. Those tests cover a box hit, a category filter, a box that crosses the antimeridian, truncation, a missing article, a sealed query, and `LiveQuerySealerMissingError`.

Route tests call `app.request(...)`. They cover the 400 validation body, the 404 article body, and the 503 live body when the live query sealer env vars are unset.
