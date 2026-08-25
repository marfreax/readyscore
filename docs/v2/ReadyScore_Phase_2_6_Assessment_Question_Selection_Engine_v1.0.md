# ReadyScore Phase 2.6 — Assessment / Question Selection Engine v1.0

**Product:** ReadyScore  
**Phase:** 2.6  
**Version:** SELECTION_V1  
**Status:** DESIGN FOR REVIEW / IMPLEMENTATION READY  
**Depends on:** Phase 2.1, 2.2, 2.3, 2.4  
**Scoring dependency:** Compatible with SCORING_V1; does not modify scoring rules.

---

# 1. PURPOSE

Selection Engine menentukan pertanyaan mana yang digunakan dalam sebuah assessment.

Target utama:

```text
FREE
20 Questions

PREMIUM
100 Questions
```

Selection harus:

- taxonomy-aware,
- balanced,
- deterministic,
- reproducible,
- tidak duplicate,
- hanya menggunakan question yang eligible,
- dapat berkembang dari 1.825 menjadi puluhan ribu soal,
- tidak bergantung pada UI.

---

# 2. CORE PRINCIPLE

Assessment bukan:

```text
ambil 20 soal secara random
```

Assessment adalah:

```text
Assessment Configuration
        ↓
Eligibility Filter
        ↓
Taxonomy Quota
        ↓
Indicator Coverage
        ↓
Difficulty Balance
        ↓
Question Selection
        ↓
Deterministic Shuffle
        ↓
Assessment Snapshot
```

---

# 3. ASSESSMENT TYPES

## FREE_V1

```text
Question Count: 20
```

Free digunakan sebagai trial.

Tujuan:

- memberikan pengalaman ReadyScore,
- memperkenalkan konsep score,
- memberikan hasil dasar,
- tidak harus mengukur seluruh taxonomy.

Free harus memiliki cakupan domain terbatas sesuai product configuration.

## PREMIUM_V1

```text
Question Count: 100
```

Premium menggunakan seluruh 8 Domain.

Tujuan:

- measurement lebih comprehensive,
- domain score lebih stabil,
- subdomain/indicator coverage lebih luas,
- result lebih detail.

---

# 4. IMPORTANT: QUESTION COUNT IS FIXED

Selection Engine harus menghasilkan tepat:

```text
FREE = 20
PREMIUM = 100
```

kecuali eligible question tidak mencukupi.

Jika tidak mencukupi:

```text
ASSESSMENT_NOT_ELIGIBLE
```

Jangan diam-diam mengurangi jumlah question.

---

# 5. ELIGIBILITY RULE

Question hanya boleh dipilih jika:

```text
status = PUBLISHED
mapping.status = APPROVED
mapping.reviewStatus = APPROVED
answerType = LIKERT_5
weight > 0
```

Question dengan:

```text
DRAFT
VALIDATED
MAPPED
REVIEW_REQUIRED
PARTIAL
UNMAPPED
REJECTED
```

tidak boleh masuk production assessment.

---

# 6. TAXONOMY REQUIREMENT

Premium:

```text
8 Domains
```

harus memiliki eligible questions.

Free:

```text
Allowed Domains
```

ditentukan oleh Assessment Configuration.

Selection Engine tidak hardcode domain Free di source code.

---

# 7. PREMIUM DOMAIN DISTRIBUTION

100 questions harus didistribusikan seimbang.

Default:

```text
8 Domains
×
12 or 13 Questions
=
100
```

Distribution:

```text
Domain 1–4 = 13 questions
Domain 5–8 = 12 questions
```

Namun assignment 13/12 harus ditentukan deterministically berdasarkan domain code, bukan random per attempt.

Contoh:

```text
CRT = 13
DIS = 13
ERS = 13
IND = 13
COM = 12
LED = 12
MOT = 12
PRS = 12
```

Actual allocation dapat dikonfigurasi.

---

# 8. FREE DOMAIN DISTRIBUTION

Free tidak menggunakan semua domain.

Free configuration harus menentukan:

```text
allowedDomains
```

Contoh configuration:

```text
MOT
DIS
CRT
ERS
```

20 question kemudian didistribusikan:

```text
5 questions × 4 domains
```

atau configuration lain.

**Domain Free harus configurable, bukan hardcoded.**

---

# 9. INDICATOR COVERAGE

Selection Engine tidak boleh hanya menjaga domain.

Ia juga harus berusaha menyebarkan question ke indicator berbeda.

Priority:

```text
1. Domain coverage
2. Subdomain coverage
3. Indicator coverage
4. Difficulty balance
5. Question diversity
```

---

# 10. INDICATOR REPETITION

Dalam satu assessment:

Ideal:

```text
1 question / indicator
```

Jika jumlah eligible indicator tidak mencukupi:

```text
2 questions / indicator
```

diperbolehkan.

Tetapi engine harus meminimalkan concentration.

---

# 11. SUBDOMAIN BALANCE

Premium memiliki:

```text
4 Subdomains / Domain
```

Jika satu Domain mendapat 12–13 question:

ideal:

```text
3 questions × 4 subdomains
```

Jika mendapat 13:

```text
4 + 3 + 3 + 3
```

Allocation ditentukan oleh deterministic quota distribution.

---

# 12. DIFFICULTY BALANCE

Jika difficulty tersedia:

```text
Easy
Medium
Hard
```

Default Premium target:

```text
20% Easy
60% Medium
20% Hard
```

Untuk 100:

```text
20 Easy
60 Medium
20 Hard
```

Untuk 20:

```text
4 Easy
12 Medium
4 Hard
```

Jika bank tidak memiliki cukup questions pada suatu difficulty:

- gunakan available questions,
- jangan duplicate,
- jangan mengganti dengan question yang tidak eligible,
- catat deviation dalam selection metadata.

---

# 13. QUESTION DIVERSITY

Engine harus menghindari:

- duplicate question,
- duplicate wording,
- question dengan text terlalu mirip,
- terlalu banyak question dari source yang sama jika metadata tersedia.

v1 minimum:

```text
unique question ID
```

Future semantic similarity dapat ditambahkan tanpa mengubah selection contract.

---

# 14. DETERMINISTIC SELECTION

Selection harus reproducible.

Gunakan:

```text
assessmentType
+
assessmentVersion
+
questionBankVersion
+
attemptSeed
```

sebagai basis deterministic selection.

Contoh:

```text
FREE_V1
QB_20260822_A1B2C3D4
SEED_8F23...
```

Result selection harus dapat direkonstruksi.

---

# 15. ATTEMPT SEED

Setiap attempt memiliki seed.

Contoh:

```text
attemptSeed = cryptographic random seed
```

Seed disimpan di Attempt Snapshot.

Dengan demikian:

```text
Attempt A
→ set question A

Attempt B
→ set question B
```

dapat berbeda tetapi tetap reproducible jika seed tersedia.

---

# 16. QUESTION BANK VERSION

Selection wajib menggunakan satu Question Bank Version.

Tidak boleh terjadi:

```text
Question 1 dari QB_V1
Question 2 dari QB_V2
```

dalam satu attempt.

---

# 17. ASSESSMENT CONFIGURATION

Minimum:

```text
id
code
version
type
questionCount
allowedDomains
domainQuota
difficultyQuota
requirePublished
requireApprovedMapping
preventDuplicates
selectionAlgorithmVersion
```

Contoh:

```json
{
  "code": "PREMIUM_V1",
  "questionCount": 100,
  "allowedDomains": [
    "MOT",
    "DIS",
    "IND",
    "CRT",
    "PRS",
    "COM",
    "LED",
    "ERS"
  ],
  "requirePublished": true,
  "requireApprovedMapping": true,
  "preventDuplicates": true,
  "selectionAlgorithmVersion": "SELECTION_V1"
}
```

---

# 18. SELECTION ALGORITHM

Pseudocode:

```text
LOAD assessment configuration

LOAD one Question Bank version

FILTER eligible questions

VALIDATE total eligible count

ALLOCATE domain quotas

FOR each domain:

    allocate subdomain quotas

    allocate difficulty quotas

    rank candidate questions

    prioritize indicator diversity

    select questions

IF total selected != configured question count:

    fail assessment generation

VALIDATE:
    no duplicates
    domain quota
    eligibility
    mapping approval
    difficulty target/deviation

DETERMINISTIC SHUFFLE

CREATE ASSESSMENT SNAPSHOT
```

---

# 19. CANDIDATE RANKING

Candidate ranking priority:

```text
1. Eligibility
2. Required domain quota
3. Indicator not yet represented
4. Subdomain under quota
5. Difficulty under quota
6. Question quality metadata
7. Deterministic pseudo-random tie breaker
```

Question quality metadata dapat mencakup:

```text
qualityScore
usageCount
lastUsedAt
```

tetapi hanya jika tersedia.

---

# 20. QUESTION ROTATION

Engine harus menghindari assessment yang selalu menggunakan question sama.

Jika metadata tersedia:

```text
usageCount
lastUsedAt
```

question yang jarang digunakan mendapat priority lebih tinggi.

Namun rotation tidak boleh merusak taxonomy quota.

Priority:

```text
Measurement coverage
>
Rotation
```

---

# 21. ASSESSMENT SNAPSHOT

Saat selection selesai, simpan:

```text
attemptId
assessmentConfigurationId
assessmentConfigurationVersion
questionBankVersion
taxonomyVersion
selectionAlgorithmVersion
attemptSeed
selectedQuestionIds
selectedQuestionSequence
selectionMetadata
createdAt
```

Question order juga disimpan.

---

# 22. IMMUTABILITY

Setelah assessment dimulai:

```text
selectedQuestionIds
```

tidak boleh berubah.

Jika Question Bank di-update setelah attempt dimulai:

attempt tetap menggunakan snapshot lama.

---

# 23. NO LIVE QUESTION REPLACEMENT

Jangan melakukan:

```text
User sedang mengerjakan
 ↓
Question dihapus
 ↓
Engine mengambil question baru
```

Ini merusak reproducibility.

Jika question menjadi invalid setelah assessment dimulai:

assessment tetap menggunakan snapshot question tersebut.

---

# 24. INSUFFICIENT BANK

Jika Premium membutuhkan:

```text
100
```

tetapi eligible question hanya:

```text
92
```

maka:

```text
FAIL
```

bukan:

```text
92 questions
```

Error:

```text
INSUFFICIENT_ELIGIBLE_QUESTIONS
```

---

# 25. INSUFFICIENT DOMAIN

Jika salah satu domain Premium tidak mempunyai question yang cukup untuk quota:

```text
ASSESSMENT_CONFIGURATION_UNSATISFIABLE
```

Admin harus memperbaiki:

- Question Bank,
- mapping,
- quota,
- atau configuration.

Selection Engine tidak boleh silently mengubah requirement.

---

# 26. DIFFICULTY DEVIATION

Jika target:

```text
20 Easy
60 Medium
20 Hard
```

tetapi hanya tersedia:

```text
10 Easy
70 Medium
20 Hard
```

Engine boleh menghasilkan:

```text
10 / 70 / 20
```

jika configuration mengizinkan fallback.

Metadata harus mencatat:

```text
difficultyDeviation = true
```

Jika configuration mensyaratkan exact quota:

```text
FAIL
```

---

# 27. FREE ASSESSMENT DESIGN

Free v1 harus tetap terasa berguna tetapi tidak menjadi full diagnostic.

Recommended:

```text
20 questions
4 selected domains
5 questions / domain
```

Dengan:

```text
2–3 subdomains/domain
```

yang dikonfigurasi.

Free result:

```text
Overall ReadyScore
+
selected domain score
+
basic interpretation
```

---

# 28. PREMIUM ASSESSMENT DESIGN

Premium:

```text
100 questions
8 domains
12–13 questions/domain
```

Target:

```text
3 questions/subdomain minimum
```

dengan indicator diversity sebanyak mungkin.

Premium result:

```text
Overall ReadyScore
+
8 Domain Scores
+
Subdomain Scores
+
Indicator-level data
+
Strengths
+
Development Areas
```

Result interpretation berada di layer berikutnya.

---

# 29. SECURITY

Selection configuration tidak boleh dapat dimodifikasi oleh client/browser.

Client hanya meminta:

```text
createAttempt(assessmentType)
```

Server menentukan:

```text
configuration
questionBankVersion
seed
selection
snapshot
```

Jangan kirim seluruh Question Bank ke browser sebelum selection.

---

# 30. PERFORMANCE

Target v1:

```text
1.825 questions → selection < 500 ms
```

Design harus tetap viable untuk:

```text
10.000 questions
50.000 questions
```

Untuk puluhan ribu question, database query harus menggunakan indexed filtering berdasarkan:

```text
status
domain
subdomain
indicator
difficulty
version
```

---

# 31. FAILURE CODES

Minimum:

```text
SELECTION_INVALID_CONFIGURATION
INSUFFICIENT_ELIGIBLE_QUESTIONS
INSUFFICIENT_DOMAIN_QUESTIONS
INSUFFICIENT_SUBDOMAIN_QUESTIONS
DIFFICULTY_QUOTA_UNSATISFIABLE
DUPLICATE_SELECTION
QUESTION_NOT_ELIGIBLE
QUESTION_BANK_VERSION_NOT_FOUND
```

---

# 32. TEST CASES

Minimum test suite:

### Test 1
Free menghasilkan tepat 20.

### Test 2
Premium menghasilkan tepat 100.

### Test 3
Tidak ada duplicate question.

### Test 4
Semua selected question PUBLISHED.

### Test 5
Semua selected question memiliki APPROVED mapping.

### Test 6
Premium mencakup 8 domain.

### Test 7
Domain quota tidak dilanggar.

### Test 8
Difficulty target dipenuhi jika data tersedia.

### Test 9
Seed sama menghasilkan selection sama.

### Test 10
Seed berbeda dapat menghasilkan selection berbeda.

### Test 11
Question Bank version berbeda tidak tercampur.

### Test 12
Insufficient bank menghasilkan failure.

### Test 13
Question invalid tidak masuk selection.

### Test 14
Selection snapshot dapat direkonstruksi.

### Test 15
Assessment yang sedang berjalan tidak berubah ketika bank berubah.

---

# 33. VERSIONING

Current:

```text
SELECTION_V1
```

Jika algoritma berubah secara material:

```text
SELECTION_V2
```

Existing attempts tetap menggunakan version lama.

---

# 34. WHAT IS NOT IN PHASE 2.6

Tidak termasuk:

- Payment
- Login
- Admin UI
- PDF
- Email
- Result interpretation engine
- AI-generated recommendations
- Adaptive testing
- Psychometric calibration
- Machine learning selection
- A/B testing

---

# 35. PHASE 2.6 EXIT CRITERIA

Phase 2.6 PASS jika:

- [ ] Free configuration defined.
- [ ] Premium configuration defined.
- [ ] Eligibility rules defined.
- [ ] Domain quota defined.
- [ ] Subdomain quota defined.
- [ ] Indicator diversity defined.
- [ ] Difficulty balancing defined.
- [ ] Deterministic seed defined.
- [ ] Question Bank version isolation defined.
- [ ] Snapshot defined.
- [ ] Rotation strategy defined.
- [ ] Failure behavior defined.
- [ ] Security boundary defined.
- [ ] Performance target defined.
- [ ] Test cases defined.
- [ ] `SELECTION_V1` implemented and tested.
- [ ] `pnpm typecheck` PASS.
- [ ] `pnpm build` PASS.

---

# 36. STATUS

**DESIGN FOR REVIEW / IMPLEMENTATION READY**

No production implementation should alter these rules without creating a new Selection Engine version.

# END OF READYScore PHASE 2.6
