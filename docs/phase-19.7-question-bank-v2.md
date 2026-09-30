# V19.7 — Work Attitude & Learning Preference Question Bank V2

## Purpose
Promote the reviewed V2 content package into the existing ReadyScore QuestionVersion runtime lifecycle without changing the assessment architecture.

## Scope
- Work Attitude: 35 items, 7 dimensions × 5
- Learning Preference: 30 items, 3 dimensions × 10
- Total: 65 items
- Revised: 16
- Unchanged: 49
- Replaced: 0

## Runtime integration
`data/v19/question-bank-v2.json` remains a governed source package with `status: DRAFT`.
The migration creates immutable `QuestionVersion` rows with `version = v2`, `status = PUBLISHED`, and `mappingStatus = APPROVED` for the existing logical Question IDs.

The existing runtime boundary remains unchanged:
- `lib/catalog/question-bank.ts`
- `lib/assessment/question-engine.ts`
- `lib/question-package-runtime.ts`

The existing scoring and selection contracts remain V1. Taxonomy remains V1.

## Historical safety
V1 QuestionVersion rows are not modified or deleted. New attempts resolve through the new active configuration/package versions. Existing attempts retain their persisted version metadata and QuestionVersion references.

## Configuration/package transition
- `WORK_ATTITUDE_CONFIG_V2` → `WORK_ATTITUDE_QB_V2`
- `LEARNING_PREFERENCE_CONFIG_V2` → `LEARNING_PREFERENCE_QB_V2`
- V1 configuration versions are archived after V2 versions are created.
- V2 runtime packages are published with the existing composition rules.

## Migration
`prisma/migrations/20260930143000_v19_7_question_bank_v2/migration.sql`

## Validation
`pnpm v19.7:question-bank-v2:gate`

The local static gate verifies the 65-item package, exact 35/30 split, 16 revisions, scoring/mapping invariants, 65 migration rows, V2 configuration/package creation, historical V1 preservation, and unchanged runtime architecture.

Production database is not modified by this repository patch.
