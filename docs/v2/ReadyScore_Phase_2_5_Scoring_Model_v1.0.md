# ReadyScore Phase 2.5 — Scoring Model v1.0

**Product:** ReadyScore  
**Phase:** 2.5 — Scoring Model  
**Version:** SCORING_V1  
**Status:** DESIGN FOR REVIEW / NOT YET LOCKED

---

# 1. PURPOSE

Scoring Model menentukan bagaimana jawaban user diubah menjadi score yang konsisten dan dapat diaudit.

Model wajib deterministic:

```text
Raw Answer
   ↓
Reverse Scoring
   ↓
Question Weight
   ↓
Indicator Score
   ↓
Subdomain Score
   ↓
Domain Score
   ↓
Overall ReadyScore
```

Scoring tidak boleh bergantung pada UI, jumlah pertanyaan yang kebetulan dipilih, atau urutan pertanyaan.

---

# 2. DESIGN PRINCIPLES

## 2.1 Deterministic

Input yang sama harus selalu menghasilkan output yang sama.

```text
same answers
+
same question bank version
+
same scoring version
=
same result
```

## 2.2 Versioned

Setiap result menyimpan:

```text
questionBankVersion
taxonomyVersion
assessmentConfigurationVersion
scoringVersion
```

## 2.3 Normalized

Score utama menggunakan skala:

```text
0 – 100
```

agar mudah dipahami user.

## 2.4 Hierarchical

Score mengikuti taxonomy:

```text
Question
 ↓
Indicator
 ↓
Subdomain
 ↓
Domain
 ↓
Overall
```

## 2.5 No Double Counting

Satu Question memiliki satu Primary Indicator.

Secondary tag tidak menghasilkan score tambahan.

---

# 3. ANSWER SCALE

ReadyScore v1 menggunakan Likert 5:

| Raw | Meaning |
|---:|---|
| 1 | Sangat Tidak Sesuai |
| 2 | Tidak Sesuai |
| 3 | Netral / Kadang Sesuai |
| 4 | Sesuai |
| 5 | Sangat Sesuai |

Raw answer hanya boleh:

```text
1
2
3
4
5
```

---

# 4. REVERSE SCORING

Untuk question normal:

```text
1 → 1
2 → 2
3 → 3
4 → 4
5 → 5
```

Untuk reverse question:

```text
1 → 5
2 → 4
3 → 3
4 → 2
5 → 1
```

Formula:

```text
scoredValue = 6 - rawValue
```

Reverse scoring dilakukan sebelum weight.

---

# 5. QUESTION WEIGHT

Default:

```text
weight = 1.0
```

Weight digunakan untuk weighted mean.

Formula:

```text
Weighted Value =
Scored Value × Weight
```

Weight tidak boleh diubah oleh UI assessment.

Weight adalah bagian dari Question Bank version.

---

# 6. NORMALIZATION

Likert 1–5 dinormalisasi ke 0–100.

Formula:

```text
normalized =
((scoredValue - 1) / 4) × 100
```

Mapping:

| Scored | Normalized |
|---:|---:|
| 1 | 0 |
| 2 | 25 |
| 3 | 50 |
| 4 | 75 |
| 5 | 100 |

Penting:

Score 3 = 50, bukan 60.

---

# 7. QUESTION SCORE

Untuk setiap question:

```text
Question Score =
((Scored Value - 1) / 4) × 100
```

Kemudian weight diterapkan pada aggregation, bukan dengan mengubah skala question.

---

# 8. INDICATOR SCORE

Indicator score adalah weighted mean dari seluruh question yang memiliki Primary Indicator tersebut.

Formula:

```text
Indicator Score =
Σ(Question Score × Weight)
/
Σ(Weight)
```

Contoh:

```text
Question A = 75, Weight = 1
Question B = 100, Weight = 2

Indicator =
(75×1 + 100×2) / 3
= 91.67
```

---

# 9. SUBDOMAIN SCORE

Subdomain score dihitung dari Indicator Score yang tersedia.

v1 menggunakan equal-weighted indicators:

```text
Subdomain Score =
Σ(Indicator Score)
/
Number of scored indicators
```

Indicator yang tidak memiliki sufficient data tidak ikut dihitung.

---

# 10. DOMAIN SCORE

Domain score menggunakan equal weighting terhadap Subdomain Score yang memenuhi minimum data sufficiency.

```text
Domain Score =
Σ(Subdomain Score)
/
Number of scored subdomains
```

Tidak boleh menggunakan jumlah question mentah sebagai weighting domain.

Dengan demikian:

```text
Domain A dengan 100 questions
```

tidak otomatis memiliki pengaruh lebih besar daripada:

```text
Domain B dengan 20 questions
```

---

# 11. OVERALL READYSCORE

Overall score v1 menggunakan equal-weighted Domain Score.

```text
Overall =
Σ(Domain Score)
/
Number of scored domains
```

Semua domain memiliki bobot yang sama.

Jika 8 domain tersedia:

```text
Overall =
(D1+D2+D3+D4+D5+D6+D7+D8) / 8
```

---

# 12. WHY HIERARCHICAL EQUAL WEIGHTING

ReadyScore tidak boleh menjadi:

```text
jumlah jawaban positif
```

Model hierarchy memastikan:

```text
Question volume
    ≠
Domain influence
```

Contoh:

```text
Domain A
4 subdomains
12 indicators
120 questions

Domain B
4 subdomains
12 indicators
30 questions
```

Keduanya tetap memiliki satu Domain Score.

---

# 13. DATA SUFFICIENCY

Score tidak boleh dianggap valid hanya karena assessment selesai.

ReadyScore v1 memperkenalkan:

```text
Data Sufficiency
```

Minimum rule:

## Indicator

Indicator dianggap scored jika memiliki:

```text
minimum 1 answered question
```

## Subdomain

Subdomain dianggap scored jika:

```text
minimal 50% indicator-nya scored
```

Karena v1 memiliki 3 indicator:

```text
minimum 2 / 3 indicators
```

## Domain

Domain dianggap scored jika:

```text
minimal 50% subdomain-nya scored
```

Karena v1 memiliki 4 subdomain:

```text
minimum 2 / 4 subdomains
```

## Overall

Overall ReadyScore dianggap complete jika:

```text
minimal 6 / 8 domains scored
```

---

# 14. COMPLETE VS PARTIAL RESULT

Result memiliki status:

```text
COMPLETE
PARTIAL
INVALID
```

## COMPLETE

Jika:

```text
>= 6 of 8 domains scored
```

## PARTIAL

Jika:

```text
1–5 domains scored
```

## INVALID

Jika:

```text
0 domains scored
```

Assessment UI tetap dapat memaksa semua question dijawab, tetapi scoring engine tidak boleh menganggap data sufficient hanya karena UI menyatakan "completed".

---

# 15. DOMAIN COVERAGE

Result harus menyimpan coverage.

Contoh:

```text
Motivasi
Coverage: 100%

Disiplin
Coverage: 75%

Leadership
Coverage: 50%
```

Coverage dihitung:

```text
answered scored indicators
/
total indicators selected
```

Coverage bukan score.

---

# 16. ANSWER MISSING

Jika sebuah question tidak dijawab:

```text
Question Score = null
```

Bukan:

```text
0
```

Missing answer tidak boleh menurunkan score.

Namun missing answer dapat menurunkan data sufficiency.

---

# 17. OUTLIER / INVALID ANSWER

Jika raw answer di luar:

```text
1–5
```

maka answer invalid.

Scoring engine harus:

```text
reject
```

dan tidak menghasilkan score parsial secara diam-diam.

---

# 18. ROUNDING

Internal calculation menggunakan floating point penuh.

Rounding hanya dilakukan saat presentation/persistence result.

Precision:

```text
2 decimal places
```

Contoh:

```text
91.6666667
```

menjadi:

```text
91.67
```

Jangan melakukan rounding pada setiap tahap aggregation.

---

# 19. SCORE BANDS

v1 menggunakan 5 interpretation bands:

| Score | Band |
|---:|---|
| 0–39.99 | Perlu Pengembangan |
| 40–59.99 | Cukup |
| 60–74.99 | Baik |
| 75–89.99 | Sangat Baik |
| 90–100 | Unggul |

Band hanya interpretation layer.

Band tidak mengubah score.

---

# 20. SCORE BOUNDARY

Semua score wajib berada:

```text
0 ≤ score ≤ 100
```

Scoring engine harus melakukan assertion terhadap hasil.

Jika hasil berada di luar range:

```text
throw scoring error
```

Jangan silently clamp hasil yang seharusnya merupakan bug.

---

# 21. DOMAIN SCORE EXAMPLE

Misalnya:

```text
Motivasi
MOT-01 = 80
MOT-02 = 70
MOT-03 = 90
MOT-04 = 60
```

Maka:

```text
Domain Score
= (80 + 70 + 90 + 60) / 4
= 75
```

---

# 22. OVERALL SCORE EXAMPLE

Misalnya:

```text
MOT = 75
DIS = 80
IND = 70
CRT = 85
PRS = 72
COM = 90
LED = 78
ERS = 80
```

Maka:

```text
Overall
= (75+80+70+85+72+90+78+80) / 8
= 78.75
```

Result:

```text
ReadyScore = 78.75
Band = Sangat Baik
```

---

# 23. FREE VS PREMIUM

Scoring formula **sama** untuk Free dan Premium.

Perbedaan Free/Premium hanya pada:

```text
Assessment Configuration
Question Count
Domain Coverage
Result Detail
```

Tidak boleh ada:

```text
Free scoring formula
Premium scoring formula
```

yang berbeda tanpa perubahan `SCORING_VERSION`.

---

# 24. SCORE COMPARABILITY

Score hanya comparable jika menggunakan:

```text
same taxonomy version
same scoring version
same interpretation model
```

Contoh:

```text
SCORING_V1
TAXONOMY_V1
```

Result dengan version berbeda tidak boleh dibandingkan secara langsung tanpa normalization layer.

---

# 25. SCORING VERSION

Current:

```text
SCORING_V1
```

Jika formula berubah secara material:

```text
SCORING_V2
```

Result lama tidak boleh dihitung ulang menggunakan V2.

---

# 26. RESULT SNAPSHOT

Setiap completed result harus menyimpan snapshot minimum:

```text
overallScore
domainScores
subdomainScores
indicatorScores
dataCoverage
resultStatus
scoringVersion
taxonomyVersion
questionBankVersion
assessmentConfigurationVersion
```

Dengan demikian result dapat direproduksi tanpa bergantung pada Question Bank terbaru.

---

# 27. ANTI-GAMING RULE

Scoring engine tidak boleh menggunakan:

- jumlah question positif secara mentah,
- jumlah question yang dipilih sebagai proxy importance,
- completion speed,
- order of answering,
- user identity,
- email,
- demographic data,

untuk mengubah score pada v1.

---

# 28. FUTURE EXTENSIBILITY

Model v1 sengaja memungkinkan extension untuk:

- domain weighting,
- indicator weighting,
- psychometric calibration,
- reliability analysis,
- response consistency,
- adaptive assessment,
- percentile,
- benchmark,
- cohort comparison.

Tetapi semuanya berada di luar SCORING_V1.

Jangan menambahkan kompleksitas tersebut sekarang.

---

# 29. SCORING ENGINE CONTRACT

Minimum input:

```text
Question
Raw Answer
Question Weight
Reverse Rule
Taxonomy Mapping
Scoring Version
```

Minimum output:

```text
Question Score
Indicator Score
Subdomain Score
Domain Score
Overall Score
Coverage
Result Status
```

---

# 30. PSEUDOCODE

```text
FOR each answer:

    validate raw value

    IF reverse:
        scored = 6 - raw
    ELSE:
        scored = raw

    questionScore =
        ((scored - 1) / 4) * 100

GROUP questions by Indicator

FOR each Indicator:
    weighted mean of questionScore

GROUP indicators by Subdomain

FOR each Subdomain:
    IF scoredIndicators >= 2:
        mean indicator scores
    ELSE:
        score = null

GROUP subdomains by Domain

FOR each Domain:
    IF scoredSubdomains >= 2:
        mean subdomain scores
    ELSE:
        score = null

IF scoredDomains >= 6:
    resultStatus = COMPLETE
ELSE IF scoredDomains > 0:
    resultStatus = PARTIAL
ELSE:
    resultStatus = INVALID

IF COMPLETE:
    overall =
        mean of scored domain scores

validate 0..100

round presentation to 2 decimals
```

---

# 31. SCORING VALIDATION TEST CASES

Implementation wajib memiliki test case minimum:

### Test 1 — All 1

Expected:

```text
0
```

### Test 2 — All 5

Expected:

```text
100
```

### Test 3 — All 3

Expected:

```text
50
```

### Test 4 — Reverse

Raw:

```text
1
```

Expected:

```text
100
```

### Test 5 — Weighted

```text
75 × 1
100 × 2
```

Expected:

```text
91.67
```

### Test 6 — Missing

Missing answer:

```text
null
```

Expected:

```text
excluded from numerator and denominator
```

### Test 7 — Domain balancing

Jumlah question berbeda antar-domain tidak boleh mengubah equal domain weighting.

### Test 8 — Insufficient data

Domain dengan hanya 1 scored subdomain:

```text
Domain Score = null
```

### Test 9 — Overall partial

5 scored domains:

```text
PARTIAL
```

### Test 10 — Overall complete

6 scored domains:

```text
COMPLETE
```

---

# 32. WHAT IS NOT IN SCORING_V1

Tidak termasuk:

- AI-generated score adjustment
- demographic adjustment
- personality diagnosis
- clinical interpretation
- psychometric diagnosis
- percentile ranking
- cohort benchmark
- adaptive scoring
- machine-learning score correction
- user-specific score manipulation

ReadyScore v1 adalah measurement/scoring system, bukan diagnosis klinis.

---

# 33. PHASE 2.5 EXIT CRITERIA

Phase 2.5 PASS jika:

- [ ] Likert scale locked.
- [ ] Reverse scoring locked.
- [ ] Weighting locked.
- [ ] Normalization locked.
- [ ] Indicator aggregation locked.
- [ ] Subdomain aggregation locked.
- [ ] Domain aggregation locked.
- [ ] Overall aggregation locked.
- [ ] Data sufficiency locked.
- [ ] Missing answer behavior locked.
- [ ] Invalid answer behavior locked.
- [ ] Rounding locked.
- [ ] Score bands locked.
- [ ] Result status locked.
- [ ] Versioning locked.
- [ ] Snapshot requirements locked.
- [ ] Test cases defined.
- [ ] `SCORING_V1` approved.

After PASS:

```text
PHASE 2.5 LOCKED
       ↓
PHASE 2.6 Assessment / Question Selection Engine
```

---

# 34. STATUS

**DESIGN FOR REVIEW**

Scoring formula belum boleh diimplementasikan sebagai production truth sebelum `SCORING_V1` disetujui.

# END OF READYScore PHASE 2.5
