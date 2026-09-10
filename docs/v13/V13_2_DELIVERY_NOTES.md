# ReadyScore V13.2 — Delivery Notes

## Baseline
V13.1 Question Package & Configuration PASS/FROZEN.

## Delivered
- Generic runtime package eligibility resolver.
- Active taxonomy and TestType validation.
- Published + approved QuestionVersion eligibility boundary.
- Composition availability checks.
- Generic taxonomy-node matching by node type.
- Seeded package selection.
- Seeded composition-aware question selection.
- Duplicate logical Question protection.
- Final question-order randomization.
- Package/question/version snapshot metadata.
- Package selection algorithm version persisted into AssessmentAttempt.
- V2 taxonomy-node migration required by composition configuration.
- Static V13.2 contract gate.

## Existing foundations reused
- Question / QuestionVersion
- Question Package / Version / Composition Rule
- AssessmentAttempt / AttemptQuestion
- existing assessment configuration and scoring configuration
- existing question snapshot persistence

## Deliberately deferred
- Timer and expiresAt
- autosave/resume hardening
- timeout finalization
- background expiration
- package admin redesign
- question-bank cleanup/curation
- scoring redesign

These remain V13.3 or outside V13.

## Database
One migration is added:
`20260907120000_v13_2_question_taxonomy_nodes`

It adds taxonomy nodes only. It does not rewrite QuestionVersion or AssessmentAttempt records.

## Operational prerequisite
V13.2 runtime selection requires at least one PUBLISHED, configuration-valid, availability-valid QuestionPackageVersion for the requested supported assessment type. V13.1 intentionally created no package seed records, so production package catalog data must be created through the V13.1 admin workflow before runtime E2E can start a package-driven assessment.
