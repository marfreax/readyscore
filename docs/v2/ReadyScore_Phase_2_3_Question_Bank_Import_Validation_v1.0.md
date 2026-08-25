# ReadyScore Phase 2.3 — Question Bank Import & Validation v1.0

## Objective

Membuat Question Bank dapat di-import secara repeatable dan divalidasi sebelum digunakan oleh assessment.

## Pipeline

```text
CSV
 ↓
Parse
 ↓
Normalize
 ↓
Validate Structure
 ↓
Validate Taxonomy
 ↓
Duplicate Check
 ↓
Generate Bank Version
 ↓
Validation Report
 ↓
Validated Dataset
```

## Current source

Saat ini tersedia 10 CSV dengan total 1.825 rows.

Phase ini tidak membuat 175 question yang belum tersedia.

## Validation categories

### Hard errors

- Missing ID
- Missing question
- Missing domain
- Duplicate ID
- Invalid weight
- Unsupported question type
- Unknown domain
- Unknown subdomain
- Unknown indicator
- Domain/subdomain mismatch
- Subdomain/indicator mismatch
- Indicator without subdomain

Hard error membuat row tidak masuk validated dataset.

### Warnings

- Partial mapping

Partial mapping belum dianggap invalid. Question boleh masuk validated dataset, tetapi tidak boleh dipublish untuk assessment yang mensyaratkan mapping lengkap.

## Versioning

Setiap validated import menghasilkan `bankVersion` berbasis SHA-256 dataset.

Contoh:

```text
QB_20260822_XXXXXXXX
```

## Output

```text
data/question-bank/validated-question-bank.json
data/question-bank/question-bank-validation-report.json
data/question-bank/question-bank-validation-errors.csv
```

## Commands

```bash
pnpm validate:questions
```

Import legacy CSV ke normalized JSON:

```bash
pnpm import:questions
```

Audit:

```bash
pnpm audit:questions
```

## Important

Validation tidak sama dengan publishing.

```text
VALIDATED
   ≠
PUBLISHED
```

Publishing akan dilakukan melalui Admin Question Bank pada phase berikutnya.

## Exit Criteria

- CSV dapat dibaca tanpa manual editing.
- Duplicate ID terdeteksi.
- Structural errors terdeteksi.
- Taxonomy reference tervalidasi.
- Import menghasilkan bank version.
- Validation report tersedia.
- Invalid rows tidak masuk validated dataset.
- Partial mapping terlihat jelas.
- `pnpm typecheck` PASS.
- `pnpm build` PASS.

# END OF PHASE 2.3
