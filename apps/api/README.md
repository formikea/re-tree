# @re-tree/api

Hono + Prisma API. Locally this runs as a Node process against Compose
Postgres. Production is a Cloudflare Worker at `https://api.re-tree.app`.

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
| `npm run build` | Prisma generate + `tsc` |
| `npm run migrate:deploy` | Apply Prisma migrations |
| `npm run db:seed` | Seed |
| `npm run deploy` | `wrangler deploy` |

## Cloudflare

See `wrangler.jsonc`. Create a Hyperdrive config against hosted Postgres, put
the id in `wrangler.jsonc`, and store secrets with `wrangler secret put`:

- `JWT_SECRET`, `REFRESH_TOKEN_SECRET`, `INVITATION_SECRET`
- `RESEND_API_KEY`, `SMTP_FROM`
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` (if used)
