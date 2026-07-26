# Deploying

The live app (`https://incentives-calculator2.nibbz2024.workers.dev`) is a
**Cloudflare Worker** with a static-assets binding for the frontend and a D1
database for shared data (schemes/products/rules) — everyone who opens the
site now sees the same data, and admin changes are visible to everyone
immediately.

## How it's wired together

- `worker/index.js` — the single entry point. Routes `/api/*` to the handler
  functions in `functions/api/**` (unchanged plain functions, reused as-is),
  and serves the built frontend (`dist/`) for everything else.
- `wrangler.toml` — declares the D1 binding (`env.DB`) and the static assets
  binding (`env.ASSETS`). Workers read bindings straight from this file on
  deploy — there's no dashboard step required.
- `db/schema.sql` / `db/seed.sql` — the database structure and initial data
  (same July 2026 scheme that used to be hardcoded into the app).

## Redeploying after a change

```bash
npm run deploy
```

This builds the frontend and uploads the Worker in one step, to the same
URL. That's it — no dashboard step, no git integration (this Worker isn't
git-connected; deploys happen by running this command from your machine).

## Local development

```bash
npm run worker:dev
```

Builds the app and serves it + the API together at `http://127.0.0.1:8789`,
using a local SQLite-backed D1 database (`.wrangler/state/`) that mirrors
production but is completely separate from it. First time only:

```bash
npm run db:schema:local
npm run db:seed:local
```

## Managing the real (production) database

```bash
npm run db:schema:remote   # (re)apply the table structure
npm run db:seed:remote     # add the starter scheme/products/rules (safe to
                            # re-run — INSERT OR IGNORE, won't overwrite
                            # changes you've made since)
```

To inspect or fix data directly:
```bash
npx wrangler d1 execute incentives-calculator-db --remote --command "SELECT * FROM rules;"
```

## Security notes

- Admin password hashing (bcrypt) happens **server-side** — the hash never
  ships to the browser.
- Login rate limiting (5 attempts → 15 min lockout) is enforced **per IP,
  server-side** in D1 — it can't be bypassed by clearing browser storage.
- Admin sessions are opaque, server-issued, revocable tokens (8-hour expiry)
  in a `sessions` table — not a client-forgeable JWT.
- Changing the admin password invalidates all existing sessions.
- All admin write endpoints validate input shape/length server-side.

## First login

The seed creates the admin account with password `admin1234` on a *fresh*
database only. **Log in and change it** (Admin → "Change Admin Password") —
after that, re-running the seed is harmless (`INSERT OR IGNORE` won't
overwrite your new password hash).
