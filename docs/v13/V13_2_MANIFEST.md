# ReadyScore V13.2 Manifest

## Source
AppRS-v13.1 PASS/FROZEN baseline.

## Phase
V13.2 — Composition Validation & Question Selection

## New files
- `lib/question-package-runtime.ts`
- `scripts/validate-v13-2-composition-validation-question-selection.mjs`
- `scripts/e2e-v13-2-composition-selection-runtime.mjs`
- `prisma/migrations/20260907120000_v13_2_question_taxonomy_nodes/migration.sql`
- `architecture/phase-13.2/V13_2_ARCHITECTURE.md`
- `V13_2_DELIVERY_NOTES.md`
- `V13_2_MANIFEST.md`

## Modified
- `lib/assessment/runtime-service.ts`
- `package.json`

## Runtime boundary
Supported package-driven types:
- DISC
- EQ
- Cognitive
- RIASEC

Free/Premium remain on their existing selection path.

## Safety
No historical QuestionVersion or AssessmentAttempt rewrite is performed by V13.2.

## Validation command
`pnpm v13:2:gate`

## Runtime command
`pnpm e2e:v13:2:selection`

The runtime E2E requires package records to exist in the target database; V13.1 deliberately did not seed example packages.
