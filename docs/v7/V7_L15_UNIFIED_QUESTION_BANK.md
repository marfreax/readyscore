# ReadyScore V7 L15 — Unified Question Bank Management

Status: LOCKED PHASE IMPLEMENTATION REFERENCE

## Scope

One administrative workspace manages RIASEC, DISC, EQ, and Cognitive question banks.

Canonical route:

`/admin/question-bank`

Capabilities:

- list
- search
- filter by test and lifecycle
- inspect logical question and question version
- create logical question
- edit by creating a new question version
- duplicate into a new logical question
- approve mapping
- approve question
- activate (publishes an approved version for runtime selection)
- archive

## Safety

`Question.id` / logical identity and `QuestionVersion.id` remain distinct.

Assessment-facing content already used by an attempt is not overwritten. Edit creates a new immutable version.

The unified UI is an administrative shell only. It does not merge RIASEC, DISC, EQ, and Cognitive scoring or measurement structures.

No database migration is required because the existing `Question` and `QuestionVersion` schema already provides the required version boundary.

## Lifecycle

`DRAFT → MAPPED → APPROVED → PUBLISHED`

Archive is a terminal lifecycle state for the current version.

## Explicit non-goals

- no measurement semantic changes
- no scoring engine changes
- no result changes
- no reassessment changes
- no commercial changes
- no universal score
- no raw-average synthesis
- no deletion of historical assessment content

## Version-safe content management

Question content is managed through immutable question versions.

Editing an existing logical question does not overwrite a version that may already
be referenced by assessment attempts. Instead, editing creates a new
`QuestionVersion`.

This preserves:

- historical assessment content
- result reproducibility
- version-level auditability
- safe activation of future content
- separation between logical question identity and published content

Only the appropriate question version may progress through the lifecycle:

`DRAFT → MAPPED → APPROVED → PUBLISHED`

Historical versions remain immutable.