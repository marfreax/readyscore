# ReadyScore — PHASE 2.15.3 Final Apply

## Scope

This package completes Phase 2.15.3 by:

1. Restoring the exact migration files already applied to PostgreSQL.
2. Adding the safe `question_bank_runtime` migration.
3. Preserving existing `Question` / `QuestionVersion` data.
4. Persisting `AssessmentResult`.
5. Providing the runtime error helper required by the assessment routes.
6. Keeping Question Bank runtime on Prisma/PostgreSQL rather than the JSON state file.

## Important

Do NOT run `prisma migrate reset`.

Do NOT delete the PostgreSQL volume.

The first two migrations are restored byte-for-byte from the earlier project source. Their SHA-256 checksums are:

- `20260822120013_foundation`: `cbfdb59a3a4bbea6da893972c5af7229b64d9d02ea1f910c084fc3444aa6083e`
- `20260822120935_core_assessment_schema`: `0d11556e2f6bb366b8b5cd9d85917a41acd92156d499dc8eed5f32df5fa08ccd`

## Apply

From the ReadyScore project root:

```bash
pnpm db:validate
pnpm db:format
pnpm db:migrate
pnpm db:generate
pnpm typecheck
pnpm build
```

`db:migrate` should apply only:

```text
20260822131500_question_bank_runtime
```

The two restored migrations are already marked as applied in the database and must not be re-executed.

## Verify database

```bash
docker exec readyscore-postgres psql -U readyscore -d readyscore -c '\dt'
```

Expected additional table:

```text
AssessmentResult
```

Verify question preservation:

```bash
docker exec readyscore-postgres psql -U readyscore -d readyscore -c 'SELECT COUNT(*) AS questions FROM "Question";'
docker exec readyscore-postgres psql -U readyscore -d readyscore -c 'SELECT COUNT(*) AS versions FROM "QuestionVersion";'
```

The counts must not decrease.

Verify migration state:

```bash
pnpm exec prisma migrate status
```

Expected:

```text
Database schema is up to date!
```

## Runtime verification

Open:

```text
http://localhost:3000/admin/question-bank
```

The page must now read from PostgreSQL.

Then verify a known imported question, for example:

```text
RS-1826
```

If the database currently contains only the 200 additional test questions, the Admin total will correctly show 200. It will not magically show 2,025 until the original 1,825 source bank is also seeded/imported into PostgreSQL.

The existing JSON bank remains a seed/source artifact, not the runtime source of truth.
