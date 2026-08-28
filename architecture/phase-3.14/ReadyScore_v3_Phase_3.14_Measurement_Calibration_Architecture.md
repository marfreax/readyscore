# ReadyScore v3 — Phase 3.14
## Measurement Calibration Architecture V1

**Status:** IMPLEMENTED — GATE PENDING  
**Architecture Version:** `V3_MEASUREMENT_CALIBRATION_3.14`  
**Contract Version:** `MEASUREMENT_CALIBRATION_V1`  
**Report Version:** `CALIBRATION_REPORT_V1`

> Reconciled against `RS-V3-SOURCE-OF-TRUTH` v1.0.0 and the frozen Phase 3.1–3.13 implementation boundary.

## 1. Scope

Phase 3.14 is the transition from:

```text
ENGINEERING CORRECTNESS
        ↓
MEASUREMENT CALIBRATION
```

It introduces a **diagnostic calibration layer** that can evaluate response evidence without changing the production measurement model.

The phase does not redefine:

```text
Test Type
Question Bank
Selection
Scoring
Result Contract
Interpretation
Cross-Test Profile
Study Direction
Major Fit
Career Exploration
Commercial Entitlement
Institutional Access
```

## 2. Frozen Boundary

The following remain frozen:

```text
F.10-C.2-F
3.1
3.2
3.3
3.4
3.5
3.6
3.7
3.8
3.9
3.10
3.11
3.12
3.13
```

`pnpm e2e:riasec` remains the minimum regression protection.

## 3. Calibration Boundary

The canonical Phase 3.14 chain is:

```text
CALIBRATION DATASET
        ↓
RESPONSE QUALITY DIAGNOSTICS
        ↓
ITEM-LEVEL EVIDENCE
        ↓
DIMENSION-LEVEL EVIDENCE
        ↓
CALIBRATION REPORT
        ↓
HUMAN / PSYCHOMETRIC REVIEW
```

The calibration engine is deliberately downstream of production scoring.

It does not become a second scoring engine.

## 4. Calibration Dataset Contract

V1 accepts:

```text
datasetId
testType
scoringVersion
items[]
responses[]
```

Each item declares:

```text
questionId
dimensionId
minValue
maxValue
reverseScore
```

Each response contains:

```text
respondentId
answers: questionId → response | null
```

The dataset is an analysis input. It is not a replacement for the production question bank or result persistence.

## 5. Diagnostics

V1 calculates:

### Item level

```text
sampleSize
answeredCount
missingCount
missingRate
mean
standardDeviation
minObserved
maxObserved
responseFrequencies
itemRestCorrelation
flags
```

### Dimension level

```text
itemCount
sampleSize
completeResponseCount
mean
standardDeviation
cronbachAlpha
itemRestCorrelations
flags
```

These are diagnostic statistics.

They are not automatic acceptance criteria.

## 6. Reverse Scoring

Calibration uses the declared item scoring direction:

```text
reverseScore = false
    raw value → scored value

reverseScore = true
    max + min - raw
```

This mirrors the existing scoring governance without changing the production scoring engine.

## 7. Evidence Status

The report uses:

```text
DESCRIPTIVE_ONLY
REVIEW_REQUIRED
INSUFFICIENT_EVIDENCE
```

`INSUFFICIENT_EVIDENCE` is used when the supplied dataset is too small for the diagnostics being requested.

`REVIEW_REQUIRED` means the dataset contains diagnostic flags that require human review.

`DESCRIPTIVE_ONLY` means the diagnostic report completed without those structural flags. It does **not** mean the instrument is psychometrically validated.

## 8. Explicitly Not Implemented

Phase 3.14 V1 does not perform:

```text
Norming
Standardization
Equating
IRT calibration
Cut-score optimization
Automated item deletion
Automated question replacement
Automated publication
Automatic scoring transformation
Construct validity determination
Reliability certification
Population validity determination
Psychometric production-readiness certification
```

In particular:

```text
ENGINEERING PASS
        ≠
PSYCHOMETRIC VALIDATION
```

This follows the canonical source-of-truth distinction.

## 9. Production Mutation Safety

The calibration engine has an explicit governance contract:

```text
productionMutation = false
scoringMutation = false
questionPublicationMutation = false
normingPerformed = false
validityClaim = false
```

Calibration is therefore read/analysis-oriented.

No calibration run can silently:

```text
publish a QuestionVersion
change a scoring version
rewrite a production result
change the RIASEC production set
change a Test Type
```

## 10. Versioning

Phase 3.14 introduces:

```text
V3_MEASUREMENT_CALIBRATION_3.14
MEASUREMENT_CALIBRATION_V1
CALIBRATION_REPORT_V1
```

The calibration report records the production `scoringVersion` used by the evidence dataset.

Calibration versioning does not replace:

```text
Question Bank Version
QuestionVersion
Taxonomy Version
Assessment Configuration Version
Selection Algorithm Version
Scoring Version
Result Contract Version
```

## 11. Runtime / Database Decision

No production measurement table is modified by Phase 3.14 V1.

No Prisma migration is required.

The calibration dataset is an analysis boundary rather than a new assessment lifecycle entity.

This intentionally prevents calibration metadata from becoming part of the respondent measurement result without an explicit future architecture decision.

## 12. Gate

Canonical command:

```bash
pnpm measurement:calibration:gate
```

Expected:

```text
Calibration contract            : PASS
Item-level diagnostics          : PASS
Dimension diagnostics            : PASS
Reverse-score handling          : PASS
Item-rest correlation            : PASS
Reliability diagnostic           : PASS
Deterministic report             : PASS
No production mutation           : PASS
No scoring mutation              : PASS
No question publication          : PASS
No norming / validity claim      : PASS
F.3.14 MEASUREMENT CALIBRATION GATE: PASS
```

## 13. Regression

Minimum Phase 3.14 verification:

```bash
pnpm typecheck
pnpm build
pnpm measurement:calibration:gate
pnpm commercial:gate
pnpm e2e:riasec
```

The full architecture gates from 3.1–3.13 remain regression tools when needed; they are not reopened as active scope.

## 14. Phase Transition

Phase 3.14 is complete only when:

```text
typecheck
    ↓
build
    ↓
measurement:calibration:gate
    ↓
commercial:gate
    ↓
e2e:riasec
    ↓
PASS
```

Only after that should Phase 3.14 become frozen.

The next canonical phase is:

```text
PHASE 3.15
Release Hardening
```

## 15. Architectural Decision

Phase 3.14 does **not** claim that ReadyScore is now psychometrically validated.

It establishes the controlled mechanism required to begin evidence-based calibration while preserving the existing measurement contracts.

The correct progression is:

```text
ENGINEERING BASELINE
        ↓
CALIBRATION DIAGNOSTICS
        ↓
HUMAN / PSYCHOMETRIC REVIEW
        ↓
EXPLICIT MEASUREMENT DECISION
        ↓
VERSIONED IMPLEMENTATION
        ↓
REGRESSION
```

No calibration finding becomes a production measurement change automatically.

## 16. Frozen Relationship

```text
3.13
B2B School / Institution
        ↓
3.14
Measurement Calibration
        ↓
3.15
Release Hardening
```
