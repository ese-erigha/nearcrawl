# nearcrawl

NearCrawl puts world news on a 3D globe, so you can read what is happening in any place.

## Workspace

One pnpm workspace. Turborepo runs the Phase 1 apps.

- `apps/web` — React + Vite UI. Globe canvas, drawers, and IndexedDB bookmarks and history.
- `apps/gateway` — auth, bounding-box news query, and article reads.
- `apps/ingestion` — APITube pull and the 14-day feed purge.
- `infra/migrations` — database schema.

`apps/inference` arrives in Phase 2. Neon and Cloudflare deployment are follow-ups.

## Scripts

```bash
pnpm install
pnpm dev
pnpm build
pnpm test
```

`pnpm dev` starts every app. The web app is at http://localhost:5173.

Run one app with `pnpm --filter web dev`.
