# V4 L3 — RIASEC Productization

## Scope
Customer-facing RIASEC assessment and result experience only.

## Frozen boundaries
- RIASEC scoring engine is not rewritten.
- `RIASEC_SCORE_V1` remains unchanged.
- `RIASEC_RESULT_V1` remains unchanged.
- Existing runtime persistence/scoring lifecycle remains unchanged.
- F.10-C.2-F remains the regression baseline.

## Implemented
- clearer RIASEC result hierarchy;
- Top Code presentation;
- top-three dimension cards;
- six-dimension visual profile;
- dimension descriptions;
- exploration-oriented action prompts;
- interpretation summary;
- result literacy / claim boundaries;
- explicit distinction between interest profile and ability/intelligence;
- customer-facing navigation back to dashboard.

## Out of scope
- DISC / EQ / Cognitive;
- reassessment;
- upgrade/conversion;
- cross-test profiling;
- Scalev/payment;
- downstream major/career engines;
- scoring algorithm changes.

## Gate
`pnpm v4:l3:gate`
