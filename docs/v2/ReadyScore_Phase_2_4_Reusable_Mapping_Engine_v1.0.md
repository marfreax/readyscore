# ReadyScore Phase 2.4 — Reusable Mapping Engine v1.0

## Objective

Membangun mapping engine yang dapat digunakan berulang kali untuk:

- bank soal saat ini,
- import bank soal berikutnya,
- upload Admin di masa depan,
- 2.000 soal,
- 10.000 soal,
- 50.000+ soal.

Engine tidak dibuat sebagai script sekali pakai.

## Pipeline

```text
Validated Question Bank
        ↓
Taxonomy V1
        ↓
Candidate Generation
        ↓
Candidate Scoring
        ↓
Confidence
        ↓
Mapping Status
        ↓
Review Queue
        ↓
Human Approval
        ↓
Publish
```

## Important Governance

Mapping engine TIDAK melakukan auto-publish.

Semua mapping yang dibuat engine tetap:

```text
REVIEW_REQUIRED
```

sampai disetujui oleh proses review.

## Mapping metadata

Setiap question mendapatkan:

- `domainId`
- `subdomainId`
- `indicatorId`
- `status`
- `method`
- `confidence`
- `reviewStatus`
- `version`

Engine juga menyimpan hingga 3 candidate mapping untuk membantu review.

## Mapping methods

v1 mendukung contract berikut:

```text
IMPORT
RULE
AI_ASSISTED
MANUAL
```

Implementasi v1 menggunakan:

```text
RULE
```

dan mempertahankan explicit mapping dari CSV sebagai:

```text
IMPORT
```

AI-assisted mapping belum diaktifkan sebagai dependency runtime. Ini sengaja agar engine tetap deterministic, offline-capable, dan tidak bergantung pada API eksternal.

## Confidence

Confidence adalah confidence terhadap kandidat mapping, bukan probabilitas kebenaran ilmiah.

Decision bands:

```text
>= 0.85 + margin >= 0.12
    → MAPPED + REVIEW_REQUIRED

>= 0.65
    → REVIEW_REQUIRED

< 0.65
    → PARTIAL
```

Tidak ada score yang otomatis dianggap final.

## Reusability

Engine menerima input:

```bash
pnpm map:questions
```

atau:

```bash
pnpm map:questions -- --input path/to/validated-question-bank.json
```

Karena input dapat diberikan secara eksplisit, engine tidak terikat pada satu bank soal.

## Output

```text
data/question-bank/mapped-question-bank.json
data/question-bank/question-mapping-report.json
data/question-bank/question-mapping-review.csv
```

## Future Admin Integration

Admin upload nantinya dapat memanggil pipeline yang sama:

```text
Admin Upload
    ↓
Validation
    ↓
Mapping Engine
    ↓
Review
    ↓
Approve
    ↓
Publish
```

Tidak diperlukan mapping logic baru di Admin UI.

## Safety Rules

Engine tidak boleh:

- Mengubah Question text.
- Mengubah raw answer.
- Mengubah reverse scoring.
- Mengubah weight.
- Mengubah taxonomy.
- Menghapus question.
- Auto-publish mapping.
- Menganggap confidence sebagai ground truth.

## Exit Criteria

- Engine dapat dijalankan berulang.
- Input dapat diganti.
- Taxonomy dibaca dari registry.
- Mapping metadata dihasilkan.
- Candidate mappings tersedia.
- Confidence tersedia.
- Review queue tersedia.
- Tidak ada auto-publish.
- Output dapat dipakai oleh Admin workflow.
- `pnpm typecheck` PASS.
- `pnpm build` PASS.

# END OF PHASE 2.4
