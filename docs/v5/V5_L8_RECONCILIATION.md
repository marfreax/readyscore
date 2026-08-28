# V5 L8 Reassessment — Reconciliation

Version: V5  
Layer: L8  
Baseline: F.10-C.2-F PASS

## Architecture
PASS — new reassessment attempts are separate measurement events; existing results remain immutable.

## Specification
PASS — Rp49.000 Reassessment Credit, no cooldown, maximum 1 reassessment per test type per calendar day.

## Actual Source
PASS — implementation reconciled against the existing Prisma assessment attempt/result model, entitlement boundary, runtime service, repository, AssessmentRunner, and dashboard.

## Database Contract
PASS — additive `ReassessmentCredit` ledger plus reassessment entitlement vocabulary; existing assessment/result tables remain compatible.

## Frozen RIASEC Runtime
PASS / REGRESSION — no RIASEC scoring or result contract changes.

## Files Changed
- `prisma/schema.prisma`
- `prisma/migrations/20260827150000_v5_l8_reassessment_entitlement/migration.sql`
- `prisma/migrations/20260827151000_v5_l8_reassessment/migration.sql`
- `lib/assessment/reassessment.ts`
- `lib/assessment/assessment-repository.ts`
- `lib/assessment/runtime-service.ts`
- `app/api/assessment/reassessment/start/route.ts`
- `app/api/assessment/reassessment/eligibility/route.ts`
- `components/assessment/AssessmentRunner.tsx`
- `app/reassessment/[type]/page.tsx`
- `app/app/page.tsx`
- `lib/commercial/types.ts`
- `lib/commercial/add-on-catalog.ts`
- `scripts/validate-v5-l8-reassessment.ts`
- `scripts/e2e-reassessment-runtime.mjs`
- `package.json`

## New Contracts
- `ReassessmentCreditStatus`
- `ReassessmentTestType`
- `ReassessmentCredit`
- `REASSESSMENT_CREDIT` entitlement type
- reassessment runtime marker in `selectionSnapshot`

## Backward Compatibility
PASS — existing V4 assessment start, answer, submit, scoring, and result paths remain unchanged.

## Required Migration
YES

## Required Human Review
NO for architecture; environment-specific database execution remains required.

## Next Gate
`pnpm db:migrate:deploy`  
`pnpm typecheck`  
`pnpm build`  
`pnpm v5:l8:gate`  
`pnpm e2e:reassessment`  
Then rerun frozen regression E2Es.
