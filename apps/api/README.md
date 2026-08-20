# @re-tree/api

Hono + Drizzle API. Locally this runs as a Node process against Compose
Postgres. Production is a Cloudflare Worker at `https://api.re-tree.app`
using Neon’s serverless HTTP driver.

## Setup

From the **repo root**:

```bash
cp apps/api/.env.example apps/api/.env
docker compose up -d postgres
npm ci
npm run db:bootstrap
npm run dev:api
```

API: <http://localhost:5000> — docs (dev/localhost only): <http://localhost:5000/docs>

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Node server with watch (`tsx`) |
| `npm run dev:worker` | `wrangler dev` (Workers runtime) |
| `npm run build` | `tsc` |
| `npm run db:push` | Push Drizzle schema to the current `DATABASE_URL` |
| `npm run migrate:deploy` | Apply Drizzle migrations |
| `npm run db:seed` | Seed |
| `npm run deploy` | `wrangler deploy` |

## Cloudflare

See `wrangler.jsonc`. Store the Neon connection string as a Worker secret
named `DATABASE_URL` (`wrangler secret put DATABASE_URL`). Other secrets:

- `JWT_SECRET`, `REFRESH_TOKEN_SECRET`, `INVITATION_SECRET`
- `RESEND_API_KEY`, `SMTP_FROM`
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` (if used)
