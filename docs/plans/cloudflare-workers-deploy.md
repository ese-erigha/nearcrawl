# Deploy the gateway Worker

GitHub Actions deploys the gateway. You do not run `wrangler login` for that deploy. The job uses two GitHub secrets. After the Worker exists, you add three secrets in the Cloudflare dashboard.

The Worker name is `nearcrawl-gateway`. The first successful deploy creates it. Do not create a new Cloudflare account. Use the account that already deploys Closetza.

Ingestion and the web app are not in this job.

## GitHub secrets

Add these on the nearcrawl repository. Open Settings, then Secrets and variables, then Actions.

- `CLOUDFLARE_API_TOKEN` lets the job call the Cloudflare API.
- `CLOUDFLARE_ACCOUNT_ID` is the account that owns the Worker.

`DATABASE_URL` is already a GitHub secret. Leave it. It is the direct Neon host, with no `-pooler`. The migrate job uses it. The deploy job does not.

Do not add the pooled database URL, the Realtime secret, or a Sentry DSN as GitHub secrets. Those belong on the Worker.

## Worker secrets, after the deploy

Open the Cloudflare dashboard. Go to Workers & Pages, then `nearcrawl-gateway`, then Settings, then Variables and Secrets. Add each name as a secret.

- `DATABASE_URL` is the pooled Neon URL. The host contains `-pooler`. The Worker reads Neon over HTTP. This is not the GitHub `DATABASE_URL`.
- `NEON_REALTIME_SECRET` seals a live query. A missing value makes `POST /api/spatial/news/live` and `POST /api/articles/:id/live` return 503.
- `NEON_REALTIME_URL` is the Live SQL address. A missing value makes those same routes return 503.
- `SENTRY_DSN` is the client key for the Sentry project `nearcrawl-gateway`. The Worker sends errors only when this value is set. `SENTRY_ENVIRONMENT` is already `production` in `wrangler.toml`.

You can set the same three names with `npx wrangler secret put` from `apps/gateway`. That command needs `npx wrangler login`. The dashboard does not.

## Other requirements

- The page limits stay in `apps/gateway/wrangler.toml` under `[vars]`. The deploy uploads them. They are not secrets.
- `SENTRY_ENVIRONMENT` in that block is `production`. The Worker reports to Sentry after you set `SENTRY_DSN`. Local `pnpm dev` does not set `SENTRY_ENVIRONMENT`, so the SDK stays off.
- The job builds `packages/db` first. The gateway imports `packages/db/dist`.
- Tests must pass. A failed test skips the deploy.
- A changed SQL file runs migrate before the deploy. A failed migrate skips the deploy.
- A push to `develop` deploys when it changes `apps/gateway/`, `packages/`, or `.github/workflows/deploy-staging.yml`.
- A manual run deploys only when you set **Deploy the gateway Worker even when gateway files did not change?** to true.

## Get the Cloudflare secrets

Do this in the browser before the first deploy.

1. Open [https://dash.cloudflare.com](https://dash.cloudflare.com) and pick the Closetza account.
2. Open Workers & Pages. Copy the account id from the page URL. The path looks like `/<account-id>/workers`. That value is `CLOUDFLARE_ACCOUNT_ID`.
3. Open My Profile, then API Tokens, then Create Token, then Create Custom Token.
4. Name the token `nearcrawl-github-ci`.
5. Include that same account. Add these permissions:
   - User, User Details, Read
   - User, Memberships, Read
   - Account, Account Settings, Read
   - Account, Workers Scripts, Edit
6. Skip zone rules, D1, R2, Queues, and Pages. Create the token and copy it once. That value is `CLOUDFLARE_API_TOKEN`.
7. On the nearcrawl GitHub repo, add both names under Actions secrets.

Check: the secret list shows `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, and `DATABASE_URL`.

## Deploy

1. Commit the workflow.
2. Push `develop`.
3. Open the Actions run named Deploy Staging.
4. Wait until the job Deploy gateway is green.
5. Read the `workers.dev` host in that job log.
6. Add the three Worker secrets in the dashboard.
7. Open `https://<that-host>/health`.

Check: the body is `{ "status": "ok" }`. Open `/api/spatial/news` with a bbox. The status is 200. A live route returns 200 after the Realtime secrets exist, and 503 before they exist.

A push without the two Cloudflare secrets fails the deploy job. Add the secrets, then run the workflow by hand with the force-deploy input set to true.
