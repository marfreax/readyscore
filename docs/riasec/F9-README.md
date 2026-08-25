# PHASE 3.0-D.1-F.9 — RIASEC Assessment Runtime Wiring

## Source of truth

This implementation is based on the uploaded ReadyScore v2 source.

Confirmed v2 architecture:

```text
AssessmentType
  FREE | PREMIUM

assessment-config.ts
  free / premium

question-engine.ts
  shared published eligible pool
  free = random
  premium = domain quotas

runtime-service.ts
  start → select → snapshot → persist attempt
  submit → scoring-engine → persist result

AssessmentResult
  persisted as JSON in AssessmentResult.result
```

## F.9 changes

RIASEC is added as a third assessment type:

```text
FREE
PREMIUM
RIASEC
```

Configuration:

```text
RIASEC_CONFIG_V1
60 questions
RIASEC_SCORE_V1
RIASEC_SELECTION_V1
```

Selection:

```text
R = 10
I = 10
A = 10
S = 10
E = 10
C = 10
----------------
60 questions
```

The selector uses the existing published/approved question bank and matches
the RIASEC dimension from the existing `QuestionVersion.domain` field.

It fails closed if any dimension has fewer than 10 eligible questions.

## Submit flow

```text
RIASEC attempt
    ↓
existing answer persistence
    ↓
runtime submit
    ↓
scoreRiasec()
    ↓
RIASEC_RESULT_V1
    ↓
existing AssessmentResult.result JSON
    ↓
existing persistence transaction
```

The generic `scoring-engine.ts` is NOT changed.

## Database

No new result table is introduced.

The existing `AssessmentResult.result` JSON column is reused.

A Prisma enum migration adds:

```text
RIASEC
```

to `AssessmentType`.

## Required deployment order

```bash
pnpm db:generate
pnpm typecheck
pnpm build
```

If the database is already running:

```bash
pnpm prisma migrate deploy
```

Run the migration before attempting to create a RIASEC attempt.

## Important

The existing RIASEC scorer and result contract must already be present:

```text
lib/assessment/riasec/types.ts
lib/assessment/riasec/scoring.ts
lib/assessment/riasec/result-adapter.ts
lib/assessment/riasec/result-contract.ts
```

## Exit criteria

- [ ] Prisma client generated with RIASEC enum.
- [ ] Migration applied.
- [ ] typecheck passes.
- [ ] build passes.
- [ ] RIASEC start API accepts `type: "riasec"`.
- [ ] Selection returns exactly 60 questions.
- [ ] Each R/I/A/S/E/C dimension contains exactly 10 questions.
- [ ] Attempt snapshot records RIASEC configuration/version metadata.
- [ ] Submit dispatches to `scoreRiasec`.
- [ ] Result JSON contains `riasec.contractVersion = RIASEC_RESULT_V1`.
- [ ] Existing FREE/PREMIUM flows remain unchanged.

## Next

PHASE 3.0-D.1-F.10 — RIASEC Runtime E2E Validation
