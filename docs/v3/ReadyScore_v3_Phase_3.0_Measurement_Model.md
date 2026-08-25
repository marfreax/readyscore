# ReadyScore v3 — PHASE 3.0
# Measurement Model & Construct Reconciliation

**Version:** 3.0.0  
**Status:** ACTIVE  
**Phase Type:** Measurement / Product Architecture / Scoring Governance  
**Prerequisite:** ReadyScore v2 Assessment Platform Foundation  
**Next Gate:** Phase 3.1 — Assessment Product Architecture

---

## 1. OBJECTIVE

Phase 3.0 adalah **measurement gate** untuk ReadyScore v3.

Tujuan phase ini bukan menambah fitur.

Tujuan utamanya adalah memastikan bahwa ReadyScore benar-benar tahu:

1. apa yang diukur;
2. mengapa sesuatu diukur;
3. bagaimana item mewakili construct;
4. bagaimana response berubah menjadi score;
5. apa arti score;
6. kapan score dianggap cukup kuat;
7. bagaimana beberapa profile boleh digabungkan;
8. apa yang boleh dan tidak boleh disimpulkan dari hasil assessment.

**Tidak ada Phase 3.1 sebelum Phase 3.0 PASS.**

---

# 2. WHY THIS PHASE EXISTS

ReadyScore v2 sudah membuktikan bahwa assessment runtime dapat:

```text
Select Questions
      ↓
Present Questions
      ↓
Collect Answers
      ↓
Calculate Result
      ↓
Persist Result
      ↓
Render Result
```

Question Bank juga sudah mempunyai konsep:

```text
Domain
Subdomain
Indicator
Question
QuestionVersion
MappingStatus
QuestionStatus
```

dan eligibility assessment menggunakan status published/approved/mapped. fileciteturn59file12L1-L20

Namun kemampuan teknis menghitung score **tidak otomatis berarti score tersebut valid secara measurement**.

Standards for Educational and Psychological Testing yang diterbitkan bersama AERA, APA, dan NCME menempatkan validitas, interpretasi score, fairness, dan penggunaan score sebagai bagian penting dari testing. citeturn0search0turn0search2

Karena itu Phase 3 dimulai dari measurement, bukan dari UI atau payment.

---

# 3. CURRENT BASELINE

## 3.1 Current assessment model

Current implementation menggunakan Likert 1–5.

Runtime sebelumnya juga memvalidasi bahwa answer harus berada pada rentang 1–5. fileciteturn59file16L1-L5

Question model mendukung:

```text
type
answerType
reverseScore
weight
scale
scoringKey
difficulty
domain
subdomain
indicator
```

Question Bank admin juga sudah memisahkan:

```text
mapping
approval
publication
eligibility
```

fileciteturn59file14L1-L20

## 3.2 Current result model

Current result page mengenal:

```text
overallScore
band
status
assessmentType
scoringVersion
taxonomyVersion
questionBankVersion
domainScores
subdomainScores
indicatorScores
coverage
dataSufficiency
completedAt
```

fileciteturn59file17L1-L60

Ini menjadi baseline yang harus direkonsiliasi, bukan langsung dibuang.

---

# 4. CRITICAL OBSERVATION

Dalam pengujian manual:

```text
20 questions
20 answered
all answers = Netral
result = 75
```

Observation ini harus diperlakukan sebagai **measurement investigation**, bukan bug atau angka yang langsung dianggap benar.

Pertanyaan wajib:

```text
Mengapa Netral = 75?
```

Kemungkinan penyebab harus dibuktikan dari formula aktual:

- baseline transformation;
- Likert normalization;
- reverse scoring;
- weighting;
- domain aggregation;
- coverage treatment;
- overall-score transformation.

**Tidak boleh menebak.**

---

# 5. CORE MEASUREMENT PRINCIPLE

ReadyScore v3 memisahkan:

```text
CONSTRUCT
    ↓
INSTRUMENT
    ↓
DIMENSION
    ↓
INDICATOR
    ↓
ITEM
    ↓
RESPONSE
    ↓
RAW SCORE
    ↓
SCALE SCORE
    ↓
PROFILE
    ↓
INTERPRETATION
```

Jangan langsung:

```text
Question → Overall Score
```

---

# 6. CONSTRUCT DEFINITION

A **construct** adalah konsep yang ingin diukur.

Contoh:

```text
Cognitive Reasoning
Emotional Regulation
Resilience
Personality Pattern
Vocational Interest
Strength Preference
```

Setiap construct wajib mempunyai:

| Field | Requirement |
|---|---|
| constructId | required |
| name | required |
| definition | required |
| constructType | required |
| instrument | required |
| dimensions | required |
| scoringModel | required |
| interpretationModel | required |
| intendedUse | required |
| prohibitedClaims | required |
| validationStatus | required |

---

# 7. CONSTRUCT TYPES

ReadyScore v3 membedakan minimal:

```text
ABILITY
TRAIT
INTEREST
PREFERENCE
PROFILE
READINESS
```

## ABILITY

Contoh:

```text
Numerical Reasoning
Logical Reasoning
Verbal Reasoning
Spatial Reasoning
```

Jawaban mempunyai correct/incorrect semantics.

## TRAIT

Contoh:

```text
Emotional Regulation
Resilience tendency
Personality tendency
```

Tidak mempunyai satu "jawaban benar" seperti cognitive item.

## INTEREST

Contoh:

```text
RIASEC
```

Mengukur kecenderungan terhadap aktivitas/lingkungan.

O*NET Interest Profiler menggunakan enam vocational interest areas:

```text
Realistic
Investigative
Artistic
Social
Enterprising
Conventional
```

dan secara eksplisit memosisikannya sebagai alat career exploration, bukan ukuran kemampuan. citeturn0search3turn0search19

## PREFERENCE

Contoh:

```text
Learning Preference
Work Preference
Activity Preference
```

## PROFILE

Profile adalah hasil sintesis beberapa dimension.

Profile **bukan construct baru secara otomatis**.

---

# 8. CANDIDATE ASSESSMENT CATALOG

Status berikut adalah:

> CANDIDATE — NOT YET LOCKED

| Instrument | Primary Type | Intended Output |
|---|---|---|
| Cognitive Ability | ABILITY | Cognitive Profile |
| EQ | TRAIT / PROFILE | Emotional Profile |
| AQ | TRAIT / PROFILE | Resilience Profile |
| DISC | TRAIT / PROFILE | Behavioral Personality Profile |
| Strength Profile | PREFERENCE / PROFILE | Strength Profile |
| RIASEC | INTEREST | Interest Profile |
| Learning Profile | PREFERENCE | Learning Profile |

Tidak ada instrument yang otomatis menjadi "official" hanya karena namanya populer.

---

# 9. IQ DECISION

ReadyScore tidak boleh menyebut suatu score sebagai:

> IQ

hanya karena score berada pada skala 0–100.

Jika instrument tidak menggunakan basis psikometrik dan norming yang memadai untuk klaim IQ, terminology sementara:

> **Cognitive Ability Profile**

atau:

> **Cognitive Reasoning Assessment**

Formal IQ claim menjadi decision gate terpisah.

---

# 10. EQ DECISION

EQ harus dipisahkan dari personality.

Minimum conceptual separation:

```text
Emotion Awareness
Emotion Regulation
Empathy / Social Awareness
Relationship / Social Response
```

Jika self-report digunakan, result harus disebut sebagai profile/tendency sesuai evidence.

Tidak boleh:

```text
EQ = personality score
```

---

# 11. AQ DECISION

AQ diperlakukan sebagai resilience/adversity-response construct.

Potential dimensions:

```text
Control
Ownership
Reach
Endurance
```

Namun dimensions final harus dikunci berdasarkan instrument specification yang dipilih.

Jangan membuat AQ hanya dari:

```text
"seberapa kuat Anda menghadapi masalah?"
```

tanpa construct map.

---

# 12. DISC DECISION

DISC adalah personality/behavioral profile.

Output:

```text
Primary Pattern
Secondary Pattern
Behavioral Tendencies
Potential Strengths
Potential Challenges
```

Bukan:

```text
DISC = aptitude
```

dan bukan:

```text
DISC → major automatically
```

---

# 13. STRENGTH / 8-DIMENSION PROFILE

Candidate dimensions:

```text
Linguistic
Logical-Mathematical
Spatial
Bodily-Kinesthetic
Musical
Interpersonal
Intrapersonal
Naturalistic
```

Untuk ReadyScore v3, terminology komersial sementara:

> **Strength Profile**

atau:

> **8-Dimension Strength Profile**

Bukan:

> "8 jenis IQ"

dan bukan:

> "bukti bahwa seseorang pasti berbakat pada bidang tertentu."

---

# 14. RIASEC DECISION

RIASEC menjadi candidate instrument prioritas tinggi karena langsung relevan dengan career/study exploration.

O*NET Interest Profiler menyediakan 30-item Mini-IP dan 60-item Short Form dan menggunakan RIASEC structure. citeturn0search3

Target output:

```text
R score
I score
A score
S score
E score
C score
```

kemudian:

```text
Top Interest Pattern
```

Contoh:

```text
I-A-R
```

Namun score RIASEC harus tetap berada dalam domain:

> **interest**

bukan:

> ability.

O*NET juga menggunakan correspondence antara profil minat individu dan profil pekerjaan untuk career exploration. citeturn0search14

---

# 15. SCORE SEMANTICS

ReadyScore v3 wajib membedakan:

## RAW SCORE

Score langsung dari response.

## SCALE SCORE

Score setelah transformation.

## PROFILE SCORE

Score per construct/dimension.

## FIT SCORE

Score yang digunakan untuk menunjukkan correspondence/recommendation.

## READINESS SCORE

Score yang menunjukkan readiness terhadap defined context.

These are NOT interchangeable.

---

# 16. THE 0–100 RULE

0–100 adalah **presentation scale**, bukan otomatis measurement scale.

Contoh:

```text
Score = 75
```

belum berarti:

```text
75% ability
75% intelligence
75% probability
75th percentile
```

Tanpa definition, angka tersebut tidak boleh diberi interpretasi tersebut.

---

# 17. NEUTRAL RESPONSE RULE

Likert:

```text
1 = ...
2 = ...
3 = Neutral
4 = ...
5 = ...
```

harus mempunyai semantics yang jelas.

Untuk current system:

```text
ALL_NEUTRAL = 3
```

menjadi permanent regression case.

Expected behavior harus ditentukan dari measurement specification.

Tidak boleh:

> "75 terlihat bagus, jadi kita biarkan."

---

# 18. REVERSE SCORING RULE

Untuk item reverse:

```text
transformed = max + min - raw
```

Untuk scale 1–5:

```text
1 → 5
2 → 4
3 → 3
4 → 2
5 → 1
```

Reverse scoring harus dilakukan sebelum dimension aggregation.

---

# 19. WEIGHTING RULE

Weight hanya boleh digunakan jika ada alasan measurement/product yang terdokumentasi.

Default:

```text
weight = 1
```

Jika:

```text
weight != 1
```

harus ada:

```text
weightReason
```

Tidak boleh memakai weight untuk "mempercantik" result.

---

# 20. DOMAIN / DIMENSION AGGREGATION

Untuk instrument multi-dimension:

```text
Item
 ↓
Indicator
 ↓
Dimension
 ↓
Instrument
```

Aggregation harus terdokumentasi.

Contoh:

```text
Dimension Score
=
weighted mean of eligible item scores
```

Kemudian:

```text
Instrument Profile
=
vector of dimension scores
```

Bukan langsung average semua dimension kecuali model memang mengharuskannya.

---

# 21. OVERALL SCORE RULE

ReadyScore v3 **tidak menggunakan universal overall score sebagai default**.

Default output:

```text
PROFILE
```

Jika overall score tetap digunakan:

```text
overallScore
```

harus memiliki:

```text
overallScoreDefinition
overallScorePurpose
overallScoreFormula
overallScoreVersion
```

---

# 22. CROSS-INSTRUMENT SYNTHESIS

Ini adalah prinsip paling penting untuk produk Future.

Jangan:

```text
IQ + EQ + AQ + DISC + RIASEC
--------------------------------
5
```

menjadi overall.

Yang benar:

```text
Cognitive Profile
       +
Emotional Profile
       +
Resilience Profile
       +
Personality Profile
       +
Interest Profile
       +
Strength Profile
       ↓
SYNTHESIS
       ↓
Study Direction
```

Cross-instrument synthesis adalah recommendation layer, bukan sekadar arithmetic average.

---

# 23. RECOMMENDATION INPUT HIERARCHY

Untuk study/major recommendation, provisional hierarchy:

## Primary signals

```text
Interest
Cognitive Ability
Relevant Strength Profile
```

## Supporting signals

```text
Personality
Learning Profile
EQ
AQ
```

## Contextual signals

```text
User goals
Academic background
Constraints
Preferences
```

Tidak ada satu assessment yang boleh sendirian menentukan major.

---

# 24. FIT SCORE

Jika nantinya digunakan:

```text
Major Fit = f(
    interest correspondence,
    relevant ability,
    relevant strengths,
    learning preference,
    personality/context
)
```

Fit score berarti:

> degree of correspondence between the person's profile and a defined study/career profile.

Fit score bukan:

```text
probability of graduation
probability of success
guaranteed suitability
```

---

# 25. RESULT LANGUAGE

Allowed:

```text
Strong fit
Potential fit
Worth exploring
Areas to strengthen
Potential challenge
Suggested exploration
```

Avoid:

```text
You must become...
You are definitely suitable for...
You are not suitable for...
Your IQ determines...
You will succeed in...
```

---

# 26. COVERAGE

Coverage harus menjadi first-class measurement metadata.

Minimum:

```text
answeredItems
totalItems
dimensionCoverage
constructCoverage
requiredCoverage
```

Example:

```text
Cognitive
Coverage: 100%

EQ
Coverage: 100%

RIASEC
Coverage: 83%
```

Result harus menjelaskan jika profile belum cukup terukur.

---

# 27. SUFFICIENCY

Coverage != Sufficiency.

Contoh:

```text
10 / 10 answered
```

belum otomatis berarti:

```text
measurement sufficient
```

Sufficiency ditentukan oleh instrument specification.

Future:

```text
sufficient = instrument-specific rule
```

---

# 28. CONFIDENCE

ReadyScore v3 harus mempertimbangkan terminology:

> **Result Confidence**

tetapi jangan mengklaim statistical confidence interval jika belum tersedia.

Untuk MVP, confidence dapat berupa:

```text
HIGH
MODERATE
LIMITED
```

berdasarkan predefined coverage/measurement rules.

---

# 29. VALIDATION STATUS

Setiap instrument harus mempunyai status:

```text
DRAFT
INTERNAL_TEST
PILOT
CALIBRATED
VALIDATED_FOR_INTENDED_USE
```

Jangan menggunakan:

```text
VALIDATED
```

hanya karena software sudah lolos test.

---

# 30. CLAIM GOVERNANCE

Setiap instrument harus memiliki:

```text
allowedClaims[]
restrictedClaims[]
prohibitedClaims[]
```

Contoh Cognitive:

Allowed:

```text
"Cognitive reasoning profile"
```

Restricted until validation:

```text
"IQ"
"intelligence quotient"
"percentile"
```

Example RIASEC:

Allowed:

```text
"vocational interest profile"
"study/career exploration"
```

RIASEC memang digunakan dalam career exploration contexts, termasuk O*NET. citeturn0search3turn0search20

---

# 31. REQUIRED AUDIT OF CURRENT SCORING ENGINE

Before changing scoring code, audit:

```text
lib/assessment/scoring-engine.ts
```

Need to document:

1. input type;
2. answer transformation;
3. reverse scoring;
4. weight handling;
5. indicator aggregation;
6. subdomain aggregation;
7. domain aggregation;
8. overall score;
9. band calculation;
10. coverage calculation;
11. sufficiency calculation;
12. partial result;
13. complete result;
14. scoring version.

**No rewrite before this audit is complete.**

---

# 32. REQUIRED CURRENT-STATE TEST MATRIX

| Test | Expected Purpose |
|---|---|
| ALL_NEUTRAL | baseline semantics |
| ALL_1 | lower-bound behavior |
| ALL_5 | upper-bound behavior |
| MIXED | normal aggregation |
| REVERSE_ITEM | reverse scoring |
| WEIGHTED_ITEM | weight behavior |
| PARTIAL | coverage behavior |
| ONE_DOMAIN | insufficient coverage |
| FULL_COVERAGE | full profile |
| DUPLICATE_RESPONSE | response integrity |

---

# 33. QUESTION BANK RECONCILIATION

Current Question Bank has:

```text
Question
QuestionVersion
Domain
Subdomain
Indicator
Difficulty
Status
MappingStatus
Weight
ReverseScore
Scale
ScoringKey
```

This is enough to support the current foundation.

But v3 requires an explicit mapping:

```text
Instrument
 ↓
Construct
 ↓
Dimension
 ↓
Indicator
 ↓
QuestionVersion
```

Current:

```text
Domain
 ↓
Subdomain
 ↓
Indicator
```

must therefore be reconciled rather than blindly replaced.

---

# 34. EXISTING 200 QUESTIONS

Current verified bank:

```text
Question = 200
QuestionVersion = 200
```

These questions are **not automatically v3-ready**.

Each item must eventually be classified:

```text
KEEP
REMAP
REVIEW
REJECT
REWRITE
```

No mass rewrite before construct mapping is locked.

---

# 35. 1,825 + 200 QUESTION CONTEXT

The larger question corpus is valuable as a source pool.

But:

```text
question count != measurement quality
```

The goal is not:

> "How quickly can we put all 2,025 questions into the database?"

The goal is:

> "Which questions validly measure which constructs?"

---

# 36. PHASE 3.0 DELIVERABLES

This phase must produce:

```text
docs/
├── 02_MEASUREMENT_MODEL_V3.md
├── 03_ASSESSMENT_INSTRUMENT_CATALOG_V3.md
├── 04_CONSTRUCT_CATALOG_V3.md
├── 05_SCORING_GOVERNANCE_V3.md
├── 06_RESULT_SEMANTICS_V3.md
└── 07_CLAIM_GOVERNANCE_V3.md
```

And:

```text
Phase 3.0 Decision Log
Phase 3.0 Regression Matrix
Phase 3.0 Current Scoring Audit
```

---

# 37. PHASE 3.0 IMPLEMENTATION ORDER

## Step 3.0-A

Audit current scoring engine.

## Step 3.0-B

Define construct catalog.

## Step 3.0-C

Define instrument catalog.

## Step 3.0-D

Define dimension/indicator model.

## Step 3.0-E

Define score semantics.

## Step 3.0-F

Define coverage/sufficiency.

## Step 3.0-G

Reconcile current Question Bank.

## Step 3.0-H

Define allowed claims.

## Step 3.0-I

Define regression cases.

## Step 3.0-J

Freeze Measurement Model v1.

---

# 38. OUT OF SCOPE

Do NOT implement yet:

```text
Payment
Pricing
Checkout
Subscription
Major recommendation
Career recommendation
University database
Parent report
School dashboard
AI interpretation
AI chatbot
```

Those belong to later phases.

---

# 39. EXIT CRITERIA

Phase 3.0 PASS only if:

- [ ] Current scoring formula is documented.
- [ ] ALL_NEUTRAL behavior is explained.
- [ ] Score 0–100 semantics are defined.
- [ ] Construct catalog is approved.
- [ ] Instrument catalog is approved.
- [ ] Ability / Trait / Interest / Preference are separated.
- [ ] Dimension model is defined.
- [ ] Reverse scoring is defined.
- [ ] Weighting rule is defined.
- [ ] Coverage rule is defined.
- [ ] Sufficiency rule is defined.
- [ ] Overall score policy is defined.
- [ ] Cross-instrument synthesis principle is defined.
- [ ] Recommendation input hierarchy is defined.
- [ ] Claim governance is defined.
- [ ] Current 200-question bank has a migration/reconciliation strategy.
- [ ] Regression matrix exists.
- [ ] Scoring changes are versioned.
- [ ] Documentation is committed.
- [ ] No unresolved blocking measurement decision remains.

---

# 40. PHASE 3.0 GATE

```text
CURRENT SYSTEM
      ↓
AUDIT
      ↓
MEASUREMENT MODEL
      ↓
CONSTRUCT CATALOG
      ↓
INSTRUMENT CATALOG
      ↓
SCORING GOVERNANCE
      ↓
RESULT SEMANTICS
      ↓
QUESTION RECONCILIATION
      ↓
REGRESSION
      ↓
PASS
      ↓
LOCK
      ↓
PHASE 3.1
```

---

# 41. IMMEDIATE ACTION

The first action is **not coding**.

We need the exact current implementation of:

```text
lib/assessment/scoring-engine.ts
```

Run:

```bash
sed -n '1,430p' lib/assessment/scoring-engine.ts
```

Send the output.

Then Phase 3.0-A will be performed against the actual code.

We will answer exactly:

```text
Why does ALL_NEUTRAL = 75?
What is the current formula?
What is wrong?
What is correct?
What must remain?
What must change?
```

Only after that do we freeze the new measurement model.

---

# 42. NORTH STAR

ReadyScore v3 is not:

> a website containing many tests.

It is:

> **a measurement and decision-support platform that connects a person's abilities, interests, behavioral tendencies, and strengths to educational and career directions.**

The product chain is:

```text
MEASURE
   ↓
UNDERSTAND
   ↓
CONNECT
   ↓
EXPLORE
   ↓
DECIDE
```

Phase 3.0 exists to make the first two steps trustworthy before we build the last three.

---

# STATUS

```text
PHASE 3.0
Measurement Model & Construct Reconciliation

STATUS: ACTIVE

Current sub-phase:
3.0-A — Current Scoring Engine Audit

BLOCKER:
Exact current scoring-engine.ts source

NEXT:
Audit actual scoring implementation
```

# END
