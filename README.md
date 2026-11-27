This is a [Next.js](https://nextjs.org) Document Management System (DMS) deployed on Cloudflare Workers with Cloudflare D1 (SQLite), R2, Queues, KV, and Vectorize.

## Getting Started

### Prerequisites

- Node.js `>=22.0.0` (see `.nvmrc`)
- `pnpm` (see `packageManager` in `package.json`)
- Cloudflare Wrangler CLI (for local and remote D1 migrations)

### Database (Cloudflare D1 / Local SQLite)

By default, `.env.example` sets `DATABASE_URL="file:./prisma/dev.db"` for local Next.js/Node development. Initialize (or reset with `-- --reset`) the local SQLite database from `migrations/*.sql`:

```bash
pnpm db:bootstrap
```

To verify migrations against `prisma/schema.prisma`:

```bash
pnpm db:check
```

To apply migrations to the local Wrangler D1 emulator (`pnpm preview:cf`) or remote production D1 (`dms-db`):

```bash
pnpm migrate:local   # local Wrangler D1 state
pnpm migrate:deploy  # remote Cloudflare D1 (production)
```

### Run the app

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
