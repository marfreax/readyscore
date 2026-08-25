# ReadyScore — PHASE 2.8
# Question Bank Administration & Publishing v1.0

**Status:** IMPLEMENTED — awaiting local verification

## Objective

Membuat Question Bank menjadi sumber data yang dapat dikelola secara dinamis oleh Admin.

## Mandatory lifecycle

```text
CSV Upload
    ↓
DRAFT
    ↓
VALIDATION / MAPPING
    ↓
MAPPING APPROVED
    ↓
QUESTION APPROVED
    ↓
PUBLISHED
    ↓
ELIGIBLE FOR ASSESSMENT
```

Tidak ada auto-publish.

## Single Question Bank

Free dan Premium tidak memiliki bank terpisah.

```text
ONE QUESTION BANK
      ├── Free Selection: 20
      └── Premium Selection: 100
```

## Implemented Admin capabilities

- View Question Bank statistics.
- Upload CSV.
- Append or Replace upload mode.
- Duplicate ID protection.
- New uploads always enter `DRAFT`.
- Approve Mapping.
- Approve Question.
- Publish Question.
- Unpublish Question.
- Eligible count.
- Dynamic runtime reads the admin-managed Question Bank.
- Admin UI at `/admin/question-bank`.

## Publishing gates

A question can be published only when:

```text
mappingStatus = APPROVED
AND
status = APPROVED
```

A question becomes assessment-eligible only when:

```text
status = PUBLISHED
AND
mappingStatus = APPROVED
AND
text is not empty
AND
domain is not empty
AND
weight > 0
AND
scale = 1..5
AND
scoringKey = 1..5
```

## Upload validation

CSV upload validates:

- Required ID / Domain / Pertanyaan.
- Weight > 0.
- Domain exists in `TAXONOMY_V1`.
- Subdomain belongs to the selected Domain.
- Indicator belongs to the selected Subdomain.
- Duplicate IDs are rejected.

Domain/Subdomain/Indicator names may be supplied by name or taxonomy code; runtime state stores the taxonomy code.

## Admin authorization

If:

```text
READYSCORE_ADMIN_KEY
```

is configured, the admin API requires:

```text
x-readyscore-admin-key
```

If the environment is development and no key is configured, access is permitted for local development.

Production deployment MUST configure an admin authentication mechanism before exposing this route publicly.

## Persistence

v1 uses:

```text
data/question-bank/admin-question-bank.json
```

This is a deliberate development-stage persistence adapter.

It is NOT the final production persistence architecture.

The repository abstraction is designed so the next persistence phase can replace the filesystem with PostgreSQL without changing the admin UI/API contract.

## Important limitation

Current mapping approval requires:

- Subdomain
- Indicator
- mappingStatus `MAPPED` or `REVIEW_REQUIRED`

Questions that remain `PARTIAL` cannot be approved or published.

This is intentional and preserves the taxonomy/mapping governance.

## Runtime integration

`lib/assessment/question-bank.ts` now reads the admin-managed repository.

Therefore:

```text
Admin publishes question
        ↓
Question becomes eligible
        ↓
Assessment Selection Engine can use it
```

No JSON regeneration is required for an admin publishing action.

## Verification

Run:

```bash
pnpm typecheck
pnpm build
```

Then:

```bash
pnpm dev
```

Open:

```text
http://localhost:3000/admin/question-bank
```

Verify:

1. Dashboard loads.
2. Upload CSV works.
3. New questions enter DRAFT.
4. Duplicate IDs are rejected.
5. Mapping approval gate works.
6. Question approval gate works.
7. Publishing gate works.
8. Eligible count increases only after PUBLISHED + APPROVED mapping.
9. `/trial` reads the dynamic bank.

# END OF PHASE 2.8


## v1.1 Fixes

- Corrected API route relative imports.
- Added taxonomy-aware CSV validation.
- Added automatic initial admin dashboard load.


## v1.2 Fixes

- Corrected dynamic admin action route import depth.
- Corrected `scoringKey` typing for reverse-scored questions.
- Aligned indicator validation with `TAXONOMY_V1`, whose indicator nodes contain `code` only.


## v1.3 Fixes

- Aligned `AdminQuestion.scoringKey` with imported reverse-scored question tuples.
- Upload pipeline now accepts both normal `[1,2,3,4,5]` and reverse `[5,4,3,2,1]` scoring keys without weakening runtime eligibility rules.


## v1.4 Fixes

- Introduced canonical `ScoringKey` type shared by CSV import and Admin Question Bank.
- Eliminated duplicate tuple definitions that could drift during TypeScript compilation.


## v1.5 Fixes

- Fixed the upload route boundary by explicitly adapting `ImportedQuestion[]` to `AdminQuestion[]`.
- Exported `AdminQuestion` for the route contract.
- Kept CSV parsing and Admin persistence models decoupled.


## v1.6 Fixes

- Removed duplicate `export` modifier introduced in the upload boundary fix.


## PHASE 2.8.1 — Mapping Review & Question Selection UI

- Search and lifecycle filtering.
- Row-level Domain → Subdomain → Indicator mapping review.
- Individual mapping save endpoint.
- Checkbox-based question selection.
- Bulk mapping across selected questions.
- Bulk mapping approval, question approval, and publishing.
- Mapping changes invalidate previous question approval and require re-approval.
- Published questions must be unpublished before remapping.
