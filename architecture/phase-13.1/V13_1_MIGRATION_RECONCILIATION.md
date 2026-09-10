# ReadyScore V13.1 — Migration Source-of-Truth Reconciliation

Date: 2026-09-07
Status: RECONCILED — source restoration only

## Purpose

Restore the three historical Prisma migrations that are already recorded as applied in the target database but were absent from the V13.1 source ZIP.

No database records were modified by this reconciliation.
No historical migration SQL was recreated or edited.

## Database-reported historical migrations

1. `20260822120013_foundation`
   - Source: `AppRS_Phase2_15_2_Core_Assessment_Database_Schema_v1.1.zip`
   - SHA-256: `cbfdb59a3a4bbea6da893972c5af7229b64d9d02ea1f910c084fc3444aa6083e`

2. `20260822120935_core_assessment_schema`
   - Source: `ReadyScore_PHASE_2_15_3_FULL_REPAIRED.zip`
   - SHA-256: `0d11556e2f6bb366b8b5cd9d85917a41acd92156d499dc8eed5f32df5fa08ccd`

3. `20260822131500_question_bank_runtime`
   - Source: `ReadyScore_PHASE_2_15_3_FULL_REPAIRED.zip`
   - SHA-256: `7e7f0142e4621a695e4cb1a5c2cc25d3d7b2924eee6aeaeaf789936611dca492`

## V13.1 migration

`20260907100000_v13_1_question_package_configuration`

This migration remains unchanged from the original V13.1 delivery.

## Reconciliation rule

The restored historical migration files must match the database-recorded checksums exactly. They are restored for Prisma migration-history completeness and are not to be re-run manually.

## Next validation

Run from the reconstructed V13.1 source:

```bash
pnpm exec prisma generate
pnpm exec prisma validate
pnpm exec prisma migrate status
pnpm exec prisma migrate deploy
pnpm exec tsc --noEmit
pnpm build
pnpm v13:1:gate
```

Do not use `prisma migrate resolve` unless a subsequent `migrate status` result provides new evidence requiring it.
