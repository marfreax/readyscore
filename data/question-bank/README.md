# ReadyScore Question Bank Source

Taruh seluruh file CSV bank soal di folder:

`data/question-bank/source/`

Kemudian jalankan:

```bash
pnpm import:questions
```

Importer akan:
1. membaca seluruh CSV,
2. menormalisasi dua format CSV yang saat ini digunakan,
3. menolak duplicate ID,
4. menghitung mapping status,
5. menghasilkan `data/question-bank.json`,
6. menghasilkan `data/question-bank-import-report.json`.

Jangan mengedit `data/question-bank.json` secara manual.
CSV adalah source import; JSON adalah generated artifact.


## Admin Runtime

Phase 2.8 introduces an admin-managed runtime repository at `data/question-bank/admin-question-bank.json`. The CSV remains the import source; publishing is controlled through `/admin/question-bank`.

## V3 Test-Specific Ownership

The physical question repository remains shared. Runtime assessment reads are logically scoped by `TestType`.

For an active instrument, the assessment-facing boundary is:

```text
TestType
  ↓
QuestionVersion.testTypeId
  ↓
QuestionVersion.taxonomyVersion
  ↓
published + mapping-approved QuestionVersion
```

`Question.id` remains the stable logical identity and `QuestionVersion.id` remains the immutable assessment-facing version identity.
