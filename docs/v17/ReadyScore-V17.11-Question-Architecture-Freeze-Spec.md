# ReadyScore V17.11 — Question Architecture Freeze & Full Regression

## Status

Development implementation baseline based on `AppRS-v17.10.1.zip`.

## Objective

Freeze the completed Question Architecture without redesigning the already aligned runtime.

Canonical chain:

```text
Assessment Type
  ↓
Active AssessmentConfigurationVersion
  ↓
QuestionPackageVersion
  ↓
QuestionPackageCompositionRule
  ↓
Eligible QuestionVersions
  ↓
Selection Algorithm
  ↓
AssessmentAttempt Snapshot
  ↓
Scoring
  ↓
Result / Report
```

## V17.11 Rules

1. Database configuration defines what assessment is active.
2. Code defines how the configured selection algorithm executes.
3. `QuestionVersion` remains immutable assessment-facing content.
4. `QuestionPackageVersion` + composition rules own runtime composition.
5. `AssessmentConfigurationVersion` owns the active assessment identity.
6. Attempts freeze configuration, package, question-version IDs, selection metadata, and scoring metadata.
7. Historical attempts and legacy configuration records are never deleted or rewritten.
8. `ASSESSMENT_CONFIG` is not a primary runtime authority.
9. Legacy/diagnostic code may remain only when it is outside the canonical production start path.
10. No database migration is introduced by V17.11.
11. No production deployment is introduced by V17.11.
12. AI Career Advisor remains blocked until this freeze is validated.

## Operational Assessments

Only these canonical operational codes are frozen:

- `free-v1`
- `riasec-v1`
- `disc-v1`
- `eq-v1`
- `cognitive-v1`

Legacy/E2E/historical records remain preserved but are not operational Admin configuration.

## Verification

### Static freeze

```bash
pnpm v17.11:architecture:gate
```

Checks:

- canonical operational codes;
- configuration → package relation;
- attempt snapshot identity;
- DB-backed active resolver;
- primary runtime package path;
- no static configuration authority on assessment start;
- no hardcoded production timer rule in package runtime;
- historical configuration registry preserved.

### Freeze + existing regression gates

```bash
pnpm v17.11:freeze
```

Runs:

- V17.11 architecture gate;
- V17.10.1 Admin gate;
- V17.10 runtime gate;
- Free/Premium contract gate;
- typecheck;
- build.

### Read-safe runtime regression

```bash
pnpm v17.11:regression
```

This validates the locally running build without creating test fixtures:

- FREE start;
- package identity;
- configuration snapshot;
- selected QuestionVersion snapshot;
- unauthenticated paid-access guard for RIASEC/DISC/EQ/Cognitive.

Paid assessment start/answer/submit/scoring is deliberately not executed by the default read-safe harness because it consumes real entitlements and writes attempts.

## Full Product Regression

Existing established suites remain the source for mutating regression coverage:

- assessment runtime;
- scoring;
- result;
- report;
- reassessment;
- entitlement/commercial;
- lead;
- WhatsApp.

V17.11 does not replace those suites. It freezes the Question Architecture boundary and adds a dedicated read-safe runtime regression.

## Definition of Done

- Architecture freeze gate PASS.
- V17.10.1 Admin gate PASS.
- V17.10 runtime gate PASS.
- Free/Premium contract PASS.
- Typecheck PASS.
- Build PASS.
- Read-safe runtime regression PASS.
- Established mutating regression suites PASS on the user's Mac.
- No historical data changes.
- No production deployment before local validation.

## Final Principle

> Do not make tests green by weakening the architecture. Freeze the canonical runtime contract and make regression prove it.
