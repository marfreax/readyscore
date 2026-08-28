# ReadyScore V5 — L8 Reassessment

## Scope
L8 implements reassessment as a new immutable assessment attempt.

## Locked rules
- Reassessment is a new attempt, never a retry or overwrite.
- Each completed attempt retains its own immutable result snapshot.
- Reassessment requires the corresponding core test to be unlocked.
- Reassessment requires a completed initial assessment for that test type.
- One consumable Reassessment Credit is consumed when a reassessment attempt starts.
- Maximum one reassessment attempt per test type per calendar day.
- No cooldown period.
- RIASEC, DISC, EQ, and Cognitive measurement/scoring semantics are unchanged.
- Reassessment does not introduce a universal score or alter result interpretation.
- Payment/checkout implementation remains outside V5 L8.

## Runtime surface
- `POST /api/assessment/reassessment/start`
- `GET /api/assessment/reassessment/eligibility?type=<riasec|disc|eq|cognitive>`
- `/reassessment/<type>` customer-facing entry

## Commercial artifact
`REASSESSMENT_CREDIT_V1` is represented as a V5 consumable add-on at Rp49.000 planning price. Credit consumption is tracked separately from measurement events.

## Validation
- `pnpm v5:l8:gate`
- `pnpm e2e:reassessment`
- Existing assessment E2Es remain regression requirements.
