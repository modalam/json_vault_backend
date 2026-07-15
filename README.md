# JSON Vault Backend

Cloudflare Workers API built with Hono + TypeScript.

## Prerequisites

- **Node.js 22+** (required by Wrangler 4)
- pnpm 9+
- Logged in to Cloudflare (`wrangler login`)

## Setup

```bash
nvm use   # Node 22 from repo .nvmrc
pnpm install
cp .dev.vars.example .dev.vars

# Apply schema to Cloudflare D1 (skip if already migrated)
pnpm db:migrate:remote

# Local Worker + remote Cloudflare D1
pnpm dev
```

API: `http://localhost:8787`

## Dev vs deploy

| Command | What runs | Where data goes |
|---------|-----------|-----------------|
| `pnpm dev` / `wrangler dev` | Worker on your machine | **Cloudflare D1** (`remote = true`) |
| `pnpm dev:offline` | Worker on your machine | Local D1/R2/KV only |
| `pnpm deploy` / `wrangler deploy` | Worker on Cloudflare | Cloudflare D1 (+ R2/KV) |

## Scripts

| Script | Description |
|--------|-------------|
| `pnpm dev` | Local Worker, **cloud D1** |
| `pnpm dev:offline` | Fully local bindings |
| `pnpm deploy` | Deploy Worker to Cloudflare |
| `pnpm db:migrate:remote` | Apply migrations to Cloudflare D1 |
| `pnpm db:migrate:local` | Apply migrations to local D1 |
| `pnpm test` | Unit tests |
| `pnpm typecheck` | TypeScript check |

## Cloudflare resources (current)

| Resource | Name / ID |
|----------|-----------|
| D1 | `jsonvault-db` / `6cddf3b7-ed63-4820-babc-2dc0c85801af` |
| KV | `jsonvault-kv` / `0c761e6bc4ff4804b5bb20c5ce954dab` |
| R2 | Enable R2 in dashboard, then `wrangler r2 bucket create jsonvault-dev` |

## Phase 1 Scope

- Blob CRUD (`/api/v1/blobs`)
- Anonymous edit tokens
- R2 storage for payloads > 256 KB (needs R2 enabled)
- Anonymous create rate limiting (5 / IP / 24h) via KV
- Health check
- jsonblob compatibility routes (`/api/jsonBlob`)
