# Deploying the backend

This app now has a real backend: Cloudflare Pages Functions (`functions/`) backed
by a D1 database. Everyone who opens the site shares the same data — admin
changes are visible to every promoter immediately. **This is a breaking change**
for the currently-deployed version, which stored everything in each visitor's
own browser (`localStorage`). Until you complete the steps below, the live site
will fail to load data (the API has nothing to talk to).

## One-time setup (per Cloudflare account)

1. **Log in to Wrangler** (opens a browser to authorize):
   ```bash
   npx wrangler login
   ```

2. **Create the D1 database**:
   ```bash
   npx wrangler d1 create incentives-calculator-db
   ```
   This prints a `database_id`. Copy it into [wrangler.toml](wrangler.toml),
   replacing `REPLACE_WITH_YOUR_D1_DATABASE_ID`.

3. **Apply the schema and seed data to the real (remote) database**:
   ```bash
   npm run db:schema:remote
   npm run db:seed:remote
   ```
   This creates the tables and loads the same July 2026 scheme/products/rules
   that used to be hardcoded into the app. The seed also creates the admin
   account with the password `admin1234` — **log in and change it immediately**
   (Admin → "Change Admin Password"). It's a one-time bootstrap value, not a
   secret worth protecting on its own.

4. **Bind the D1 database to your Pages project** — in the Cloudflare dashboard:
   `Workers & Pages → your Pages project → Settings → Functions → D1 database
   bindings → Add binding`. Set:
   - Variable name: `DB`
   - D1 database: `incentives-calculator-db`

   This step is required regardless of `wrangler.toml` — git-connected Pages
   deployments read bindings from the dashboard, not the repo.

5. **Redeploy** (push to the branch your Pages project tracks, or trigger a
   manual redeploy from the dashboard) so the new build picks up the binding.

## Local development

`vite dev` alone won't serve the `/api/*` routes — those need Wrangler's local
Pages runtime, which also emulates D1 without touching your real Cloudflare
account:

```bash
npm run db:schema:local   # first time only
npm run db:seed:local     # first time only
npm run pages:dev         # builds the app, then serves it + functions together
```

This serves the full app (frontend + API) at `http://127.0.0.1:8788`, with a
local SQLite-backed D1 database stored in `.wrangler/state/`. If you change
frontend code, re-run `npm run pages:dev` to rebuild (or run `vite dev` in one
terminal for hot-reloading UI work, and point it at a separately-running
`wrangler pages dev` for the API — see Wrangler docs on proxying).

## What changed, security-wise

- Admin password hashing (bcrypt) now happens **server-side** — the hash never
  ships to the browser.
- Login rate limiting (5 attempts → 15 min lockout) is enforced **per IP,
  server-side** in D1 — it can no longer be bypassed by clearing browser storage.
- Admin sessions are opaque, server-issued, revocable tokens (8-hour expiry)
  stored in a `sessions` table — not a client-forgeable JWT.
- Changing the admin password invalidates all existing sessions.
- All admin write endpoints validate input shape/length server-side.
- Cache-Control: no-store on API responses; basic security headers
  (`X-Frame-Options`, `X-Content-Type-Options`, etc.) via `public/_headers`.

## Rotating the seed password

The bcrypt hash baked into `db/seed.sql` corresponds to `admin1234`. If you
regenerate the seed (`npm run db:seed:generate`), it will use that same
hash again — this only matters for a *fresh* database. Once you've logged in
and changed the password via the UI, re-running the seed against an existing
database is harmless (`INSERT OR IGNORE`), it won't overwrite your new password.
