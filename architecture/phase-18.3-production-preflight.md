# V18.3 Production Preflight

## Purpose

Read-only production reconnaissance before any V18.3 deployment.

This preflight exists because production contains real ReadyScore data and previous releases changed the database architecture. It must not perform migrations, writes, fixtures, resets, seeds, deletes, or deployment actions.

## Required command

```bash
pnpm v18.3:preflight
```

Run it only while the application's `DATABASE_URL` points to the intended production database.

## What it checks

1. Production DB connectivity.
2. Applied migration history from `_prisma_migrations`.
3. Pending local migrations.
4. Unfinished/failed migrations.
5. Read-only inventory of critical real-data tables.
6. Prisma production-schema vs current Prisma schema diff.
7. Destructive SQL markers in the schema diff.
8. Migration SQL inventory hash for the deployment baseline.

## What it does NOT do

- `prisma migrate deploy`
- `prisma migrate resolve`
- `prisma db push`
- INSERT/UPDATE/DELETE
- fixture creation
- seed execution
- database reset
- production deployment
- WhatsApp send
- webhook mutation

## Decision policy

### NO DIFF + no pending migration
Application deployment may proceed to the next controlled step only after backup/snapshot is independently confirmed.

### Pending migration
Do not deploy or run migration automatically. Review the exact migration and production state first.

### Schema diff
A non-destructive diff is only a review candidate. It is not an automatic authorization to migrate.

### Destructive diff or unfinished migration
Deployment is blocked until explicitly reconciled.

## Backup checkpoint

The script intentionally cannot certify that a recoverable production backup exists. A current backup/snapshot must be independently confirmed before any production change.
