# Sentry

NearCrawl uses Sentry on the free Developer plan for error reports and application logs. The `nearcrawl` organization stays on that plan. Spend above a quota is dropped for the rest of the billing period. It is not billed.

Quotas below are the Developer plan volumes Sentry published on 27 August 2025. The September 2026 plan update kept the error quota and kept the plan free. Confirm the numbers on the subscription page after the org is created, because Sentry meters them per organization.

| Category | Monthly allowance |
| --- | --- |
| Price | $0 |
| Users | 1 |
| Errors | 5,000 events |
| Logs | 5 GB |
| Application metrics | 5 GB |
| Tracing | 5,000,000 spans |
| Session replays | 50 |
| Attachments | 1 GB |
| Cron monitors | 1 |
| Uptime monitors | 1 |
| Lookback | 30 days |

One user means one login for this organization. A second person who needs a seat here is a paid Team plan. Quotas belong to `nearcrawl`. Every project in this organization shares them. A new project does not add another 5,000 errors.

A later product gets its own organization and its own Developer plan. That organization has its own 5,000 errors, its own members, and its own bill if it is upgraded. This login can own both organizations.

## Account setup

Do this once, in the browser, before any SDK is initialized. The values to copy are listed at the end of this section.

### Account

1. Open [https://sentry.io/signup](https://sentry.io/signup).
2. Create the account with email, Google, or GitHub.
3. When Sentry asks for the organization, set the display name to `NearCrawl` and the slug to `nearcrawl`. The slug is the subdomain, `https://nearcrawl.sentry.io`, and it cannot be changed later. If `nearcrawl` is taken, pick another lowercase slug of letters, numbers, and hyphens, and use that slug as `SENTRY_ORG`.
4. Set the data region to United States. The region cannot be changed later. It matches the Neon project in `us-east-2`.

A new organization starts a 14-day Business trial. Leave the trial alone. Do not add a credit card. Sentry does not bill the trial, and the organization returns to the Developer plan when the 14 days end. Adding a card and choosing Team or Business ends the trial and starts a paid subscription.

### Team

Sentry creates a team during signup. Put every NearCrawl project on that team. This product does not need a second team.

### Projects

```text
nearcrawl
└── team created at signup
    ├── nearcrawl-web
    ├── nearcrawl-gateway
    ├── nearcrawl-ingestion     added with that app
    └── nearcrawl-inference     added with that app
```

1. Open the organization menu in the top left and choose Projects.
2. Choose Create Project.
3. Choose the React platform. Name the project `nearcrawl-web`. In the Team dropdown, choose the team from signup. Leave the alert setting on high-priority issues. Choose Create Project.
4. On the React setup page, copy the DSN out of the `Sentry.init` snippet. That value is `VITE_SENTRY_DSN`.
5. Return to Projects and choose Create Project again.
6. Choose the Node platform. Name the project `nearcrawl-gateway`. Choose the same team. Choose Create Project.
7. Copy the DSN from that setup page. That value is `SENTRY_DSN`.

`nearcrawl-ingestion` and `nearcrawl-inference` are created the same way when those apps exist. Each one gets its own DSN. The organization token already covers them.

The platform choice only picks the setup snippet. The gateway still uses `@sentry/hono` on Node. Each project has its own DSN. The web app sends to `nearcrawl-web`. The gateway sends to `nearcrawl-gateway`.

To copy a DSN again later, open the project, then Settings → SDK Setup → Client Keys (DSN), and copy the DSN string. That page can also revoke a DSN. The public key alone is not the DSN.

### Organization slug and project slugs

`SENTRY_ORG` is the organization slug. Read it from the browser hostname (`nearcrawl` in `https://nearcrawl.sentry.io`) or from Organization Settings → General Settings → Organization Slug.

`SENTRY_PROJECT` is the project slug. For these names, the slug matches the project name: `nearcrawl-web` or `nearcrawl-gateway`. The project URL is `https://nearcrawl.sentry.io/projects/nearcrawl-web/`. Source map upload uses one slug per build. The team name is not an environment variable.

### Organization token

This token uploads source maps. It is the only API credential this phase needs. Sentry calls it an organization auth token. A personal token and a legacy API key are not used.

1. Open Settings → Developer Settings → Organization Tokens.
2. Create a token and name it `nearcrawl-source-maps`.
3. Organization tokens have a fixed CI permission set. Sentry does not offer a scope checklist for this token type. That set covers source map upload. Leave it as Sentry creates it.
4. Copy the token immediately. Sentry shows the full value once. The list after that shows only the last characters. A lost token is replaced by creating another one and revoking the old one.

That copied value is `SENTRY_AUTH_TOKEN`. Store it in the CI secret store. It does not go in `apps/web` or in the gateway process.

### Values to keep

| Copied from | Env name |
| --- | --- |
| `nearcrawl-web` Client Keys (DSN) | `VITE_SENTRY_DSN` |
| `nearcrawl-gateway` Client Keys (DSN) | `SENTRY_DSN` |
| Organization slug | `SENTRY_ORG` |
| Project slug for the build being uploaded | `SENTRY_PROJECT` |
| Organization token `nearcrawl-source-maps` | `SENTRY_AUTH_TOKEN` |

`SENTRY_ENVIRONMENT` is not issued by Sentry. Set it to `production` on the deployed apps and `development` locally.

## What gets sent

The current backend pass instruments `apps/gateway` only. `apps/web` keeps its project and DSN, and the web SDK waits until that app is built. `apps/ingestion` and `apps/inference` get a project when those apps are built.

| Event | Sentry |
| --- | --- |
| Unhandled exception, or a 500 from the article repository or the live query sealer | Error event, plus an error log |
| `LiveQuerySealerMissingError` in production | Error event |
| Warning from a failed repository call that the handler already turned into a 500 | Error log |
| Validation failure (400) and unknown article (404) | Nothing. These are expected responses. |
| Successful `GET /health`, `GET /api/spatial/news`, and `GET /api/articles/:id` | Nothing |
| Browser console noise, session replay, profiling | Off |

Logs go through `Sentry.logger`. The gateway does not also print those lines to stdout. A log record includes `route`, `method`, and `requestId`. It does not include `DATABASE_URL`, `NEON_REALTIME_SECRET`, `SENTRY_AUTH_TOKEN`, request headers, or the article body.

Tracing stays on at `tracesSampleRate: 0.05` in production so a slow bounding-box read can be opened from the error. Development sends nothing.

`sendDefaultPii` stays off. There is no signed-in user in this phase, so events carry no user id, IP, or email.

## Projects

The organization is `nearcrawl`. Phase 1 creates two projects on the signup team. Both share this organization's Developer quotas.

| Project | SDK | Platform |
| --- | --- | --- |
| `nearcrawl-web` | `@sentry/react` | Browser |
| `nearcrawl-gateway` | `@sentry/hono/cloudflare` | Cloudflare Workers |

The DSN stays on the project `nearcrawl-gateway`. The Worker reads it from the `SENTRY_DSN` secret.

## Credentials

The DSN is the ingest address from Client Keys. It ships in the app. It can submit events to that one project. It cannot read events or change org settings.

`SENTRY_AUTH_TOKEN` is the organization token from the setup section. It uploads source maps from CI. It never ships in the web bundle or the gateway process.

| Name | Secret | Where it lives |
| --- | --- | --- |
| `VITE_SENTRY_DSN` | No. Public ingest DSN for `nearcrawl-web`. | `apps/web` env, production build only. |
| `SENTRY_DSN` | No. Public ingest DSN for `nearcrawl-gateway`. | Gateway process env. |
| `SENTRY_ENVIRONMENT` | No. `development` or `production`. | Both apps. |
| `SENTRY_AUTH_TOKEN` | Yes. Organization token `nearcrawl-source-maps`. | CI secret for source map upload. |
| `SENTRY_ORG` | No. Organization slug `nearcrawl`. | CI. |
| `SENTRY_PROJECT` | No. `nearcrawl-web` or `nearcrawl-gateway`, per upload. | CI. |

Local `pnpm dev` leaves both DSNs empty. The SDKs stay disabled, so a local stack does not spend the 5,000 errors or the 5 GB of logs. Production env vars are set when each app is deployed. None of these values are committed. `.env` and `.env.*` are already gitignored.

`.env.example` lists the names with empty values:

```bash
VITE_SENTRY_DSN=
SENTRY_DSN=
SENTRY_ENVIRONMENT=development
SENTRY_AUTH_TOKEN=
SENTRY_ORG=
SENTRY_PROJECT=
```

## Gateway

`app.ts` registers `sentry()` from `@sentry/hono/cloudflare`. The SDK starts when `SENTRY_DSN` is set and `SENTRY_ENVIRONMENT` is `production`.

`handleErrors` in `lib/errors.ts` reports after it maps the throw:

- `ZodError` and `NotFoundError` return their JSON and do not call Sentry.
- `LiveQuerySealerMissingError` calls `Sentry.captureException` and `Sentry.logger.error` with `route` and `requestId`, then returns 503.
- Any other throw calls `Sentry.captureException` and `Sentry.logger.error`, then returns 500 `{ "error": "Internal server error" }`. The client still does not receive the exception message.

`requestId` is `crypto.randomUUID()`, stored on the Hono context the same way Closetza stores it, and copied onto the Sentry scope for that request.

## Web

This waits. The backend pass does not add `src/instrument.ts` or wrap the React root.

`src/instrument.ts` calls `Sentry.init` when `VITE_SENTRY_DSN` is non-empty. `main.tsx` imports that file first. The React root is wrapped in `Sentry.ErrorBoundary`. A render crash is an error event. The boundary shows a short retry message. It does not send the component tree.

Replay and browser profiling stay off. The free plan includes 50 replays, and this phase does not spend them.

## Source maps

Production builds upload source maps so a minified stack points at the TypeScript line. The upload runs in CI with `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, and the project slug for that app. The auth token is not present in the Vite dev server or the gateway dev process.

Source maps are not served as public static files. Vite writes them for the upload step, and the published web assets do not include the `.map` files.

## Checking it

A temporary `GET /debug-sentry` on the gateway throws `Error("Sentry test")` only when `SENTRY_ENVIRONMENT` is `development` and `SENTRY_DSN` is set. Hitting it creates one issue in `nearcrawl-gateway`. The route is removed after that issue appears. The web check is a button on a local build that calls `Sentry.captureException` once, then the button is removed.

After either check, Settings → Subscription shows the event under Errors and the matching line under Logs.
