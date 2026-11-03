# System Architecture Document: NearCrawl (Global Spatial Intelligence Canvas)

## 1. Executive Summary
NearCrawl is architected as a modern, distributed, edge-native web application. The presentation layer, the edge gateway, background ingestion, and the Python inference service are separate apps. `apps/gateway` serves bounding-box news reads and keeps sub-50ms latency on that path. `apps/inference` writes a cited pin explanation, a coverage comparison, and a search answer. `apps/ingestion` pulls APITube in the background. State management leverages a **Local-First persistence pattern** (IndexedDB) for zero-cost bookmarking and offline capability.

---

## 2. High-Level System Topology

```text
[ Browser / Client PWA ]
         │ (HTTPS / SSE / JSON)
         ▼
[ apps/web · Cloudflare Pages ]
  └── React + Globe.gl UI and Local-First IndexedDB bookmarks
         │
         ▼
[ apps/gateway · Cloudflare Worker ]
  ├── Authentication and rate limiting
  ├── Bounding-box news query and article reads
  └── Forwards a brief or a re-rank
         │
         ├──────────────────────────────┐
         ▼                              ▼
[ apps/inference ]               [ Neon PostgreSQL + PostGIS ]
 FastAPI on Render                Bounding-box reads and article reads
 asyncpg TCP pool                 HTTP driver from apps/gateway
  ├── Regional briefs over SSE
  └── LightGBM re-rank
         │
         ▼
[ Neon PostgreSQL + PostGIS ]

[ apps/ingestion · Cloudflare Cron ]
  └── APITube pull, store, 14-day purge
         │
         ▼
[ Neon PostgreSQL + PostGIS ]
  HTTP driver, same as apps/gateway
```

---

## 3. Tier-by-Tier Component Breakdown

### Tier 1: Presentation Layer (`apps/web`)
The Phase 1 UI is future work. Return to the globe, bookmarks, and the Pages deploy later.
* Technology: React, TypeScript, Tailwind CSS, Globe.gl (Three.js WebGL canvas).
* Hosting: Cloudflare Pages.
* Responsibilities:
  - Renders the 60 FPS 3D interactive WebGL globe canvas.
  - Handles user click events, spatial bounding box drawing, and radius selections.
  - Manages UI state for side drawers, AI intelligence briefs, and the multi-perspective Divergence View.
  - Manages client-side offline storage and state persistence for bookmarks and reading history via Local-First IndexedDB.

### Tier 2: Edge API Gateway (`apps/gateway`)
* Technology: Cloudflare Workers (TypeScript / Web APIs).
* Responsibilities:
  - Global Routing: Terminates incoming HTTPS traffic at the edge across 330+ Cloudflare data centers globally.
  - Authentication and rate limiting for each user request.
  - Bounding-box news query and article reads against Neon PostgreSQL, using Neon's serverless HTTP driver (@neondatabase/serverless).
  - Edge Caching: Caches high-frequency bounding box lookups and static metadata to minimize database load.
  - Forwards a pin explanation, a comparison, or a search to `apps/inference`.

### Tier 3: Inference (`apps/inference`)
* Technology: Python FastAPI, Pydantic. `uv` runs the package. Turborepo starts it through `package.json` scripts.
* Hosting: A paid Render web service, in the same region as Neon. The free Render service spins down. The paid service stays running.
* Responsibilities:
  - Pin explanation, coverage comparison, and search. Search calls Geoapify for a bounding box, then reads Neon. The model is OpenRouter. The service streams the answer.
  - Phase 3 re-rank stays out of this service.

### Tier 4: Background Ingestion (`apps/ingestion`)
* Technology: Cloudflare Cron Triggers.
* Responsibilities:
  - Pulls the APITube API on `INGESTION_INTERVAL_MINUTES`, stores the articles, and purges rows older than `FEED_RETENTION_DAYS`. Both vars are in `apps/ingestion/wrangler.toml`. Writes go through the same Neon HTTP driver as the gateway.
  - Stays off the user request path. The gateway does not ingest.

### Tier 5: Data Storage Tier
* Primary Database: Neon PostgreSQL + PostGIS. Stores normalized articles, spatial geometries, spatial indexes, and user profile sync data.
* Client Storage Tier: Browser IndexedDB. Stores user bookmarks and history locally for zero-cost, instant-access persistence.

---

## 4. Request Lifecycle Scenarios

### Scenario A: User Loads the 3D Globe (Read Path)
1. Browser requests static assets from `apps/web` on Cloudflare Pages.
2. User spins the globe and focuses on a viewport bounding box.
3. Client issues an API request (GET /api/spatial/news?bbox=...) to `apps/gateway`.
4. `apps/gateway` queries Neon PostgreSQL directly over HTTP using the serverless driver.
5. Neon returns pin coordinates and summary metadata in < 30ms, and the gateway responds directly to the client.

### Scenario B: User Requests a Regional Intelligence Brief (AI RAG Path)
1. User draws a bounding polygon and clicks "Generate Intelligence Brief."
2. The request hits `apps/gateway`, which forwards it to `apps/inference` on Render.
3. `apps/inference` reads the stored articles for that area from Neon PostgreSQL.
4. `apps/inference` passes the context to the LLM and streams the markdown brief back through Server-Sent Events (SSE).

### Scenario C: User Saves an Article Bookmark (Local-First Path)
1. User clicks the bookmark icon on any article card or AI brief.
2. The client application serializes the full article metadata and coordinates.
3. The data is written instantly (< 5ms) to the browser's IndexedDB storage, ensuring offline availability and permanent survival past the rolling feed purge cycle.

---

## 5. Database Integration & Connection Patterns

### A. Connecting `apps/gateway` to Neon (HTTP Serverless Driver)
Because Cloudflare Workers run in serverless V8 isolates, standard persistent TCP connections can fail. `apps/gateway` and `apps/ingestion` use Neon's HTTP driver. The gateway reads. Ingestion inserts articles and runs the purge. The window is `FEED_RETENTION_DAYS`.

```typescript
import { neon } from '@neondatabase/serverless';

export default {
  async fetch(request, env) {
    const sql = neon(env.DATABASE_URL);
    const articles = await sql`
      SELECT id, title, latitude, longitude 
      FROM articles 
      WHERE latitude BETWEEN 10 AND 20
    `;
    return Response.json(articles);
  },
};
```

### B. Connecting `apps/inference` on Render to Neon (asyncpg)
Render runs the FastAPI process in Ohio, next to Neon. The service opens an asyncpg pool of 5 on the direct Neon URL. The host has no `-pooler`. The route handlers do not write SQL. A repository method runs one query.

---

## 6. Deployment & Scalability Strategy
* Zero-Downtime Static Distribution: Global CDN via Cloudflare Pages ensures instant UI load times.
* Elastic Edge Compute: Cloudflare Workers absorb traffic spikes and handle low-latency request routing.
* Serverless PostgreSQL Scaling: Neon decouples compute from storage, allowing instant database scaling without connection pooling bottlenecks.
* Vertical/Horizontal Scalability: The `apps/inference` service on Render stays on one paid instance so a stream does not wait for a cold start. Phase 3 re-rank stays out.

---

## 7. Directory Structure & Repository Layout

The NearCrawl repo is one pnpm workspace. Turborepo runs every app.

`apps/web`, `apps/gateway`, and `apps/ingestion` are JavaScript. `apps/inference` is Python. That package has a `pyproject.toml` and a `package.json`. The package scripts call `uv`. `turbo run test` runs the JavaScript tests and those scripts.

`apps/gateway` handles each user request. That includes auth, the bounding-box news query, and article reads. A pin explanation, a comparison, or a search goes from the gateway to `apps/inference`. `apps/ingestion` runs in the background.

```text
nearcrawl/
├── package.json                      # pnpm workspace root
├── pnpm-workspace.yaml               # apps/*
├── turbo.json                        # task pipeline for every app
├── .github/
│   └── workflows/
│       ├── deploy-staging.yml        # checks, then Neon migrations, on develop
│       └── deploy-inference.yml      # Python checks, then the Render deploy hook
├── docs/
│   └── prd.md
├── apps/
│   ├── web/                          # React globe. Cloudflare Pages.
│   │   ├── package.json
│   │   └── src/
│   │       ├── components/           # 3D globe, drawers, Divergence View
│   │       └── services/             # IndexedDB bookmarks and history
│   ├── gateway/                      # Worker. Auth, bounding-box news query, article reads.
│   │   └── package.json
│   ├── ingestion/                    # Worker cron. Pull APITube, store articles, purge the 14-day feed.
│   │   └── package.json
│   └── inference/                    # Python FastAPI. Explanation, comparison, and search.
│       ├── package.json              # scripts call uv
│       └── pyproject.toml
└── infra/
    └── migrations/                   # database schema
```
