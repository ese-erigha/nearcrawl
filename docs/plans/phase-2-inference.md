# Phase 2 inference service

This plan adds `apps/inference` and three cited answers. The globe drawing stays future work. The page search box calls this service. Phase 3 re-rank stays out.

The host is a paid Render web service in Ohio, on plan `0.5c-512mb`. Neon is in `us-east-2`. Render cannot change the region after creation. A free Render service sleeps. This plan stays awake. The model runs through OpenRouter, so the process does not load a local model.

A Render Blueprint in `render.yaml` defines the service. `.github/workflows/deploy-inference.yml` deploys it after the Python checks pass. Deploy Staging keeps the Workers and the Neon migrate. Add `--filter=!inference` to its turbo command so a missing `uv` install does not fail that workflow.

## Leave these out

- The globe, bookmarks, and the Cloudflare Pages deploy.
- LightGBM, a Render database, and a call to APITube.
- User auth.
- Pull request previews on Render.
- A "what is new" answer and an explanation of the hot list.

## User stories

The page shell stays a later task. The search box on that page is part of this service. Each answer is a stream of text and citations. The service drops a citation whose article id was not in the rows it loaded.

1. As a user, I want to click a news pin and read a short cited explanation of that story, so that I understand the event from the articles already stored for it.
2. As a user, I want a short cited comparison of how outlets in different countries cover that story, so that I can see where their accounts differ.
3. As a user, I want to type a place or a question in the search box, so that I get a cited answer without finding that place on the globe.

## Text search

Story 3 is the search box. `POST /api/search` takes `{ "query" }`. The inference route is `POST /search`. Elasticsearch stays out.

The geocoder is Geoapify on the free plan. `search` calls `GET https://api.geoapify.com/v1/geocode/search` with the place text. The inference service is the only caller. The service stores each place and its box in memory, including a miss, so a repeat spends no credit. Calls stay at or below 5 per second.

The last ` in ` splits the query. `supply chain in East Asia` sends `East Asia` to Geoapify and `supply chain` to the topic lookup. A result counts when `rank.confidence` is at least 0.5 and `bbox` is present. When Geoapify returns no box, the whole query is the topic and the lookup has no box. A place with no leftover words searches that box by time. The topic words do not stop the request.

The search page shows `Powered by Geoapify` and links that text to Geoapify. It also shows `OpenStreetMap` and links that text to `https://www.openstreetmap.org/copyright`. That page stays later work.

```sql
ALTER TABLE articles
  ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    to_tsvector(
      'english',
      coalesce(title, '') || ' ' ||
      coalesce(description, '') || ' ' ||
      coalesce(array_to_string(tags, ' '), '')
    )
  ) STORED;

CREATE INDEX articles_search_vector_idx
  ON articles USING GIN (search_vector);
```

Copy the latitude and longitude check from `spatialNewsSql`, including the antimeridian branch. Add the topic match and the rank.

```sql
AND search_vector @@ websearch_to_tsquery('english', $topic)
ORDER BY ts_rank(search_vector, websearch_to_tsquery('english', $topic)) DESC
LIMIT 12
```

Write that column by hand in a new SQL file. `drizzle-kit generate` stays unused. The English config matches `supply`, `supplies`, and `supplied`. The GIN lookup stays on the matching rows, so a large region does not become a scan of every pin in the box. The model then writes the cited answer from those rows.

## Routes

The browser calls the gateway. The gateway calls Render with `Authorization: Bearer <INFERENCE_SECRET>` and `x-request-id`. `proxyInferenceStream` in `apps/gateway/src/lib/inference-stream.ts` is the one `fetch`. It returns the upstream body when the status is `200` and the content type is `text/event-stream`. It does not buffer the body.

- `POST /api/articles/:id/explanation` proxies `POST /explanations` with `{ "articleId" }`. `articleId` is a UUID. Register it on the articles controller.
- `POST /api/stories/:storyId/comparison` proxies `POST /comparisons` with `{ "storyId" }`. `storyId` is non-empty text, not a UUID. Mount a stories controller at `/api/stories`.
- `POST /api/search` proxies `POST /search` with `{ "query" }`. `query` is trimmed, from 1 to 500 characters. Mount a search controller at `/api/search`.

`GET /health` on Render returns `{ "status": "ok" }`. It does not open Neon and it does not call the model.

Status codes before the stream starts:

- `200` starts `text/event-stream`.
- `400` when validation fails. The body is `{ "error": "Validation failed", "details": [{ "path", "message" }] }`.
- `401` when the bearer secret is missing or wrong. The gateway maps that to `503`, because the secrets differ.
- `404` when the id matches no row.
- `503` when Neon, the model, or Render is unavailable. The body is `{ "error": "Inference service is unavailable" }`.

Stream events are `token` (`{ "text" }`), `citation` (`{ "articleId", "title", "sourceUrl" }`), `empty`, `done`, and `error`. `empty` means no rows, or a comparison with fewer than two `source_country_code` values. A search with no matching topic emits `empty` and still does not call that a client error. Send `: keepalive` at least every 25 seconds while the model is silent.

One request can spend the model key. The article cap and the body-character cap bound that spend. This pass does not add auth.

## Stream

Cloudflare Pages serves the React files and then leaves the path. The open connection is the browser to the Worker, and the Worker to Render.

```text
Browser  --stream-->  Worker  --stream-->  Render
React page            gateway              inference
```

1. The page sends `POST` to the gateway. The search box sends `{ "query" }`. A pin sends the article id.
2. The gateway checks the body and `fetch`es Render with the bearer secret and the same payload.
3. Render finds the articles and starts the model. FastAPI keeps the response open and writes each event as the model produces it. It does not assemble one JSON document first.
4. The gateway returns `response.body` unchanged. It does not call `response.text()` or `response.json()`. Either of those waits for the last byte and the stream ends.
5. `fetch` in the page resolves when the status and headers arrive. The page reads `response.body`, splits events on a blank line, appends each `token`, and stores each `citation`. `done` stops the reader.

`EventSource` does not fit. These routes are `POST` and they send a JSON body.

A token on the wire looks like this.

```text
event: token
data: {"text":"Ports in East Asia "}

```

A one-off JSON body would hold the page until the model finished the paragraph. The stream shows the first words while the rest is still being written, and a citation can appear before the last sentence.

## Service

```text
apps/inference/src/
  main.py
  config.py
  sentry.py
  errors.py
  db.py
  geocode.py
  articles/
    repository.py
  answers/
    schema.py
    context.py
    stream.py
    llm.py
    explain.py
    compare.py
    search.py
```

`package.json` scripts call `uv`: `dev`, `lint` (`ruff`), `typecheck` (`pyright`), and `test` (`pytest`). `build` exits 0. Render runs `uv sync --frozen --no-dev`, then `.venv/bin/uvicorn`.

`config.py` fails at startup when a required value is missing. `db.py` opens an asyncpg pool of 5 on the direct Neon URL. The host has no `-pooler`. A pooled host breaks the statement cache.

A route checks the body and calls one use case. The use case calls `get_article_repository()` and has no FastAPI types. The repository runs one SQL action per method. `explain` loads the clicked article and, when `story_id` is set, the other articles in that story. `compare` loads that story and emits `empty` when the rows cover fewer than two source countries. `search` calls Geoapify, then runs the GIN lookup. All three reads skip duplicates, stay inside `FEED_RETENTION_DAYS`, and stop at `BRIEF_ARTICLE_CAP`.

Each row sent to the model has `id`, `title`, `description`, `body`, `source_name`, `source_country_code`, `published_at`, and `source_url`. Truncate `body` to `BRIEF_BODY_CHARS`. Do not send `body_html`. `llm.py` is the only call to OpenRouter. It posts to `OPENROUTER_BASE_URL` with `Authorization: Bearer <OPENROUTER_API_KEY>`, `stream` set to true, and `model` set to `OPENROUTER_MODEL`. Tests replace that module.

## Sentry

Create the Python project `nearcrawl-inference` on the `nearcrawl` organization. The DSN is the Render secret `SENTRY_DSN`. The SDK starts only when that DSN is set and `SENTRY_ENVIRONMENT` is `production`. `traces_sample_rate` is `0.05` in that case and `0` otherwise. Leave `send_default_pii` off.

- A `200` sends nothing.
- A `400` and a `401` write a warning with `route`, `method`, `requestId`, and `status`.
- A `500` and a `503` call `capture_exception` and write an error log.
- Do not send `DATABASE_URL`, `OPENROUTER_API_KEY`, `GEOAPIFY_API_KEY`, `INFERENCE_SECRET`, the prompt, or the article body.

Write the same line to stdout for the Render log. Add `GET /debug-sentry` for the first check, then remove it. Do not put `SENTRY_AUTH_TOKEN` on the service.

## Environment

Every name below is required. A missing value fails startup. Secrets use `sync: false` on Render. Enter them on the first Blueprint create. Render does not prompt again later.

Render, plain values:

- `PYTHON_VERSION` is `3.13`.
- `SENTRY_ENVIRONMENT` is `production`.
- `FEED_RETENTION_DAYS` is `14`.
- `BRIEF_ARTICLE_CAP` is `12`.
- `BRIEF_BODY_CHARS` is `2000`.
- `OPENROUTER_BASE_URL` is `https://openrouter.ai/api/v1`.
- `OPENROUTER_MODEL` is `openai/gpt-4.1-mini`. Change the model by editing this value.
- `GEOAPIFY_BASE_URL` is `https://api.geoapify.com/v1/geocode/search`.

Render, secrets:

- `DATABASE_URL` is the direct Neon URL. The host has no `-pooler`. It matches the GitHub migrate secret. It is not the Worker pooled URL.
- `OPENROUTER_API_KEY` is the OpenRouter bearer key.
- `INFERENCE_SECRET` is the shared bearer secret. The gateway stores the same string.
- `SENTRY_DSN` is the client key for `nearcrawl-inference`.
- `GEOAPIFY_API_KEY` is the Geoapify key.

Gateway Worker, secrets this feature adds:

- `INFERENCE_URL` is the Render origin with no path.
- `INFERENCE_SECRET` matches the Render secret.

Leave the gateway `SENTRY_DSN` on the gateway project. Do not replace it with the inference DSN.

GitHub Actions:

- `RENDER_DEPLOY_HOOK_URL` is the Render deploy hook.

Do not put `OPENROUTER_API_KEY`, `GEOAPIFY_API_KEY`, `INFERENCE_SECRET`, or a DSN in GitHub. Local `.env.var` uses a dummy secret and a local `INFERENCE_URL`. Leave `SENTRY_ENVIRONMENT` unset so the SDK stays off.

## Blueprint

`autoDeployTrigger` is `off`. Turn off Blueprint auto-redeploy after the first create. The GitHub Action is the only deploy. `maxShutdownDelaySeconds` is `120`.

```yaml
services:
  - type: web
    name: nearcrawl-inference
    runtime: python
    branch: develop
    rootDir: apps/inference
    region: ohio
    plan: 0.5c-512mb
    numInstances: 1
    autoDeployTrigger: off
    healthCheckPath: /health
    maxShutdownDelaySeconds: 120
    buildCommand: curl -LsSf https://astral.sh/uv/install.sh | sh && $HOME/.local/bin/uv sync --frozen --no-dev
    startCommand: .venv/bin/uvicorn src.main:app --host 0.0.0.0 --port $PORT
    buildFilter:
      paths:
        - apps/inference/**
        - render.yaml
    envVars:
      - key: PYTHON_VERSION
        value: "3.13"
      - key: SENTRY_ENVIRONMENT
        value: production
      - key: FEED_RETENTION_DAYS
        value: "14"
      - key: BRIEF_ARTICLE_CAP
        value: "12"
      - key: BRIEF_BODY_CHARS
        value: "2000"
      - key: OPENROUTER_BASE_URL
        value: https://openrouter.ai/api/v1
      - key: OPENROUTER_MODEL
        value: openai/gpt-4.1-mini
      - key: GEOAPIFY_BASE_URL
        value: https://api.geoapify.com/v1/geocode/search
      - key: DATABASE_URL
        sync: false
      - key: OPENROUTER_API_KEY
        sync: false
      - key: GEOAPIFY_API_KEY
        sync: false
      - key: INFERENCE_SECRET
        sync: false
      - key: SENTRY_DSN
        sync: false
```

## GitHub Action

The workflow runs on a push to `develop` when `apps/inference/`, `render.yaml`, or the workflow file changes. `workflow_dispatch` deploys only when `force_deploy` is true.

1. `test` installs `uv`, then runs `ruff`, `pyright`, and `pytest` in `apps/inference`.
2. `deploy` sends `POST` to `RENDER_DEPLOY_HOOK_URL` when `test` succeeds on `develop`.

A failed test does not call the hook. The workflow does not migrate and does not deploy a Worker.

## Tests

Use a fake model and a fake database. Do not call OpenRouter or Neon.

- When the health route is called, then the body is `{ "status": "ok" }`.
- When the bearer secret is wrong, then an answer route returns 401.
- When the clicked article exists, then the explanation stream cites only rows from that story.
- When the story has one source country, then the comparison stream emits `empty` and `done`.
- When the story has two source countries, then the comparison stream cites both.
- When the model returns an unknown article id, then the stream omits that citation.
- When the article id is unknown, then the explanation route returns 404.
- When the story id is unknown, then the comparison route returns 404.
- When the search text is `supply chain in East Asia`, then the lookup uses that topic inside the East Asia box.
- When the search text has no place, then the topic lookup still streams an answer.
- When the same place is searched again, then Geoapify is called once.
- When the explanation id is valid, then the gateway sends the bearer secret and returns the stream.
- When Render is unreachable, then the gateway returns 503.

## Setup

1. Create the Sentry project and copy the DSN.
2. In Render, choose New, then Blueprint. Connect the repo. Set the branch to `develop`. Enter `DATABASE_URL`, `OPENROUTER_API_KEY`, `GEOAPIFY_API_KEY`, `INFERENCE_SECRET`, and `SENTRY_DSN`.
3. Copy the deploy hook into `RENDER_DEPLOY_HOOK_URL`. Turn off Blueprint auto-redeploy.
4. Run Deploy Inference with `force_deploy` set to true. Open `/health`.
5. Add `INFERENCE_URL` and `INFERENCE_SECRET` on the gateway Worker, then force-deploy the gateway.
6. Call `POST /api/search` with `supply chain in East Asia`. The response is an event stream.
7. Hit `GET /debug-sentry`, then delete that route.
