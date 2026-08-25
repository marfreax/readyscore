# PHASE 3.0-D.1-F.5 — RIASEC Scoring Integration

## Purpose

Introduce a small adapter between the generic assessment runtime and the
isolated RIASEC scorer.

## Current architecture

```text
Generic Assessment Runtime
          |
          v
RIASEC integration.ts
          |
          v
RIASEC scoring.ts
          |
          v
RIASEC_SCORE_V1
```

## Important boundary

This phase does NOT:

- replace `lib/assessment/scoring-engine.ts`;
- change `AssessmentResult` persistence;
- change commercial tiers;
- implement interpretation;
- implement study/career mapping.

## Intended next step

After this adapter passes repository typecheck, the next phase is:

```text
PHASE 3.0-D.1-F.6 — RIASEC Result Persistence / API Integration
```

That phase will connect the test-specific result to the existing
assessment-result persistence contract.
