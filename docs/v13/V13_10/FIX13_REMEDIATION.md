# V13.10 FIX13 — Typecheck / Build / Runtime E2E Readiness

## Root causes

1. `attachTaxonomyNodeDisplay()` constrained `taxonomyVersion` to `string | null`, while `AdminQuestion.taxonomyVersion` is optional. Its inferred return type also lost the original row shape during enrichment.
2. The static gate emitted the taxonomy observability check as a raw boolean instead of the standard PASS/FAIL tuple.
3. The real E2E failure `disc requires exactly 24 questions; received 80` is inconsistent with the FIX12 source, whose DISC unified engine accepts both 24-item legacy and 80-item production forms. Therefore the E2E process must run against a freshly restarted application server after the patched source/build is installed. This is an execution-state issue, not a reason to weaken the 80-item production contract.

## Changes

- Made taxonomy enrichment generic over optional `taxonomyVersion` and preserved the complete `AdminQuestion` shape.
- Kept taxonomy node fields nullable and resolved from the existing taxonomy version + test type + domain/subdomain/indicator mapping.
- Changed the static observability check to use the gate's normal `pass()` / `fail()` mechanism.
- No Prisma migration.
- No scoring formula change.
- No measurement contract change.
- No package selection/randomization/timer behavior change.

## Required verification

Run from the FIX13 project after restarting the application server: 

```bash
pnpm install
pnpm typecheck
pnpm build
pnpm v13:10:gate
# restart the running Next.js server here
pnpm e2e:v13:10:production
```

The DISC runtime must report the production 80-question path rather than the legacy 24-question error.
