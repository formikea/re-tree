# re-tree

Monorepo for the Re-Tree platform (npm workspaces).

```
re-tree/
├── apps/
│   ├── api/        Hono + Drizzle API (`@re-tree/api`; Cloudflare Worker)
│   ├── client/     React + Vite SPA (`@re-tree/client`; Cloudflare Pages)
│   └── website/    Marketing site (`@re-tree/website`; Cloudflare Pages)
├── package.json    workspaces root + scripts
├── docker/         Dev image for Compose api/client/website services
├── .github/        Path-filtered deploy workflows
├── docker-compose.yml
├── Makefile
└── ...
```

This repo replaces the previously separate `retree-api`, `retree-app`, and
`retree-website` repos. The apps deploy independently (path-filtered workflows)
but live and evolve together so cross-stack features are a single commit / PR.

## Quick start (recommended — Compose Postgres + host Node)

Prerequisites: **Docker Desktop** and **Node 20+**.

```bash
git clone <this-repo> re-tree
cd re-tree

cp apps/api/.env.example          apps/api/.env
cp apps/client/.env.example       apps/client/.env.development
cp apps/website/.env.example      apps/website/.env.development

docker compose up -d postgres     # DB only on :5432
npm ci
npm run db:bootstrap              # once Postgres is healthy
npm run dev:api                   # terminal 1 → :5000
npm run dev:client                # terminal 2 → :3000
npm run dev:website               # terminal 3 → :3001
```

Use `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/re_tree_db` in
`apps/api/.env` when the API runs on the host.

### Full stack in Docker

```bash
docker compose up -d              # or: make dev
```

- API:     <http://localhost:5000>
- Client:  <http://localhost:3000>
- Website: <http://localhost:3001>
- DB:      `localhost:5432` (postgres / value of `POSTGRES_PASSWORD`)

Inside Compose, the `api` service forces `DATABASE_URL` to the `postgres` host.

## Top-level commands

On the host, `make` npm targets run via `docker compose exec` against the `api`
service (start the stack first with `make up` / `docker compose up -d`). With a
local Node install you can also run the equivalent root `npm` scripts directly:

```bash
make dev            # start the stack
make install        # npm ci (workspace root)
make lint           # eslint (apps that define it)
make typecheck      # tsc --noEmit
make db-push            # drizzle-kit push
make db-migrate-new MSG="add foo"
make seed               # seed local database
make db-bootstrap       # push schema + seed
make shell-api
make shell-client
make shell-website
make shell-db       # psql into postgres
make clean          # docker compose down -v  (DESTROYS local db)
```

## Environment

Each app has its own env file. Both are gitignored; copy from `.env.example`
and fill in real values.

| File | Purpose | Template |
|---|---|---|
| `apps/api/.env`                    | API (Drizzle, JWT, Resend, Stripe) | `apps/api/.env.example` |
| `apps/client/.env.development`     | client Vite dev config            | `apps/client/.env.example` |
| `apps/website/.env.development`    | website Vite dev config           | `apps/website/.env.example` |

## Apps

### `apps/api` — Hono + Drizzle (REST API)

- Node 20+ (container: Node 22); Drizzle ORM against PostgreSQL (local Docker, Neon in production)
- Package: `@re-tree/api`
- Local: Node (`tsx watch`); production: Cloudflare Worker
- See [apps/api/README.md](apps/api/README.md)

### `apps/client` — React SPA

- Vite, React, Tailwind, TanStack Query, React Router
- Package: `@re-tree/client`
- Deploy: Cloudflare Pages at `https://app.re-tree.app`

### `apps/website` — Marketing site

- Vite, React, Framer Motion, Stripe checkout
- Package: `@re-tree/website`
- Deploy: Cloudflare Pages at `https://re-tree.app`

## Deployment

Deploys run on `push` to `main`, path-filtered per app. `workflow_dispatch`
remains available for manual runs.

| Workflow | Target |
|---|---|
| `api / deploy main`       | Worker `re-tree-api` at `https://api.re-tree.app` |
| `client / deploy main`    | Pages `re-tree-client` at `https://app.re-tree.app` |
| `website / deploy main`   | Pages `re-tree-website` at `https://re-tree.app` |

Workers need a Postgres connection. Production uses Neon’s serverless HTTP
driver: set the Worker secret `DATABASE_URL` to a Neon connection string
(the URL should include `neon.tech`). Secrets (`JWT_SECRET`, `RESEND_API_KEY`,
Stripe keys, etc.) go in Wrangler secrets, not in git.
