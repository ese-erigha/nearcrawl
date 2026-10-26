# Product Requirement Document (PRD)

## Project Name: NearCrawl — Global Spatial Intelligence Canvas (PWA)

---

## 1. Executive Summary & Objective

### 1.1 Executive Summary
NearCrawl is a real-time, interactive Progressive Web Application (PWA) that visualizes global news, geopolitical events, economic developments, and regional breaking stories on a 3D Earth canvas. Designed to eliminate news fragmentation and regional bias, NearCrawl pairs **Cloudflare Pages and Workers** with **Neon PostgreSQL + PostGIS** and **APITube's pre-enriched global news API**, completely bypassing the need for expensive scrapers, manual geocoding, or always-on application servers in its initial stage.

To manage technical complexity, NearCrawl follows a lean, stepwise evolutionary path: starting with a 100% serverless 3D spatial news globe, adding AI-synthesized regional research briefs and news divergence analysis in Phase 2, and introducing machine learning personalization and cross-device state synchronization in Phase 3. User bookmarks, reading history, and offline state are managed via a **Local-First persistence strategy** (IndexedDB) that keeps infrastructure costs strictly at **$0/month**.

### 1.2 Core Objective
To build a high-performance, cost-optimized spatial intelligence platform across three evolutionary phases:
1. **Phase 1 (MVP Stage):** A Cloudflare edge architecture delivering an interactive 3D WebGL globe (Globe.gl / React) powered by a 14-day rolling window of APITube news stored in Neon PostgreSQL + PostGIS. Includes Local-First IndexedDB bookmarking and bounding-box spatial filtering (`BETWEEN`). The gateway and the ingestion cron use Neon's HTTP driver.
2. **Phase 2 (Spatial RAG & Synthesis):** An AI-powered research engine streaming grounded, cited regional intelligence briefs and side-by-side news divergence views (`/v1/news/story`) using LLM synthesis over APITube's structured context.
3. **Phase 3 (Personalization & Machine Learning):** Explicit onboarding preference filters combined with an implicit Two-Stage Learning-to-Rank (LTR) pipeline using a Python-hosted LightGBM model to re-rank map pins based on user clickstream signals.

---

## 2. Product Architecture & System Overview

                      [ User Spatial Selection / Query ]
                                      │
                                      ▼
              [ apps/web · React + Globe.gl on Cloudflare Pages ]
                                      │
                   ┌──────────────────┴──────────────────┐
                   ▼                                     ▼
     [ apps/gateway · Cloudflare Worker ]      [ Local-First Storage (IndexedDB) ]
     Auth, bounding-box news query,             (Bookmarks, History & Offline State)
     article reads
                   │
        ┌──────────┴──────────┐
        ▼                     ▼
 [ Neon PostgreSQL + PostGIS ]     [ apps/inference · FastAPI on Render ]
 (Rolling 14-Day Feed)                Briefs (Phase 2) and LightGBM re-rank (Phase 3)
 HTTP driver from apps/gateway        asyncpg TCP pool
        ▲
        │ HTTP driver
 [ apps/ingestion · Cron ] ──► APITube

---

## 3. Core Features & User Stories

### Epic 1: Spatial 3D Globe & Heatmap Exploration (Phase 1 MVP)
- **US-1.1:** As a user, I want to view a responsive 3D globe with interactive pins and activity heatmaps so that I can visually identify real-time breaking news clusters globally without typing text queries.
- **US-1.2:** As a user, I want to click any country, region, or city pin—or draw a spatial bounding box—so that I can filter news strictly to that physical area (`BETWEEN lat1 AND lat2`).
- **US-1.3:** As a user, I want to filter the map display by primary IPTC news categories (*Finance, Tech, Geopolitics, General*) using APITube's pre-classified taxonomy tags.
- **US-1.4:** As a user, I want to click a bookmark icon on any article or brief so that the full article metadata and coordinates are saved to my browser's IndexedDB, allowing me to access my saved items offline and even after the article is purged from the global rolling feed.

### Epic 2: Multi-Source Spatial RAG & Divergence Briefings (Phase 2)
- **US-2.1:** As a user, I want to request an automated "Regional Intelligence Brief" for any selected bounding area so that NearCrawl streams a synthesized summary with inline citations using pre-stored APITube articles.
- **US-2.2:** As a user, I want to query the globe in natural language ("What are the major supply chain developments in East Asia this week?") and receive grounded, cited answers using geographically constrained APITube contexts.
- **US-2.3:** As a user, I want to open a "Divergence View" on major international stories to compare side-by-side how news outlets from different countries cover the exact same event, utilizing APITube’s native story cluster IDs (`/v1/news/story`).

### Epic 3: Personalization & Real-Time Streaming Feed (Phase 3)
- **US-3.1:** As a user, I want to set default home regions, preferred topics, and tracked entities during onboarding so that my initial application load highlights my primary interests immediately.
- **US-3.2:** As an authenticated user, I want my saved bookmarks and reading history to sync automatically across devices to a dedicated snapshot table in the cloud database.
- **US-3.3:** As a user, I want my personal feed to dynamically re-rank based on implicit reading signals (clicks, dwell time, skips) using a custom LightGBM model so that the app continuously adapts to my habits.
- **US-3.4:** As a PWA, I want web push notifications for critical breaking news spikes (`is_breaking`) in my tracked regions.

---

## 4. Technical Requirements & Stepwise Architecture

### 4.1 Stepwise Implementation Phases

PHASE 1: MVP (Serverless Spatial News Foundation)
├── apps/web — React + Globe.gl 3D canvas on Cloudflare Pages (PWA)
├── apps/gateway — auth, bounding-box news query, and article reads
├── apps/ingestion — Cloudflare Cron fetches APITube news every 10 minutes and purges the 14-day feed
├── Neon PostgreSQL + PostGIS operating a rolling 14-day news window with a spatial index
└── Local-First IndexedDB implementation for persistent user bookmarks & history
                         │
                         ▼
PHASE 2: Intelligence & RAG Synthesis Layer
├── apps/inference — Python FastAPI on a paid Render web service, in the same region as Neon, for LLM orchestration
├── Streaming Server-Sent Events (SSE) for RAG "Regional Intelligence Briefs"
├── Side-by-side "Divergence View" UI comparing multi-perspective global coverage via story IDs
└── DeepEval / Ragas evaluation suite inside apps/inference/evals
                         │
                         ▼
PHASE 3: Two-Stage Machine Learning Personalization
├── Redis feature store tracking user interaction signals (clicks, dwell time, skips)
├── Cloud database sync (`user_bookmarks` snapshot table) for cross-device state, served by apps/gateway
└── apps/inference/recsys — LightGBM Learning-to-Rank (LTR) re-ranking

### 4.2 Data Storage & Lifecycle Strategy
- **Active News Feed (Neon PostgreSQL + PostGIS):** Stores incoming APITube news items. Operates on a **rolling 14-day window** where articles older than 14 days are automatically purged via `apps/ingestion` (`DELETE FROM articles WHERE published_at < NOW() - INTERVAL '14 days'`).
- **User Bookmarks & History (Local-First IndexedDB):** Saves complete snapshot copies of bookmarked articles (Title, Summary, Source URL, Coordinates, Tags) inside the client browser. Bookmarks remain permanently accessible even after the original news article is purged from Neon.
- **Historical Backfill (APITube API):** Deep historical queries beyond 14 days are fetched directly from APITube's API archives on demand rather than stored locally.

### 4.3 Connections to Neon

Two apps on Cloudflare open Neon with the HTTP driver. Workers cannot keep a TCP connection open. `apps/gateway` reads articles for a bounding box. `apps/ingestion` inserts articles and runs the 14-day purge.

`apps/inference` runs on a paid Render web service, in the same region as Neon. It opens Neon with a TCP pool through `asyncpg`. The gateway forwards a brief or a re-rank to this app. The code for both connections is in `architecture.md`, section 5.

---

## 5. Non-Functional Requirements & Performance SLAs

| Metric / Dimension | Target SLA / Requirement | Phase Target |
| :--- | :--- | :--- |
| Baseline Infrastructure Cost | **$0.00 / month** | Phase 1 (MVP) |
| PWA Performance | Lighthouse Score > 90 across Performance & PWA criteria | Phase 1 (MVP) |
| Globe Frame Rate | Constant 60 FPS on desktop and modern mobile devices | Phase 1 (MVP) |
| Spatial API Latency | < 30 ms for a bounding-box read from Neon through the HTTP driver | Phase 1 (MVP) |
| Bookmark Load Speed | < 5 ms via direct browser IndexedDB reads | Phase 1 (MVP) |
| RAG Briefing Latency | < 2.5 seconds end-to-end via streaming Server-Sent Events (SSE) | Phase 2 |
| RecSys Inference | < 50 ms for LightGBM candidate re-ranking | Phase 3 |
| Offline Capabilities | Fully cached UI shell, map tiles, and saved IndexedDB bookmarks | Phase 1 (MVP) |

---

## 6. Directory Structure & Repository Layout

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
│       └── deploy-staging.yml        # checks, then Neon migrations, on develop
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
    └── migrations/                   # Neon schema
```

---

## 7. Stepwise Implementation Milestones

### Phase 1: MVP (Serverless Spatial News Foundation)
- [ ] Set up `apps/web` on Cloudflare Pages for the React + Globe.gl PWA.
- [ ] Create a Neon project with PostGIS and apply a spatial index on the article coordinates.
- [ ] Deploy `apps/gateway` for auth, the bounding-box news query, and article reads through the Neon HTTP driver.
- [ ] Deploy `apps/ingestion` to pull APITube `/v1/news/everything` every 10 minutes into Neon through the same HTTP driver.
- [ ] Implement client-side IndexedDB persistence for offline article bookmarking and reading history.
- [ ] Build the 14-day purge in `apps/ingestion` (`DELETE FROM articles WHERE published_at < NOW() - INTERVAL '14 days'`).

### Phase 2: RAG Intelligence & Divergence Briefings
- [ ] Deploy `apps/inference` on a paid Render web service, in the same region as Neon, for LLM orchestration.
- [ ] Connect the Neon article read in `apps/inference` (asyncpg) to streaming SSE endpoints for "Regional Intelligence Briefs."
- [ ] Implement UI drawer for side-by-side "Divergence View" using APITube story cluster IDs (`/v1/news/story`).
- [ ] Set up DeepEval / Ragas evaluation harness in CI/CD pipeline.

### Phase 3: Personalization Engine (LightGBM RecSys)
- [ ] Implement explicit interest onboarding modal to handle the Cold Start Problem.
- [ ] Set up Redis interaction logger tracking implicit clickstream signals (clicks, dwell time, skips).
- [ ] Deploy `user_bookmarks` database sync table for cross-device bookmarking.
- [ ] Train and deploy the LightGBM Learning-to-Rank (LTR) pipeline in `apps/inference/recsys`.