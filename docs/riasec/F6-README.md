# PHASE 3.0-D.1-F.6 — RIASEC Result Persistence / API Integration

## Scope

This phase adds the mapping boundary between:

```text
RIASEC_SCORE_V1
      ↓
AssessmentResult
      ↓
existing persistence/runtime
```

It does not replace the generic scoring engine and does not directly alter
database persistence.

## Files

```text
lib/assessment/riasec/result-adapter.ts
lib/assessment/riasec/result-adapter.golden.test.ts
```

## Important

The adapter intentionally leaves persistence to the existing runtime.

The next implementation step after repository typecheck is to wire this
adapter into the existing submit/result path only after inspecting the exact
runtime contract and persistence method.

## Next

PHASE 3.0-D.1-F.7 — RIASEC Result API / Runtime Wiring
