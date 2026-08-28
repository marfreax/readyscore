# ReadyScore v3 — Phase 3.7 Actual Source Audit

## Supplied Application

`AppRS-v3.6(1).zip`

## Relevant source findings

### 1. Cross-Test Profile

`lib/profile/engine-v1.ts`

Current implementation:

- seven profile domains;
- registry-based adapters;
- only RIASEC adapter registered;
- unknown test types produce insufficient evidence;
- no universal `overallScore`;
- raw-average prohibition;
- limitations are preserved.

**Status:** PASS as Phase 3.7 upstream boundary.

### 2. Profile Types

`lib/profile/types.ts`

Signals preserve:

```text
construct
dimension
score
scoreScale
scoreSemantics
status
confidence
sourceTestType
sourceResultAttemptId
sourceResultContractVersion
sourceScoringVersion
sourceInterpretationVersion
```

**Status:** PASS — sufficient provenance semantics for Direction Engine V1.

### 3. RIASEC Adapter

`lib/profile/adapters/riasec.ts`

Maps RIASEC dimensions to:

```text
INTEREST
Vocational Interest
```

and preserves dimension score, sufficiency, confidence, result contract, and scoring version.

**Status:** PASS.

### 4. Legacy Generic Scoring

`lib/assessment/scoring-engine.ts`

Current generic scoring remains:

```text
Likert 1–5
reverse scoring
weighting
weighted aggregation
0–100 normalization
8-domain coverage
6-domain completeness threshold
```

`ALL_NEUTRAL = 3` mathematically normalizes to 50 under this generic engine.

However, the frozen RIASEC runtime uses its own RIASEC scorer and result contract.

**Status:** DO NOT reuse the legacy generic scoring engine for Direction Engine.

### 5. RIASEC Result Contract

`lib/assessment/riasec/result-contract.ts`

Provides:

```text
RIASEC_RESULT_V1
```

with provenance and measurement.

**Status:** PASS.

### 6. Current Database

The Prisma schema already contains:

- TestType
- TaxonomyVersion
- Product
- Entitlement
- Question / QuestionVersion
- AssessmentAttempt
- AssessmentResult
- version/snapshot fields.

No Phase 3.7 migration is required by this reconciliation.

## Final Source Status

```text
Cross-Test Profile boundary      PASS
RIASEC adapter                   PASS
Direction Engine                 NOT IMPLEMENTED
Direction catalog                NOT IMPLEMENTED
Direction result contract        NOT IMPLEMENTED
Direction regression gate        NOT IMPLEMENTED
Database migration               NOT REQUIRED FOR DESIGN
```

# END
