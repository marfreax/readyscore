# F.10-C.2-E — RIASEC Runtime Persistence Fix

## Root cause

The production publication pipeline correctly promotes 60 `QuestionVersion` rows, but the runtime previously conflated:

- `Question.code` / public stable ID, e.g. `RIASEC-R-001`
- PostgreSQL `Question.id`, the foreign-key identity
- PostgreSQL `QuestionVersion.id`, the immutable version identity

The runtime selection surface uses the stable code. Persistence requires the PostgreSQL `Question.id`.

## Fix

`SelectedQuestion` now carries both:

- `questionRecordId`: canonical PostgreSQL `Question.id`
- `questionVersionId`: canonical PostgreSQL `QuestionVersion.id`

The attempt snapshot continues exposing the stable public question ID/code.

Answer persistence resolves the public question ID against the attempt snapshot and writes the canonical PostgreSQL `Question.id` into `Answer.questionId`.

Reloaded answers are translated back to the stable public question ID before being consumed by runtime/scoring.

## Verification

```bash
pnpm typecheck
pnpm build
pnpm riasec:persistence:check
pnpm e2e:riasec
```

No question-bank or lifecycle mutation is performed by the persistence check.
