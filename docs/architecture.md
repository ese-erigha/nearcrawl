# System Architecture Document: NearCrawl (Global Spatial Intelligence Canvas)

## 1. Executive Summary
NearCrawl is architected as a modern, distributed, edge-native web application. The presentation layer, the edge gateway, background ingestion, and the Python inference service are separate apps. `apps/gateway` serves bounding-box news reads and keeps sub-50ms latency on that path. `apps/inference` writes regional briefs and runs LightGBM re-rank. `apps/ingestion` pulls APITube in the background. State management leverages a **Local-First persistence pattern** (IndexedDB) for zero-cost bookmarking and offline capability.

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
  - Forwards a brief request or a re-rank request to `apps/inference`.

### Tier 3: Inference (`apps/inference`)
* Technology: Python FastAPI, Pydantic. `uv` runs the package. Turborepo starts it through `package.json` scripts.
* Hosting: A paid Render web service, in the same region as Neon. The free Render service spins down. The paid service stays running.
* Responsibilities:
  - Regional briefs: synthesizes context from stored articles and streams markdown back through Server-Sent Events (SSE).
  - Re-rank: runs the Stage-2 LightGBM Learning-to-Rank model on user clickstream feature vectors. The ranker lives in `apps/inference/recsys`.
  - Evals: DeepEval / Ragas live in `apps/inference/evals`. They are not a deployed app.

### Tier 4: Background Ingestion (`apps/ingestion`)
* Technology: Cloudflare Cron Triggers.
* Responsibilities:
  - Pulls the APITube API every 10 minutes, stores the articles, and purges the 14-day feed. Writes go through the same Neon HTTP driver as the gateway.
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
Because Cloudflare Workers run in serverless V8 isolates, standard persistent TCP connections can fail. `apps/gateway` and `apps/ingestion` use Neon's HTTP driver. The gateway reads. Ingestion inserts articles and runs the 14-day purge.

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

### B. Connecting `apps/inference` on Render to Neon (Async SQLAlchemy & asyncpg)
Render runs the FastAPI process in the same region as Neon. The paid service keeps a TCP connection pool open with asyncpg:

```python
import os
from fastapi import FastAPI
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text

app = FastAPI()
DATABASE_URL = os.getenv("DATABASE_URL").replace("postgresql://", "postgresql+asyncpg://")

engine = create_async_engine(DATABASE_URL, echo=True)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

@app.get("/spatial/query")
async def query_spatial_data(min_lat: float, max_lat: float):
    async with AsyncSessionLocal() as session:
        query = text("""
            SELECT id, title, summary 
            FROM articles 
            WHERE latitude BETWEEN :min_lat AND :max_lat
        """)
        result = await session.execute(query, {"min_lat": min_lat, "max_lat": max_lat})
        return {"articles": result.mappings().all()}
```

---

## 6. Deployment & Scalability Strategy
* Zero-Downtime Static Distribution: Global CDN via Cloudflare Pages ensures instant UI load times.
* Elastic Edge Compute: Cloudflare Workers absorb traffic spikes and handle low-latency request routing.
* Serverless PostgreSQL Scaling: Neon decouples compute from storage, allowing instant database scaling without connection pooling bottlenecks.
* Vertical/Horizontal Scalability: The `apps/inference` service on Render scales as compute demands for briefs and LightGBM re-rank grow. Use a paid instance so a brief stream does not wait for a cold start.

---

## 7. Directory Structure & Repository Layout

The NearCrawl repo is one pnpm workspace. Turborepo runs every app.

`apps/web`, `apps/gateway`, and `apps/ingestion` are JavaScript. `apps/inference` is Python. That package has a `pyproject.toml` and a `package.json`. The package scripts call `uv`. `turbo run test` runs the JavaScript tests and those scripts.

`apps/gateway` handles each user request. That includes auth, the bounding-box news query, and article reads. A brief or a re-rank goes from the gateway to `apps/inference`. `apps/ingestion` runs in the background.

```text
nearcrawl/
├── package.json                      # pnpm workspace root
├── pnpm-workspace.yaml               # apps/*
├── turbo.json                        # task pipeline for every app
├── .github/
│   └── workflows/
│       └── eval_and_ci.yml           # tests and evals
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
│   └── inference/                    # Python FastAPI. Briefs and LightGBM re-rank.
│       ├── package.json              # scripts call uv
│       ├── pyproject.toml
│       ├── evals/                    # DeepEval / Ragas. Not a deployed app.
│       └── recsys/                   # Phase 3 ranker.
└── infra/
    └── migrations/                   # database schema
```
