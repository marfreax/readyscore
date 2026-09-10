# V13.10 FIX14 — Production Runtime Contract Counts

## Root cause

Real HTTP E2E reached DISC submit with an 80-question production attempt, but `lib/assessment/runtime-contract.ts` still declared the legacy runtime question counts of 24 for DISC, EQ, and Cognitive.

This caused the runtime-contract validator to reject a valid production DISC attempt with:

`disc requires exactly 24 questions; received 80.`

## Fix

Update only the runtime contract question counts:

- DISC: 80
- EQ: 50
- Cognitive: 40
- RIASEC: 60 (unchanged)

Response models, scales, scoring metadata requirements, scoring engines, measurement semantics, package selection, randomization, timer behavior, persistence, and database schema are unchanged.

No migration introduced.
