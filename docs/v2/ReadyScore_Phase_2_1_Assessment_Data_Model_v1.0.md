# ReadyScore Phase 2.1 — Assessment Data Model v1.0

**Status:** LOCKED FOUNDATION  
**Phase:** 2.1  
**Scope:** Data contract only  
**Database implementation:** Phase 2.8  
**UI implementation:** Later phases

---

## 1. Purpose

Phase 2.1 menetapkan kontrak data inti ReadyScore.

Phase ini **tidak** membuat UI Trial, Admin, Payment, atau database production.

Tujuannya adalah memastikan seluruh development berikutnya mempunyai struktur data yang konsisten.

---

## 2. Core Principle

ReadyScore menggunakan model:

```text
DOMAIN
  ↓
SUBDOMAIN
  ↓
INDICATOR
  ↓
QUESTION
  ↓
ASSESSMENT QUESTION
  ↓
ANSWER
  ↓
SCORE
  ↓
RESULT
```

Question Bank dan Assessment adalah dua konsep berbeda.

**Question Bank** berisi kandidat pertanyaan.

**Assessment Configuration** menentukan bagaimana kandidat tersebut digunakan.

---

## 3. Entity Map

```text
Domain
  └── Subdomain
        └── Indicator
              └── QuestionMapping
                    └── Question

AssessmentConfiguration
  └── AssessmentQuestion
        └── Question

AssessmentAttempt
  └── AssessmentAnswer
        └── Question

AssessmentAttempt
  └── AssessmentResult
```

---

## 4. Domain

Domain adalah dimensi utama ReadyScore.

Initial v1.0:

1. Motivasi
2. Disiplin
3. Kemandirian
4. Critical Thinking
5. Problem Solving
6. Komunikasi
7. Leadership
8. Emotional Resilience

Domain memiliki:

- `id`
- `code`
- `name`
- `description`
- `sortOrder`
- `status`
- `version`

**Catatan:** nama/domain taxonomy final harus dikunci pada Phase 2.2.

---

## 5. Subdomain

Subdomain menjelaskan area measurement yang lebih spesifik di dalam Domain.

Subdomain wajib memiliki `domainId`.

Tidak boleh ada Subdomain yang berdiri sendiri tanpa Domain.

---

## 6. Indicator

Indicator adalah unit measurement yang lebih spesifik.

Hierarchy:

```text
Domain
  ↓
Subdomain
  ↓
Indicator
```

Indicator wajib mempunyai `subdomainId`.

---

## 7. Question

Question adalah item yang dijawab user.

Minimum contract:

```text
id
code
text
answerType
scale
reverseScore
scoringKey
weight
difficulty
status
mappingStatus
version
```

### Answer Type v1

```text
LIKERT_5
```

### Scale

```text
1
2
3
4
5
```

---

## 8. Reverse Scoring

Untuk question normal:

```text
1 → 1
2 → 2
3 → 3
4 → 4
5 → 5
```

Untuk question reverse:

```text
1 → 5
2 → 4
3 → 3
4 → 2
5 → 1
```

`scoringKey` disimpan secara eksplisit agar transformation deterministic.

---

## 9. Weight

Setiap question memiliki `weight`.

Default:

```text
1
```

Weight tidak boleh disimpulkan dari jumlah question dalam suatu Domain.

---

## 10. Question Mapping

Question memiliki mapping terpisah:

```text
Question
 ↓
Domain
 ↓
Subdomain
 ↓
Indicator
```

Mapping memiliki:

```text
status
method
confidence
reviewStatus
reviewedBy
reviewedAt
version
```

Ini memungkinkan mapping dilakukan melalui:

- Import
- Rule
- Manual
- AI-assisted

tetapi seluruh hasil tetap dapat diaudit.

---

## 11. Mapping Status

```text
UNMAPPED
PARTIAL
MAPPED
REVIEW_REQUIRED
APPROVED
REJECTED
```

Interpretasi:

### UNMAPPED
Belum mempunyai mapping yang cukup.

### PARTIAL
Minimal Domain tersedia, tetapi hierarchy belum lengkap.

### MAPPED
Hierarchy mapping sudah tersedia.

### REVIEW_REQUIRED
Mapping tersedia tetapi membutuhkan pemeriksaan.

### APPROVED
Mapping telah disetujui.

### REJECTED
Mapping tidak dapat digunakan.

---

## 12. Question Lifecycle

```text
DRAFT
 ↓
VALIDATED
 ↓
MAPPED
 ↓
REVIEW_REQUIRED
 ↓
APPROVED
 ↓
PUBLISHED
 ↓
ARCHIVED
```

`REJECTED` dapat terjadi pada tahap validation/review.

Only:

```text
PUBLISHED
```

yang boleh dipilih oleh production assessment engine.

---

## 13. Assessment Configuration

Assessment Configuration tidak boleh ditanam di Question.

Contoh:

```text
FREE_V1
PREMIUM_V1
```

Configuration menentukan:

- Question count
- Selection rule
- Domain quota
- Duplicate rule
- Published-only rule
- Scoring version

Dengan demikian perubahan jumlah/komposisi assessment tidak mengubah Question Bank.

---

## 14. Assessment Question

Ketika Question dipilih untuk suatu assessment, selection menjadi explicit:

```text
AssessmentQuestion
```

Minimum:

```text
questionId
sequence
domainId
subdomainId
indicatorId
required
```

Ini penting agar attempt dapat direkonstruksi.

---

## 15. Assessment Attempt

Setiap sesi assessment memiliki immutable references:

```text
assessmentConfigurationVersion
questionBankVersion
scoringVersion
```

Status:

```text
IN_PROGRESS
COMPLETED
ABANDONED
EXPIRED
```

---

## 16. Assessment Answer

Answer menyimpan:

```text
attemptId
questionId
rawValue
scoredValue
weight
sequence
```

Dengan menyimpan raw dan transformed score, result dapat diaudit.

---

## 17. Assessment Result

Result menyimpan:

```text
attemptId
assessmentConfigurationVersion
questionBankVersion
scoringVersion
overallScore
domainScores
completedAt
```

Result lama tidak boleh berubah karena Question Bank baru diterbitkan.

---

## 18. Versioning

Versioning minimum:

```text
Question Version
Question Bank Version
Assessment Configuration Version
Scoring Version
```

Example:

```text
Question Bank: QB_2026_08_001
Assessment: FREE_V1
Scoring: SCORE_V1
```

---

## 19. Database Direction

Phase 2.1 hanya menetapkan contract.

Production database akan diimplementasikan pada Phase 2.8.

Target core entities:

```text
Domain
Subdomain
Indicator
Question
QuestionVersion
QuestionMapping
QuestionImport
AssessmentConfiguration
AssessmentConfigurationVersion
AssessmentQuestion
AssessmentAttempt
AssessmentAnswer
AssessmentResult
```

---

## 20. What Is Explicitly NOT in Phase 2.1

Tidak dikerjakan sekarang:

- Trial UI
- Premium UI
- Admin UI
- Payment
- Email
- PDF
- Authentication
- PostgreSQL migration
- AI mapping execution
- Final taxonomy contents

Semua mempunyai phase masing-masing.

---

## 21. Exit Criteria

Phase 2.1 PASS jika:

- Entity contract defined
- Relationships defined
- Question model defined
- Mapping model defined
- Assessment configuration defined
- Attempt model defined
- Answer model defined
- Result model defined
- Versioning model defined
- No scoring logic depends on UI
- No production question data is hardcoded into UI

---

# END OF PHASE 2.1
