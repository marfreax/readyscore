# ReadyScore V17.10 — Runtime Alignment & Configuration Migration

Baseline: **V17.9 — PASS**

Scope: **LOCAL ONLY**. No GitHub push and no production change are part of this package.

## Runtime contract

```text
Assessment Type
  ↓
Active AssessmentConfigurationVersion
  ↓
QuestionPackageVersion
  ↓
Composition Rules
  ↓
Eligible QuestionVersions
  ↓
Selection Algorithm
  ↓
Immutable Attempt Snapshot
```

## Main changes

- `AssessmentConfigurationVersion.questionPackageVersionId` is the explicit configuration → package ownership boundary.
- `AssessmentAttempt.questionPackageVersionId` freezes the exact package used by the attempt.
- `resolveActiveAssessmentConfiguration()` is the canonical runtime resolver.
- Primary `/api/assessment/start` no longer calls the legacy hardcoded question selector.
- Free, RIASEC, DISC, EQ, and Cognitive use package-driven runtime selection.
- Premium is not part of the current assessment catalog or V17.10 runtime contract.
- Free uses the RIASEC-free selection scope; the four instrument assessments use their TestType scope.
- Package timer, count, taxonomy, composition, scoring-version identity, and selection-version identity are read from the active DB contract.
- Legacy `lib/assessment/question-engine.ts` remains available only for diagnostics/compatibility; it is not the primary start path.
- Historical configuration versions are preserved and archived rather than deleted.

## Local verification

```bash
pnpm v17.10:runtime:gate
pnpm v17.10:free-premium:contract  # legacy command name; validates current five-assessment contract
pnpm v17.10:runtime:preflight
pnpm v17.10:runtime:align
pnpm typecheck
pnpm build
pnpm e2e:v17.10:runtime
```

V17.10 is **not PASS** until these checks are run successfully on the user's local environment.


## Alignment safety

`v17.10:runtime:preflight` is read-only. It validates the active configuration, taxonomy nodes, eligible question capacity, and any already-published matching package before the mutating alignment step.

`v17.10:runtime:align` runs the package/configuration bootstrap inside one database transaction. A failed contract rolls back the entire alignment operation.

## Admin operating model

Admin does not manage Question Packages directly for normal assessment configuration. The operational model is:

```text
Question Bank
  → add as many questions as needed
  → validate / approve / publish

Assessment Setting
  → define composition counts
  → system calculates total
  → system checks published capacity

Runtime
  → select the configured number from the published pool
```

Changing DISC from `10/10/10/10` to `20/20/20/20` creates a new assessment configuration version. Existing attempts remain frozen. New attempts select 80 questions from the complete published DISC pool. Adding new published questions does not increase the assessment count unless the configuration is changed.

Premium is intentionally excluded. Future assessment models should be added through the same TestType + Taxonomy + Configuration + Question Pool pattern.
