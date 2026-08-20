# @re-tree/website

Marketing site for Re-Tree (pricing, sign-up, Stripe checkout).

## Setup

From the **repo root**:

```bash
cp apps/website/.env.example apps/website/.env.development
npm ci
npm run dev:website
```

Site: <http://localhost:3001>.

Production: Cloudflare Pages at `https://re-tree.app`.
