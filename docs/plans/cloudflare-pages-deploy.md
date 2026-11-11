# Deploy the web app

The web app is not on Cloudflare Pages yet. A push of `apps/web` to `develop` deploys it. The workflow is `.github/workflows/deploy-web-staging.yml`.

Local `http://127.0.0.1:5173/brief` stays on the Vite dev server. The page calls `http://127.0.0.1:5173/api/briefs?country=CA`. Vite proxies `/api` to `http://127.0.0.1:8787`. That call never reaches the production Worker.

On Pages, the browser still calls `/api` on the site host. `apps/web/functions/api/[[path]].ts` forwards that request to the Worker `nearcrawl-gateway`.

Deploy the gateway before the first website deploy. The site calls that Worker.

## Names

- Pages project: `nearcrawl-web`
- Production branch: `develop`
- Worker: `nearcrawl-gateway`
- Binding name: `GATEWAY`
- Site: `https://nearcrawl-web.pages.dev`

## GitHub secrets

The workflow uses the same two secrets as the Worker deploy.

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_TOKEN`

The token from [cloudflare-workers-deploy.md](cloudflare-workers-deploy.md) skips Pages. Edit that token. Add account permission Cloudflare Pages, Edit. Save the token. A token without that permission fails the website job.

## What the workflow does

A push to `develop` starts the workflow when it changes `apps/web` or `.github/workflows/deploy-web-staging.yml`. You can also open Actions, then Deploy Website, then Run workflow.

The job does four things.

1. It runs lint, the type check, the tests, and the Vite build for `web`.
2. It creates the Pages project `nearcrawl-web` when that project is missing. The production branch is `develop`.
3. It uploads `apps/web/dist` and `apps/web/functions`.
4. It publishes that upload to the production branch.

Leave the Git provider empty. A connected repo builds on Cloudflare and can replace this upload.

## Service binding

Add the binding after the project exists.

Dashboard: Workers & Pages, then `nearcrawl-web`, then Settings, then Bindings, then Add, then Service binding.

- Variable name: `GATEWAY`
- Service: `nearcrawl-gateway`
- Environment: Production

`apps/web/wrangler.toml` names this binding. The live Function uses the dashboard binding. Run Deploy Website again after you add the binding.

## Check

1. Open `https://nearcrawl-web.pages.dev/brief`.
2. In the browser network list, the brief request host is `nearcrawl-web.pages.dev`.
3. The path is `/api/briefs?country=CA`.
4. The status is 200.

A request to `http://127.0.0.1:5173/api/briefs` is still the local proxy. It does not prove the Pages deploy.
