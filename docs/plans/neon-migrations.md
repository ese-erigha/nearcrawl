# Neon migrations

Push SQL to the git branch `develop`. GitHub Actions applies that SQL to the Neon database before anything else deploys.

## Names

Two names in the old plan were easy to mix up. This workflow uses one git branch and one database.

- **`develop`** is the git branch. You commit the SQL, push `develop`, and the workflow runs. A push to any other git branch does nothing. Git `main` is not part of this workflow.
- **The database** is the Neon database already created for this project. The workflow uses the GitHub secret `DATABASE_URL`. That secret is the direct connection string (the host has no `-pooler`).

The Neon console calls its database branch `production`. That is a label inside Neon. It is not the git branch `main`. This workflow does not pick a Neon branch. The connection string already points at the database.

## GitHub secret

Yes. GitHub Actions reads the connection string from a repository secret. It does not read `.env.var`. That file stays on your machine, and `.env.*` is gitignored.

Store one secret.

| Name | Value | Used by |
| --- | --- | --- |
| `DATABASE_URL` | The direct connection string from local `DATABASE_URL`. The host has no `-pooler`. | `drizzle-kit migrate` |

Leave `DATABASE_URL_POOLED` off GitHub. The migrate job does not use the pooled host. This workflow does not call the Neon API, so it does not need `NEON_API_KEY` or `NEON_PROJECT_ID`.

1. Open the repository on GitHub.
2. Go to Settings → Secrets and variables → Actions.
3. Choose New repository secret.
4. Set the name to `DATABASE_URL`.
5. Paste the direct connection string without the quotation marks. The `"` characters in `.env.var` wrap the value. They are not part of the URL. Do not paste the string into this doc.
6. Save the secret. GitHub shows the name after that. It does not show the value again.

The migrate job maps it like this:

```yaml
env:
  DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

The same steps are in [neon.md](../neon.md), section "GitHub Actions".

## What you change

Drizzle is the query layer. The SQL is written by hand. CI does not generate SQL.

Same split as Closetza: `@closetza/db` is a handwritten Drizzle schema that matches SQL CI has already applied, and `infra/d1/migrations` is handwritten SQL. Closetza applies that SQL with Wrangler to D1. NearCrawl applies it with `drizzle-kit migrate` to Neon.

| Piece | Where | Who writes it |
| --- | --- | --- |
| Drizzle tables | `packages/db` | You, by hand, so gateway and ingestion can query |
| SQL files | `infra/migrations` | You, by hand |
| Apply | `drizzle-kit migrate` | GitHub Actions, on `develop` |

Do not run `drizzle-kit generate` without `--custom`. That command writes SQL from the TypeScript schema. Do not run `drizzle-kit push`.

`pnpm db:new <name>` runs `drizzle-kit generate --custom --name=<name>`. That creates an empty SQL file and registers it in `infra/migrations/meta/_journal.json`. You fill in the SQL. You then update the Drizzle tables in `packages/db` so they match.

The first file is the `articles` SQL in [phase-1-gateway.md](phase-1-gateway.md), section "Neon schema", including `CREATE EXTENSION postgis` and the generated `geography` column. Drizzle will not invent that SQL. PostGIS and the generated column are why the file is handwritten.

A file that has been applied stays as it is. The next change is a new file from `pnpm db:new`.

## Workflow

File: `.github/workflows/deploy-staging.yml`.

Closetza's `.github/workflows/deploy-staging.yml` is the pattern. A push to `develop` detects what changed. The migrate job runs when SQL changed. Every deploy job lists `migrate` in `needs` and runs only when migrate succeeded or was skipped. A failed migrate skips the deploys. The summary job then fails the workflow.

```text
push to develop
      │
      ▼
detect-changes
      │
      ▼
migrate                  if a file in infra/migrations/*.sql changed
      │
      ├── deploy-gateway     needs migrate
      ├── deploy-ingestion   needs migrate
      └── deploy-web         needs migrate
      │
      ▼
summary                  fails the workflow if migrate failed
```

Trigger:

```yaml
on:
  push:
    branches:
      - develop
    paths:
      - "apps/gateway/**"
      - "apps/ingestion/**"
      - "apps/web/**"
      - "packages/**"
      - "infra/**"
      - ".github/workflows/deploy-staging.yml"
  workflow_dispatch:
    inputs:
      apply_migrations:
        description: "Apply database migrations?"
        type: boolean
        default: true
```

`detect-changes` sets `migrations` to `true` when the push diffs a file matching `infra/migrations/*.sql`. A `workflow_dispatch` sets `migrations` from `apply_migrations`. This is the same check Closetza uses for `infra/d1/migrations`.

`migrate` needs `detect-changes` and runs when `migrations == 'true'`.

1. Checkout, pnpm, Node 24.
2. `pnpm install --frozen-lockfile`.
3. `pnpm exec drizzle-kit migrate` with `DATABASE_URL` set to the secret.

No Drizzle generate step. Closetza prints "Skipping Drizzle generation — curated manual migrations only" and then applies the files. This job does the same.

`drizzle-kit migrate` reads the journal, runs each SQL file not yet listed in the `drizzle.__drizzle_migrations` table, and records it. A second push with no new SQL file skips this job.

The secret's host must not contain `-pooler`. `drizzle-kit migrate` opens a direct Postgres connection. The pooled host is for the apps at runtime, later, under a different name.

## Downstream jobs

Gateway, ingestion, and web do not have a Cloudflare deploy yet. Add each deploy job in this same file when that app gets one. Until then the workflow is `detect-changes` → `migrate` → `summary`.

Each deploy job copies the Closetza gate. `deploy-api-staging` in Closetza `needs` the migrate job and runs only when migrate succeeded or was skipped:

```yaml
deploy-gateway:
  needs: [detect-changes, migrate]
  if: |
    always() &&
    needs.detect-changes.outputs.gateway == 'true' &&
    (needs.migrate.result == 'success' || needs.migrate.result == 'skipped')
```

`deploy-ingestion` and `deploy-web` use the same `if`, with their own change flag. `always()` is required. Without it, GitHub skips the deploy job when migrate is skipped, and a push that only changes app code would never deploy.

`summary` also uses `always()`. When `migrations` was `true` and the migrate result is not `success` or `skipped`, the summary step exits 1. That is how Closetza turns a failed migration into a red workflow after the deploy jobs have already been skipped.

## Proof

1. Push the first SQL file to `develop`. The migrate job is green. `articles` and `postgis` exist on the Neon database. `drizzle.__drizzle_migrations` has one row.
2. Push a gateway change with no new SQL file. Migrate is skipped. A later gateway deploy is allowed to run.
3. Push a SQL file that fails. Migrate is red. Gateway, ingestion, and web deploys do not run. The summary job fails.
