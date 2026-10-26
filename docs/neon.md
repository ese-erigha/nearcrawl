Set up this app on Neon.
1. `npm i -g neon@latest`. If that fails, use `npx neon@latest` in place of `neon`.
   If a neon command opens a browser sign-in, tell me to finish it there. If that times out or fails, ask me to run `neon login`, then retry.
2. In the project root:
   neon init -y --org-id org-falling-dew-60216775 --project-id fancy-wildflower-94530249 --branch production --services postgres
3. `neon deploy`. It provisions the services in neon.ts and pulls their env vars into `.env.local` (or `.env` if it exists).
4. Wire each service into the app's code using those env vars. Consult the installed Neon agent skills for best practices, e.g., what database driver to use given the app architecture and hosting runtime.
5. Prove it works: `npm run build` must pass, then start the app, each wired service must be tested to prove it works end to end.
6. Report what changed, the command output that proves step 5, and anything that failed.

## GitHub Actions

The migrate workflow on `develop` reads one Actions secret, `DATABASE_URL`. That value is the direct Neon connection string. The host has no `-pooler`. `drizzle-kit migrate` uses it to open Postgres and apply `infra/migrations`.

`.env.var` stays on your machine. GitHub Actions does not read that file. `.env.*` is gitignored. Copy the value into GitHub yourself. Do not commit it, and do not paste it into this doc.

1. Open the repository on GitHub.
2. Go to Settings → Secrets and variables → Actions.
3. Choose New repository secret.
4. Set the name to `DATABASE_URL`.
5. Paste the direct connection string from the local `DATABASE_URL` entry, without the quotation marks. The `"` characters in `.env.var` wrap the value. They are not part of the URL. Leave `DATABASE_URL_POOLED` out of this secret. The pooled host is for the Worker at runtime, later, as a Cloudflare secret.
6. Save the secret. GitHub shows the name after that. It does not show the value again.

This workflow does not call the Neon API. It does not need `NEON_API_KEY` or `NEON_PROJECT_ID`. Add those only if a later workflow creates or deletes Neon branches.

The workflow file maps the secret like this:

```yaml
env:
  DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

A push to `develop` that changes `infra/migrations/*.sql` runs `drizzle-kit migrate` with that env. Confirm the host in the secret has no `-pooler` before the first push. A pooled host fails the migrate.