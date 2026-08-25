# PHASE 2.15.1 — PostgreSQL & Prisma Database Foundation v1.0

## Objective

Establish the production-target database foundation without migrating business entities yet.

## Included

- PostgreSQL datasource via Prisma.
- Prisma Client singleton.
- `DATABASE_URL` contract.
- Local PostgreSQL Docker Compose.
- Database health endpoint.
- Prisma validation / generation / migration scripts.
- Minimal heartbeat model used only to verify connectivity and migration mechanics.

## Deliberate Constraint

This phase does **not** migrate:

- User
- Session
- Question Bank
- Assessment Attempt
- Answer
- Result

Those belong to subsequent 2.15.x phases.

The current JSON/runtime persistence therefore remains active until each domain is explicitly migrated.

## Local Setup

```bash
cp .env.example .env
docker compose -f docker-compose.postgres.yml up -d
pnpm install
pnpm db:validate
pnpm db:generate
pnpm db:migrate --name foundation
```

Then verify:

```bash
pnpm typecheck
pnpm build
```

Database health:

```text
GET /api/health/db
```

Expected:

```json
{
  "ok": true,
  "service": "database",
  "provider": "postgresql"
}
```

## Gate

PASS requires:

1. Prisma schema validates.
2. Prisma Client generates.
3. Foundation migration applies.
4. PostgreSQL responds to `SELECT 1`.
5. `pnpm typecheck` passes.
6. `pnpm build` passes.

## Important

Do not delete or disable existing JSON stores in this phase.
