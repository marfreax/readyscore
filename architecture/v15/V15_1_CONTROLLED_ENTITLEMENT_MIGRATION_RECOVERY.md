# V15.1 Controlled Entitlement Migration Recovery

The controlled ADVANCE report entitlement migration uses raw SQL, so Prisma's
`@default(cuid())` is not invoked automatically for `UserEntitlement.id`.

The migration explicitly supplies a deterministic, user-scoped string ID for
the backfill row:

`v15rpt_<24-char-md5(userId)>`

This is safe with the existing unique entitlement contract because the
backfill is guarded by the existing `(userId,type,resourceType,resourceKey)`
unique constraint and `NOT EXISTS`.

## If an earlier V15.1 controlled-entitlement migration failed with P3018

If the migration is recorded by Prisma as failed, first mark that failed
attempt as rolled back, then rerun the migration:

```bash
pnpm prisma migrate resolve --rolled-back 20260909153000_v15_1_advance_report_entitlement
pnpm prisma migrate deploy
```

Do not manually insert the report entitlement. The migration is the controlled
source of truth for the existing ADVANCE backfill.
