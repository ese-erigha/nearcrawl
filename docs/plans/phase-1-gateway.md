# Phase 1 gateway

Phase 1 endpoints for `apps/gateway`, the Neon schema those reads depend on, and Neon Realtime for a viewport that stays open. Auth and rate limiting stay out of this pass. The gateway talks to an `ArticleRepository`. An in-memory fixture implements it until the database is connected. Live routes seal SQL only when `NEON_REALTIME_URL` and `NEON_REALTIME_SECRET` are set.

Bookmarks and reading history stay in the browser. Phase 2 briefs and Phase 3 re-rank are not gateway routes yet.

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
| `category` | no | `Finance`, `Tech`, `Geopolitics`, or `General` |

Example: `/api/spatial/news?bbox=-10,-20,10,30&category=Geopolitics`

The box is inclusive. Latitude must be between -90 and 90, longitude between -180 and 180, and `south` must be less than or equal to `north`. When `west` is less than or equal to `east`, the match is `longitude BETWEEN west AND east`. When `west` is greater than `east`, the box crosses the antimeridian and the match is `longitude >= west OR longitude <= east`.

`category` limits the pins to that IPTC group. Omitting it returns every category.

The handler returns the 200 newest articles in the box, ordered by `published_at` descending and then `id` descending. `truncated` is `true` when more than 200 rows matched. The client draws the heatmap from these pins.

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
      "category": "Geopolitics",
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
| 400 | `bbox` is missing, not four numbers, out of range, or `south` is greater than `north`. `category` is present and not one of the four names. |

### `POST /api/spatial/news/live`

Seals the same bounding-box read as a Neon Realtime live query. The browser subscribes with the sealed value. The secret stays on the gateway.

The client calls this after the globe settles on a viewport. Spinning, drawing a box, and changing category keep using `GET /api/spatial/news` for the immediate pin set, then replace the subscription.

Body:

```json
{
  "bbox": [-10, -20, 10, 30],
  "category": "Geopolitics"
}
```

`bbox` is `[west, south, east, north]`. `category` is optional and uses the same four names.

```json
{
  "sealedQuery": {}
}
```

`sealedQuery` is the opaque value returned by `@neon/realtime/server`. The client passes it to `subscribe` from `@neon/realtime/client` with `NEON_REALTIME_URL`. Each change replaces the pin set for that viewport. The payload matches the `articles` array from `GET /api/spatial/news`, including the 200-row cap. `truncated` is `true` when the live result has 200 rows.

The sealed SQL is the spatial read below, with `ORDER BY published_at DESC, id DESC` so ties are stable. It does not call `now()`. The 14-day window is the purge delete. A deleted row leaves the live result, and an inserted row joins it.

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
  "category": "Geopolitics",
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
| 404 | `{ "error": "Article not found" }` | `getArticle` throws `NotFoundError`. |
| 503 | `{ "error": "Live query sealer is not configured" }` | A live route throws `LiveQuerySealerMissingError`. |
| 500 | `{ "error": "Internal server error" }` | The article repository or the live query sealer throws anything else. |

`handleErrors` reports 500s and a missing live query sealer to Sentry. The 400 and 404 rows stay out of Sentry. The event shape and the credentials are in [Sentry](sentry.md).

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
  category?: 'Finance' | 'Tech' | 'Geopolitics' | 'General'
  limit: 200
}

interface ArticleRepository {
  findInBBox(query: SpatialNewsQuery): Promise<{ rows: ArticleRow[]; truncated: boolean }>
  findById(id: string): Promise<ArticleRow | null>
}
```

`getArticleRepository()` is the seam. It returns the in-memory class until `DATABASE_URL` is set, then a Neon class. Use cases call the getter. They do not construct either class. The [application design](#application-design) section is the layout.

The spatial read, once Neon is connected:

```sql
SELECT id, title, summary, source_name, source_url,
       latitude, longitude, category, tags, published_at, is_breaking
FROM articles
WHERE latitude BETWEEN :south AND :north
  AND (
    (:west <= :east AND longitude BETWEEN :west AND :east)
    OR (:west > :east AND (longitude >= :west OR longitude <= :east))
  )
  AND (:category::text IS NULL OR category = :category)
ORDER BY published_at DESC, id DESC
LIMIT 201;
```

The 201st row is discarded and `truncated` is set. The article read is `SELECT ... FROM articles WHERE id = :id`.

The live queries use that same SQL. Parameters are bound inside the sealed query, so the browser cannot widen the box or drop the category.

## Neon Realtime

Enable Realtime on the `production` branch. The project region `us-east-2` is one of the beta regions. `neon env pull --service realtime` supplies `NEON_REALTIME_URL` and `NEON_REALTIME_SECRET`. The URL is public to the web app. The secret is read only by `apps/gateway`.

What a settled viewport gains:

- The 10-minute APITube pull inserts pins into the open box without another fetch.
- The 14-day purge removes those pins from the globe and the heatmap when the delete commits.
- A corrected title, summary, or `is_breaking` flag on an existing row updates the pin and an open article drawer.
- A category subscription receives only that IPTC group, so a Finance filter does not paint Geopolitics pins that arrived later.

`GET /api/spatial/news` remains the path for pan, zoom, and a newly drawn box. That keeps the first paint on the gateway. The live subscription starts after the viewport has been still. A new box unsubscribes the previous sealed query, paints with `GET /api/spatial/news`, then seals again.

Bookmarks and history stay in IndexedDB. Realtime does not sync them.

Realtime is in beta. The sealed query has to be a read-only deterministic `SELECT`, so the live SQL omits `now()` and `gen_random_uuid()`. There is no row-level security yet. Sealing on the gateway is the access control, and this feed is public. Holding a subscription open does not keep the Neon compute awake. Starting a live query can wake it. During the beta the Realtime service has no charge on the Free plan. Database compute and egress still count against the plan allowance. On the Free plan, exhausting the 100 CU-hours or the 5 GB of public transfer suspends the compute until the next period. It does not add a Realtime bill.

The in-memory fixture has no live feed. The two `POST` routes return 503 until `NEON_REALTIME_URL` and `NEON_REALTIME_SECRET` exist. Tests inject a fake `LiveQuerySealer` and also assert that 503.

## Neon schema

`infra/migrations` will hold this SQL. Ingestion inserts rows and deletes anything older than 14 days. The gateway only reads.

```sql
CREATE EXTENSION IF NOT EXISTS postgis;

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

CREATE INDEX articles_location_gix ON articles USING GIST (location);
CREATE INDEX articles_lat_lng_idx ON articles (latitude, longitude);
CREATE INDEX articles_published_at_idx ON articles (published_at);
CREATE INDEX articles_category_published_at_idx ON articles (category, published_at DESC);
```

`apitube_id` is the ingestion upsert key. `story_id` is stored from APITube and is unused by these routes. Phase 2 divergence reads it.

`location` is the spatial index the globe can grow into. Phase 1 bounding-box reads filter `latitude` and `longitude`, which `articles_lat_lng_idx` serves. The purge uses `articles_published_at_idx`:

```sql
DELETE FROM articles
WHERE published_at < now() - interval '14 days';
```

Articles with no coordinates are not inserted. APITube items that lack a point never become pins.

## Browser schema

Bookmarks and history are IndexedDB database `nearcrawl`, version 1. They are not Neon tables in this phase. A bookmark keeps the article after the 14-day purge deletes the Neon row.

| Store | Key | Record |
| --- | --- | --- |
| `bookmarks` | `id` | `id`, `title`, `summary`, `sourceUrl`, `coordinates.latitude`, `coordinates.longitude`, `tags`, `savedAt` |
| `history` | `id` | `id`, `articleId`, `title`, `openedAt` |

`articleId` on a history row is `articles.id`.

## Application design

Phase 1 uses the Closetza API shape: a Hono app, a thin controller per route group, one use case per endpoint, and a repository getter that reads the database from request context.

Closetza wires it like this.

- `apps/api/src/index.ts` registers `contextStorage()` first, builds config from the Worker env, then mounts `/health` and `/api`.
- `apps/api/src/routes/api.routes.ts` mounts a controller at a prefix. User-owned prefixes copy `:userId` onto the context before the controller runs. Catalog prefixes such as `/brands` do not.
- A controller such as `wardrobe.controller.ts` parses with a Zod schema, calls one use case, and returns `c.json`. `handleErrors` turns a `ZodError` into 400 and an `AppError` into its status. The controller does not touch the database.
- A use case such as `listWardrobeItems` calls `getUserId()` and `getWardrobeItemRepository()`. It throws `NotFoundError` or `ValidationError`. It has no Hono types.
- `getWardrobeItemRepository()` in the API app does `new WardrobeItemRepository(getDb())`. `getDb()` reads the database from Hono context storage. The SQL lives on the repository class in `packages/db`.
- Tests replace `getWardrobeItemRepository` and `getUserId` with `mock.module` before importing the use case.

Phase 1 keeps that split and leaves out the pieces this pass does not need: auth middleware, the `/users/:userId` copier, `getUserId()`, request logging, and OpenAPI. `Variables` still has an optional `userId` so a later route can set it without changing the app type.

```text
apps/gateway/src/
├── index.ts
├── app.ts
├── types.ts
├── config.ts
├── service.ts
├── lib/
│   ├── context.ts
│   └── errors.ts
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

`createConfig` reads `DATABASE_URL`, `NEON_REALTIME_URL`, and `NEON_REALTIME_SECRET`. Any of them may be absent in this pass. `lib/context.ts` exposes `getConfig()`. It does not expose `getUserId()` yet.

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

`articles.validation.ts` holds the schemas. The bbox query is the string `west,south,east,north`. The live body is `{ bbox: [west, south, east, north], category? }`. Both refine the range rules in the endpoint section. `category` is `z.enum(['Finance', 'Tech', 'Geopolitics', 'General']).optional()`. Bodies use `.strict()`.

### Use cases

Each file exports one function. The list and get functions call `getArticleRepository()`, map rows with `articles.mappers.ts`, and return the JSON shape in the endpoint section. `getArticle` throws `NotFoundError` when `findById` returns null.

The seal functions validate through the same bbox rules, then call `getLiveQuerySealer()`. A missing `NEON_REALTIME_URL` or `NEON_REALTIME_SECRET` throws `LiveQuerySealerMissingError`. `sealArticle` also calls `findById` and throws `NotFoundError` before sealing. The sealed SQL is built here, with the box and category bound inside it.

`articles.mappers.ts` turns a row into a pin or an article. `source_name` becomes `sourceName`, `published_at` becomes `publishedAt`. Controllers return the mapped value unchanged.

### Repository

`articles.repository.ts` is only the getter, matching `getWardrobeItemRepository`.

```ts
export function getArticleRepository(): ArticleRepository {
  const databaseUrl = getConfig().databaseUrl
  if (!databaseUrl) {
    return new MemoryArticleRepository()
  }
  return new NeonArticleRepository(databaseUrl)
}
```

`ArticleRepository` is the interface in the repository section. `MemoryArticleRepository` holds the fixture and implements `findInBBox` and `findById`, including the antimeridian split and the 201-row truncation. `NeonArticleRepository` is the later class. It uses the Neon HTTP driver and the SQL in that section. Use cases, controllers, and tests keep calling `getArticleRepository()`.

`live-query-sealer.ts` is the same kind of getter. `getLiveQuerySealer()` returns a `LiveQuerySealer` from `@neon/realtime/server` when both env vars are set, and returns null otherwise. `sealSpatialNews` and `sealArticle` are the only callers. The sealer’s job is `seal(sql)`, which produces the `sealedQuery` those routes return.

### Tests

Use case tests follow Closetza: `mock.module` replaces `getArticleRepository` or `getLiveQuerySealer`, then the test imports the use case. Those tests cover a box hit, a category filter, a box that crosses the antimeridian, truncation, a missing article, a sealed query, and `LiveQuerySealerMissingError`.

Route tests call `app.request(...)`. They cover the 400 validation body, the 404 article body, and the 503 live body when the live query sealer env vars are unset.
