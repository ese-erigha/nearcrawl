---
name: run-web-localhost
description: >-
  Start the NearCrawl web dev server on port 5173. Use when the user asks to
  run, start, or restart localhost, the local app, or the web app.
---

# Run web localhost

The local app is the web app. Package `web`. Folder `apps/web`. URL `http://localhost:5173/`.

The map is `http://localhost:5173/`. The daily brief is `http://localhost:5173/brief`.

Use pnpm. Never npm or yarn. Never deploy.

## Already running

1. Read the terminals folder. Look for a live `pnpm --filter web dev` or Vite on port 5173.
2. When that process is running, tell the user the URL. Do not start a second server.
3. When the user asks to restart, stop that process, then follow the start steps.

## Start

From the repo root, background this command:

```bash
pnpm --filter web dev
```

Wait until the output contains `Local:`. Then tell the user `http://localhost:5173/`.

When the output contains `EADDRINUSE`, a server is already on port 5173. Report that URL. Do not start another process.
