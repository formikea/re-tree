# @re-tree/client

React SPA for managing reforestation projects. Talks to `@re-tree/api`.

## Setup

From the **repo root**:

```bash
cp apps/client/.env.example apps/client/.env.development
npm ci
npm run dev:client
```

App: <http://localhost:3000> (expects the API on <http://localhost:5000>).

Production: Cloudflare Pages at `https://app.re-tree.app`.
