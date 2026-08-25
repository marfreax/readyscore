# ReadyScore — PHASE 2.9
# Assessment Result & Scoring Runtime v1.0

**Status:** IMPLEMENTATION READY
**Scoring Version:** `SCORING_V1`
**Taxonomy Version:** `TAXONOMY_V1`

## 1. Objective

Mengubah assessment attempt yang selesai menjadi Result Snapshot yang deterministic, versioned, dan dapat dibaca ulang tanpa bergantung pada Question Bank terbaru.

## 2. Runtime Flow

```text
IN_PROGRESS
    ↓
validate all answers
    ↓
reverse / scoring key
    ↓
Question Score 0–100
    ↓
Indicator Score
    ↓
Subdomain Score
    ↓
Domain Score
    ↓
Overall ReadyScore
    ↓
Score Band
    ↓
Data Sufficiency
    ↓
Result Snapshot
    ↓
COMPLETED
```

## 3. Scoring Rules

Mengikuti `ReadyScore_Phase_2_5_Scoring_Model_v1.0.md`:

- Likert 1–5.
- Reverse scoring menggunakan scoring key.
- Question Score: `((scoredValue - 1) / 4) × 100`.
- Weight diterapkan pada weighted mean di level Indicator.
- Subdomain menggunakan equal-weighted scored indicators.
- Domain menggunakan equal-weighted sufficient subdomains.
- Overall menggunakan equal-weighted sufficient domains.
- Internal calculation tidak dibulatkan; persistence/presentation dua decimal.
- Score wajib 0–100.
- Missing answer tidak diperlakukan sebagai score 0.

## 4. Data Sufficiency

- Indicator: minimal 1 answered question.
- Subdomain: minimal 50% indicator scored.
- Domain: minimal 50% subdomain scored.
- Overall COMPLETE: minimal 75% domain scored. Dengan 8 domain pada TAXONOMY_V1 berarti 6 domain.
- `PARTIAL`: ada domain scored tetapi belum memenuhi minimum complete.
- `INVALID`: tidak ada domain scored.

## 5. Score Bands

| Score | Band |
|---:|---|
| 0–39.99 | Perlu Pengembangan |
| 40–59.99 | Cukup |
| 60–74.99 | Baik |
| 75–89.99 | Sangat Baik |
| 90–100 | Unggul |

## 6. Result Snapshot

Result menyimpan:

- attemptId
- assessmentType
- assessmentConfigurationVersion
- questionBankVersion
- taxonomyVersion
- scoringVersion
- overallScore
- band
- status
- indicatorScores
- subdomainScores
- domainScores
- coverage
- dataSufficiency
- completedAt

Result lama tidak dihitung ulang dari Question Bank yang berubah.

## 7. API

```text
POST /api/assessment/[attemptId]/submit
GET  /api/assessment/[attemptId]/result
```

`submit` bersifat idempotent untuk attempt yang sudah COMPLETED: result snapshot yang sama dikembalikan.

## 8. Result UI

Route:

```text
/result/[attemptId]
```

Menampilkan:

- ReadyScore
- Score Band
- Result Status
- Domain Scores
- Data Sufficiency
- Question Bank / Taxonomy / Scoring Version
- Partial-result warning bila belum COMPLETE

## 9. Free vs Premium

Scoring engine sama. Perbedaan hanya berasal dari assessment configuration, question count, coverage, dan result detail.

## 10. Non-goals

Phase 2.9 tidak mencakup:

- payment
- authentication
- persistent database
- PDF report
- premium paywall
- advanced recommendations
- analytics

## PHASE 2.10 — Free Result Experience

Status: IMPLEMENTED in `README_PHASE_2_10.md`.

The result snapshot/API from Phase 2.9 remains the source of truth. Phase 2.10 only improves the user-facing Free result experience and does not alter scoring semantics.
