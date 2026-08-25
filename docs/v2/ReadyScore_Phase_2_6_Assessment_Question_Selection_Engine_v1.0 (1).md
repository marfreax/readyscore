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

**ReadyScore hanya memiliki SATU Question Bank utama.**

Free dan Premium tidak memiliki bank soal terpisah.

Semua assessment mengambil question dari:

```text
QUESTION BANK UTAMA
```

Perbedaan Free dan Premium hanya ditentukan oleh:

- jumlah question,
- selection configuration,
- coverage,
- result depth,
- fitur produk.

---

# 2. SINGLE SOURCE OF TRUTH

Architecture wajib:

```text
                 QUESTION BANK UTAMA
                 1.825 → 2.000 → 10.000 → 50.000+
                         │
              ┌──────────┴──────────┐
              ↓                     ↓
        FREE CONFIG           PREMIUM CONFIG
              │                     │
           20 soal                100 soal
              │                     │
              └──────────┬──────────┘
                         ↓
                SELECTION ENGINE
                         ↓
                  ASSESSMENT ATTEMPT
                         ↓
                   SCORING ENGINE
```

Tidak boleh ada:

```text
Free Question Bank
Premium Question Bank
```

dan tidak boleh ada duplicate source of truth.

---

# 3. CORE PRINCIPLE

Assessment bukan:

```text
ambil N soal secara random liar
```

Assessment adalah:

```text
Question Bank Utama
        ↓
Eligibility Filter
        ↓
Assessment Configuration
        ↓
Selection Strategy
        ↓
Question Selection
        ↓
Deterministic Shuffle
        ↓
Assessment Snapshot
```

Selection harus:

- taxonomy-aware,
- eligible-only,
- reproducible,
- tidak duplicate,
- dapat menggunakan randomization,
- scalable,
- tidak bergantung pada UI.

---

# 4. ASSESSMENT TYPES

## FREE_V1

```text
Question Count: 20
Source: Question Bank Utama
```

Tujuan:

- memberikan pengalaman gratis,
- memberikan quick assessment,
- memperkenalkan ReadyScore,
- menghasilkan basic result,
- menjadi entry point menuju Premium.

Free **tidak mencoba mengukur seluruh taxonomy**.

Free dapat mengambil question dari domain mana pun yang tersedia dan eligible.

---

## PREMIUM_V1

```text
Question Count: 100
Source: Question Bank Utama
```

Premium menggunakan selection strategy yang lebih comprehensive.

Target coverage:

```text
8 Domains
```

dengan distribusi question yang terkontrol.

Tujuan:

- measurement lebih comprehensive,
- domain score lebih representatif,
- subdomain/indicator coverage lebih luas,
- result lebih detail.

---

# 5. QUESTION COUNT

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

# 6. ELIGIBILITY RULE

Question hanya boleh dipilih jika:

```text
status = PUBLISHED
mapping.status = APPROVED
mapping.reviewStatus = APPROVED
answerType = LIKERT_5
weight > 0
```

Question dengan status:

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

# 7. FREE SELECTION STRATEGY

Free menggunakan:

```text
Question Bank Utama
       ↓
Eligibility Filter
       ↓
Random Selection
       ↓
20 Questions
```

Tidak ada Free-specific question pool.

Tidak ada Free-specific mapping.

Tidak ada Free-specific scoring formula.

Tidak ada Free-specific taxonomy.

---

# 8. FREE RANDOMIZATION

Free boleh mengambil question dari seluruh domain.

Contoh:

```text
Attempt A

MOT  4
DIS  3
CRT  5
LED  2
ERS  3
PRS  3
```

Attempt berikutnya dapat menghasilkan distribusi berbeda.

Contoh:

```text
Attempt B

MOT  1
DIS  5
CRT  2
LED  4
COM  3
ERS  5
```

Keduanya valid selama:

- total = 20,
- semua question eligible,
- tidak duplicate,
- mapping tersedia,
- selection memenuhi configuration.

Free **tidak diwajibkan meratakan 8 Domain**.

---

# 9. FREE RANDOMIZATION BOUNDARY

"Random" bukan berarti tanpa kontrol.

Minimum constraints tetap berlaku:

```text
published only
approved mapping only
no duplicate
valid question type
valid weight
single Question Bank version
```

Optional constraints dapat dikonfigurasi:

```text
minDomains
maxQuestionsPerDomain
difficultyQuota
```

Default v1:

```text
No mandatory domain quota.
```

Tujuannya menjaga Free tetap sederhana.

---

# 10. PREMIUM SELECTION STRATEGY

Premium menggunakan Question Bank Utama yang sama.

Namun Premium menggunakan coverage constraints:

```text
Question Bank Utama
       ↓
Eligibility Filter
       ↓
8 Domain Coverage
       ↓
Subdomain Balance
       ↓
Indicator Diversity
       ↓
Difficulty Balance
       ↓
100 Questions
```

---

# 11. PREMIUM DOMAIN DISTRIBUTION

100 questions dibagi ke 8 Domain.

Default:

```text
4 Domains = 13 questions
4 Domains = 12 questions
```

Total:

```text
52 + 48 = 100
```

Domain yang memperoleh 13 atau 12 question ditentukan secara deterministic berdasarkan configuration.

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

Actual allocation harus disimpan dalam Assessment Configuration, bukan hardcode di UI.

---

# 12. PREMIUM SUBDOMAIN BALANCE

Setiap Domain memiliki 4 Subdomain.

Jika Domain memperoleh 12 questions:

```text
3 + 3 + 3 + 3
```

Jika Domain memperoleh 13:

```text
4 + 3 + 3 + 3
```

Engine berusaha menjaga distribusi ini selama eligible questions tersedia.

---

# 13. INDICATOR COVERAGE

Selection Engine memprioritaskan indicator diversity.

Priority:

```text
1. Domain coverage
2. Subdomain coverage
3. Indicator coverage
4. Difficulty balance
5. Question diversity
6. Rotation
```

Ideal:

```text
1 question / indicator
```

Jika jumlah question lebih besar daripada indicator yang tersedia, indicator boleh muncul lebih dari sekali.

---

# 14. DIFFICULTY BALANCE

Jika difficulty tersedia:

```text
Easy
Medium
Hard
```

Premium default:

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

Jika bank tidak mencukupi:

- gunakan available eligible questions,
- jangan duplicate,
- catat deviation,
- jangan mengambil question yang tidak eligible.

---

# 15. SINGLE QUESTION BANK DOES NOT MEAN SAME SELECTION

Free dan Premium boleh memilih question yang sama dari Question Bank Utama.

Contoh:

```text
Question Bank
   ↓
RS-0100
   ├── Free Attempt A
   └── Premium Attempt B
```

Tidak ada larangan question muncul di kedua produk.

Yang berbeda adalah **selection configuration**, bukan source question.

---

# 16. DETERMINISTIC SELECTION

Selection harus reproducible.

Gunakan:

```text
assessmentType
+
assessmentConfigurationVersion
+
questionBankVersion
+
attemptSeed
+
selectionAlgorithmVersion
```

sebagai basis selection.

---

# 17. ATTEMPT SEED

Setiap attempt memiliki seed.

Contoh:

```text
attemptSeed = cryptographic random seed
```

Seed disimpan di Attempt Snapshot.

Dengan demikian:

```text
same seed
+
same bank version
+
same config
+
same selection version
=
same selected questions
```

Seed berbeda dapat menghasilkan selection berbeda.

---

# 18. QUESTION BANK VERSION

Satu attempt hanya boleh menggunakan satu Question Bank Version.

Tidak boleh:

```text
Question A → QB_V1
Question B → QB_V2
```

dalam attempt yang sama.

---

# 19. ASSESSMENT CONFIGURATION

Minimum:

```text
id
code
version
type
questionCount
allowedDomains
domainQuota
subdomainQuota
difficultyQuota
minDomains
maxQuestionsPerDomain
requirePublished
requireApprovedMapping
preventDuplicates
selectionAlgorithmVersion
```

### FREE example

```json
{
  "code": "FREE_V1",
  "questionCount": 20,
  "allowedDomains": "ALL",
  "domainQuota": null,
  "minDomains": 0,
  "maxQuestionsPerDomain": null,
  "difficultyQuota": null,
  "requirePublished": true,
  "requireApprovedMapping": true,
  "preventDuplicates": true,
  "selectionAlgorithmVersion": "SELECTION_V1"
}
```

### PREMIUM example

```json
{
  "code": "PREMIUM_V1",
  "questionCount": 100,
  "allowedDomains": "ALL",
  "domainQuota": {
    "MOT": 12,
    "DIS": 13,
    "IND": 13,
    "CRT": 13,
    "PRS": 12,
    "COM": 12,
    "LED": 12,
    "ERS": 13
  },
  "difficultyQuota": {
    "EASY": 20,
    "MEDIUM": 60,
    "HARD": 20
  },
  "requirePublished": true,
  "requireApprovedMapping": true,
  "preventDuplicates": true,
  "selectionAlgorithmVersion": "SELECTION_V1"
}
```

---

# 20. CANDIDATE RANKING

Candidate ranking priority:

```text
1. Eligibility
2. Required domain quota
3. Required subdomain quota
4. Indicator not yet represented
5. Difficulty quota
6. Question quality metadata
7. Rotation metadata
8. Deterministic pseudo-random tie breaker
```

---

# 21. QUESTION DIVERSITY

Engine harus menghindari:

- duplicate ID,
- duplicate question text,
- terlalu banyak question dengan wording identik,
- concentration berlebihan pada satu indicator.

v1 minimum:

```text
unique question ID
```

Semantic similarity dapat ditambahkan kemudian tanpa mengubah selection contract.

---

# 22. QUESTION ROTATION

Rotation bersifat secondary.

Jika tersedia:

```text
usageCount
lastUsedAt
```

question yang lebih jarang digunakan dapat mendapat priority lebih tinggi.

Tetapi:

```text
Coverage > Rotation
```

Rotation tidak boleh merusak measurement coverage.

---

# 23. ASSESSMENT SNAPSHOT

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

Selection metadata minimal:

```text
selectedCount
domainDistribution
subdomainDistribution
difficultyDistribution
```

---

# 24. IMMUTABILITY

Setelah assessment dimulai:

```text
selectedQuestionIds
```

tidak boleh berubah.

Question Bank dapat berubah setelah itu.

Attempt tetap menggunakan snapshot.

---

# 25. NO LIVE QUESTION REPLACEMENT

Tidak boleh:

```text
User sedang mengerjakan
 ↓
Question menjadi archived
 ↓
Engine mengambil question baru
```

Assessment tetap menggunakan snapshot yang telah dibuat.

---

# 26. INSUFFICIENT BANK

Jika Free membutuhkan:

```text
20
```

tetapi eligible questions hanya:

```text
15
```

maka:

```text
FAIL
```

Error:

```text
INSUFFICIENT_ELIGIBLE_QUESTIONS
```

Premium juga berlaku:

```text
100 required
92 eligible
→ FAIL
```

---

# 27. INSUFFICIENT PREMIUM DOMAIN

Jika Premium membutuhkan quota tertentu tetapi salah satu domain tidak memiliki eligible questions yang cukup:

```text
ASSESSMENT_CONFIGURATION_UNSATISFIABLE
```

Engine tidak boleh diam-diam memindahkan quota ke domain lain.

Admin harus memperbaiki:

- Question Bank,
- mapping,
- quota,
- atau configuration.

---

# 28. DIFFICULTY DEVIATION

Jika target:

```text
20 Easy
60 Medium
20 Hard
```

tetapi available:

```text
10 Easy
70 Medium
20 Hard
```

maka behavior ditentukan oleh configuration.

Jika fallback diperbolehkan:

```text
10 / 70 / 20
```

dan metadata:

```text
difficultyDeviation = true
```

Jika exact quota wajib:

```text
FAIL
```

---

# 29. FREE RESULT POSITIONING

Free assessment adalah:

```text
Quick Assessment
```

bukan full diagnostic.

Free dapat menghasilkan:

```text
Overall ReadyScore
+
Basic Domain Insight
```

Tetapi result harus menjelaskan bahwa coverage Free lebih terbatas daripada Premium.

Contoh:

> "Hasil ini berdasarkan 20 pertanyaan dari Question Bank ReadyScore. Untuk mendapatkan pengukuran yang lebih menyeluruh pada seluruh area, gunakan Premium Assessment."

---

# 30. PREMIUM RESULT POSITIONING

Premium menggunakan:

```text
100 questions
+
8 Domain coverage
+
broader Subdomain/Indicator coverage
```

Result dapat menyediakan:

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

Interpretation berada di result layer, bukan Selection Engine.

---

# 31. SECURITY

Client/browser tidak boleh menentukan:

```text
question IDs
question bank version
domain quota
scoring version
```

Client hanya meminta:

```text
createAttempt(FREE_V1)
```

atau:

```text
createAttempt(PREMIUM_V1)
```

Server menentukan seluruh selection.

Jangan mengirim seluruh Question Bank ke browser sebelum selection.

---

# 32. PERFORMANCE

Target v1:

```text
1.825 questions → selection < 500 ms
```

Design harus scalable untuk:

```text
10.000
50.000+
```

Pada database production, filtering harus menggunakan index pada:

```text
status
domain
subdomain
indicator
difficulty
questionBankVersion
```

---

# 33. FAILURE CODES

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
ASSESSMENT_CONFIGURATION_UNSATISFIABLE
```

---

# 34. TEST CASES

Minimum:

### Test 1
Free menghasilkan tepat 20.

### Test 2
Premium menghasilkan tepat 100.

### Test 3
Free dan Premium mengambil dari Question Bank Utama yang sama.

### Test 4
Tidak ada duplicate question.

### Test 5
Semua selected question PUBLISHED.

### Test 6
Semua selected question memiliki APPROVED mapping.

### Test 7
Premium mencakup 8 domain.

### Test 8
Premium domain quota tidak dilanggar.

### Test 9
Free tidak memerlukan seluruh domain.

### Test 10
Free dapat memilih domain berbeda pada seed berbeda.

### Test 11
Difficulty target Premium dipenuhi jika data tersedia.

### Test 12
Seed sama menghasilkan selection sama.

### Test 13
Seed berbeda dapat menghasilkan selection berbeda.

### Test 14
Question Bank version tidak tercampur.

### Test 15
Insufficient bank menghasilkan failure.

### Test 16
Selection snapshot dapat direkonstruksi.

### Test 17
Assessment berjalan tidak berubah ketika bank berubah.

### Test 18
Question yang sama boleh muncul pada Free dan Premium attempt berbeda.

---

# 35. VERSIONING

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

# 36. WHAT IS NOT IN PHASE 2.6

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

# 37. PHASE 2.6 EXIT CRITERIA

Phase 2.6 PASS jika:

- [ ] Single Question Bank architecture locked.
- [ ] Free configuration defined.
- [ ] Premium configuration defined.
- [ ] Free random selection defined.
- [ ] Premium coverage selection defined.
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

# 38. STATUS

**DESIGN FOR REVIEW / IMPLEMENTATION READY**

No production implementation should alter these rules without creating a new Selection Engine version.

# END OF READYScore PHASE 2.6
