# ReadyScore v3 — SOURCE OF TRUTH
## Master Architecture, Measurement Model, Roadmap & Reconciliation

**Document ID:** `RS-V3-SOURCE-OF-TRUTH`  
**Version:** `1.0.0`  
**Date:** `2026-08-26`  
**Status:** `FROZEN / CANONICAL REFERENCE`  
**Purpose:** Menjadi satu-satunya reference ringkas dan terkontrol untuk menjaga konsistensi arsitektur, measurement model, roadmap, implementation boundary, dan phase transition ReadyScore v3.

---

# 0. PURPOSE

Dokumen ini dibuat untuk menghilangkan ambiguitas antara:

1. Master Architecture
2. Phase Specifications
3. Measurement Model
4. Roadmap
5. Actual Source / Database Contract
6. Frozen Runtime Baseline
7. Current Development Position

Mulai dokumen ini berlaku, setiap diskusi, desain, review, perubahan source, ZIP replacement, dan phase transition harus direkonsiliasi terhadap dokumen ini.

Dokumen ini **bukan pengganti detailed phase specification**. Ia adalah **canonical navigation and reconciliation layer** di atas seluruh specification.

---

# 1. SOURCE OF TRUTH HIERARCHY

Urutan otoritas:

```text
SOURCE OF TRUTH
       │
       ├── 1. This Master Source-of-Truth
       │
       ├── 2. V3 Master Architecture / Reconciliation
       │
       ├── 3. Relevant Phase Specification
       │
       ├── 4. Actual Source / Database Contract
       │
       └── 5. Frozen Runtime Baseline
```

Namun tidak ada layer yang boleh diam-diam menghapus fakta dari layer lain.

Jika terjadi konflik:

```text
CONFLICT
   ↓
STOP
   ↓
IDENTIFY
   ↓
CLASSIFY
   ├── documentation conflict
   ├── implementation gap
   ├── source drift
   └── intentional architectural change
   ↓
DOCUMENT DECISION
   ↓
UPDATE SOURCE OF TRUTH
   ↓
UPDATE AFFECTED SPEC
   ↓
IMPLEMENT
   ↓
REGRESSION
```

**Jangan menyelesaikan konflik dengan asumsi.**

---

# 2. NORTH STAR

ReadyScore v3 bukan sekadar website yang berisi banyak assessment.

ReadyScore v3 adalah:

> **measurement and decision-support platform yang menghubungkan abilities, interests, behavioral tendencies, dan strengths seseorang dengan educational dan career directions.**

Product chain:

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

Measurement harus dibuat trustworthy sebelum recommendation layer dibangun.

---

# 3. FROZEN ENGINEERING BASELINE

## 3.1 Baseline

```text
F.10-C.2-F
RIASEC Actual Runtime E2E
PASS
```

Baseline ini adalah **engineering/runtime baseline**.

Ia bukan bukti psychometric validation.

## 3.2 Yang dibuktikan

```text
RIASEC Question Bank
        ↓
Published QuestionVersion
        ↓
Assessment Start
        ↓
60 selected questions
        ↓
10 questions per RIASEC dimension
        ↓
60 persisted answers
        ↓
Submit
        ↓
RIASEC scoring
        ↓
RIASEC_RESULT_V1
        ↓
six dimension scores
+ topCode
+ scoring version
```

Frozen E2E:

```text
Start route reachability      PASS
Question selection            PASS
RIASEC distribution           PASS
R/I/A/S/E/C                   10 / 10 / 10 / 10 / 10 / 10
60 answer submissions         PASS
Persistence / reload          PASS
Submit + scoring              PASS
Result payload                PASS
RIASEC measurement            PASS
RIASEC_RESULT_V1              PASS
Six dimensions                PASS
Top code                      PASS
Scoring version               PASS
```

## 3.3 Yang TIDAK dibuktikan

F.10-C.2-F tidak membuktikan:

- construct validity
- reliability
- discriminant validity
- convergent validity
- calibration
- norm validity
- intended-use validation
- population validity
- psychometric production readiness

Prinsip:

```text
ENGINEERING PASS
      ≠
PSYCHOMETRIC VALIDATION
```

---

# 4. LOCKED MASTER ARCHITECTURE

Canonical model:

```text
TEST TYPE
    ↓
TEST-SPECIFIC ASSESSMENT SYSTEM
    ├── QUESTION BANK
    ├── SELECTION RULES
    ├── SCORING MODEL
    ├── RESULT MODEL
    └── INTERPRETATION MODEL
    ↓
TEST RESULT
    ↓
CROSS-TEST PROFILE
    ↓
DIRECTION ENGINE
```

## 4.1 Test Type adalah instrument identity

Test Type mengidentifikasi assessment instrument.

Candidate catalog:

```text
COGNITIVE
EQ
AQ
DISC
RIASEC
STRENGTH
LEARNING
```

Catalog bersifat extensible.

## 4.2 Product Tier bukan Test Type

```text
TEST TYPE
   ≠
PRODUCT TIER
```

Product Tier menentukan entitlement/access.

Product Tier tidak boleh mengubah measurement model.

## 4.3 Scoring test-specific

Tidak ada universal scoring formula.

Contoh:

```text
COGNITIVE
Correct / Incorrect
    ↓
Ability score

DISC
Responses
    ↓
D / I / S / C

RIASEC
Responses
    ↓
R / I / A / S / E / C

EQ
Responses
    ↓
EQ dimensions
```

## 4.4 Question Bank logically test-specific

Repository fisik boleh shared, tetapi logical ownership tetap berdasarkan Test Type.

```text
QUESTION REPOSITORY
    ├── Cognitive Bank
    ├── EQ Bank
    ├── AQ Bank
    ├── DISC Bank
    ├── RIASEC Bank
    └── Future Banks
```

## 4.5 Result semantics test-specific

Generic persistence container tidak boleh menghapus semantic ownership masing-masing instrument.

## 4.6 Cross-Test Profile bukan arithmetic average

Dilarang:

```text
IQ + EQ + AQ + DISC + RIASEC
----------------------------
             5
```

Cross-Test Profile adalah synthesis layer.

## 4.7 Direction engines downstream

Study Direction, Major Fit, dan Career Exploration mengonsumsi assessment/profile evidence.

Mereka tidak boleh mendefinisikan ulang measurement.

## 4.8 Versioning mandatory

Minimal versioning harus dapat melacak:

```text
Question Bank Version
QuestionVersion
Taxonomy Version
Assessment Configuration Version
Selection Algorithm Version
Scoring Version
Result Contract Version
```

---

# 5. MEASUREMENT MODEL

## 5.1 Measurement chain

Canonical chain:

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

Jangan menyederhanakan menjadi:

```text
Question → Overall Score
```

## 5.2 Construct

Setiap construct minimal memiliki:

```text
constructId
name
definition
constructType
instrument
dimensions
scoringModel
interpretationModel
intendedUse
prohibitedClaims
validationStatus
```

## 5.3 Construct types

Minimal:

```text
ABILITY
TRAIT
INTEREST
PREFERENCE
PROFILE
READINESS
```

### ABILITY

Contoh:

```text
Numerical Reasoning
Logical Reasoning
Verbal Reasoning
Spatial Reasoning
```

### TRAIT

Contoh:

```text
Emotional Regulation
Resilience Tendency
Personality Tendency
```

### INTEREST

Contoh:

```text
RIASEC
```

### PREFERENCE

Contoh:

```text
Learning Preference
Work Preference
Activity Preference
```

### PROFILE

Profile adalah hasil sintesis beberapa dimension.

Profile bukan construct baru secara otomatis.

---

# 6. CANDIDATE ASSESSMENT CATALOG

Status catalog:

```text
CANDIDATE — NOT AUTOMATICALLY LOCKED
```

| Instrument | Primary Type | Intended Output |
|---|---|---|
| Cognitive Ability | ABILITY | Cognitive Profile |
| EQ | TRAIT / PROFILE | Emotional Profile |
| AQ | TRAIT / PROFILE | Resilience Profile |
| DISC | TRAIT / PROFILE | Behavioral Personality Profile |
| Strength Profile | PREFERENCE / PROFILE | Strength Profile |
| RIASEC | INTEREST | Interest Profile |
| Learning Profile | PREFERENCE | Learning Profile |

Tidak ada instrument yang menjadi official hanya karena populer.

---

# 7. MEASUREMENT CLAIM GOVERNANCE

## 7.1 IQ

ReadyScore tidak boleh menyebut suatu score sebagai IQ hanya karena berada pada skala 0–100.

Terminology sementara:

```text
Cognitive Ability Profile
```

atau:

```text
Cognitive Reasoning Assessment
```

Formal IQ claim adalah decision gate terpisah.

## 7.2 EQ

EQ harus dipisahkan dari personality.

Minimum conceptual separation:

```text
Emotion Awareness
Emotion Regulation
Empathy / Social Awareness
Relationship / Social Response
```

Self-report harus menggunakan terminology profile/tendency sesuai evidence.

## 7.3 AQ

AQ diperlakukan sebagai resilience/adversity-response construct.

Potential dimensions:

```text
Control
Ownership
Reach
Endurance
```

Final dimensions harus mengikuti instrument specification yang dipilih.

## 7.4 DISC

DISC adalah behavioral/personality profile.

Output:

```text
Primary Pattern
Secondary Pattern
Behavioral Tendencies
Potential Strengths
Potential Challenges
```

DISC bukan aptitude dan tidak boleh otomatis menentukan major.

## 7.5 Strength Profile

Terminology:

```text
Strength Profile
```

atau:

```text
8-Dimension Strength Profile
```

Bukan:

```text
8 jenis IQ
```

dan bukan bukti bahwa seseorang pasti berbakat pada bidang tertentu.

## 7.6 RIASEC

RIASEC berada dalam domain:

```text
INTEREST
```

Bukan ability.

Target output:

```text
R
I
A
S
E
C
```

plus:

```text
Top Interest Pattern
```

Contoh:

```text
I-A-R
```

---

# 8. SCORE SEMANTICS

ReadyScore harus membedakan:

```text
RAW SCORE
    ↓
SCALE SCORE
    ↓
PROFILE SCORE
    ↓
FIT SCORE
    ↓
READINESS SCORE
```

Definitions:

- **Raw Score** — score langsung dari response.
- **Scale Score** — score setelah transformation.
- **Profile Score** — score per construct/dimension.
- **Fit Score** — degree of correspondence terhadap defined study/career profile.
- **Readiness Score** — readiness terhadap defined context.

Semua tidak interchangeable.

---

# 9. 0–100 RULE

0–100 adalah **presentation scale**, bukan otomatis measurement scale.

```text
Score = 75
```

tidak otomatis berarti:

```text
75% ability
75% intelligence
75% probability
75th percentile
```

Interpretation harus mempunyai definition.

---

# 10. SCORING GOVERNANCE

## 10.1 Reverse scoring

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

Reverse scoring dilakukan sebelum dimension aggregation.

## 10.2 Weighting

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

Weight tidak boleh digunakan untuk mempercantik result.

## 10.3 Aggregation

Canonical:

```text
Item
 ↓
Indicator
 ↓
Dimension
 ↓
Instrument
```

Dimension score dapat menggunakan weighted mean atas eligible item scores jika memang didefinisikan model.

Instrument profile adalah vector dimension scores.

Jangan melakukan average semua dimension kecuali model memang mengharuskannya.

## 10.4 Overall score

Default ReadyScore v3:

```text
PROFILE
```

bukan universal overall score.

Jika overallScore digunakan, wajib memiliki:

```text
overallScoreDefinition
overallScorePurpose
overallScoreFormula
overallScoreVersion
```

---

# 11. COVERAGE, SUFFICIENCY & CONFIDENCE

## 11.1 Coverage

Coverage adalah first-class measurement metadata.

Minimal:

```text
answeredItems
totalItems
dimensionCoverage
constructCoverage
requiredCoverage
```

## 11.2 Sufficiency

```text
Coverage
   ≠
Sufficiency
```

10/10 answered tidak otomatis berarti measurement sufficient.

Sufficiency harus mengikuti instrument-specific rule.

## 11.3 Confidence

Terminology yang diperbolehkan:

```text
HIGH
MODERATE
LIMITED
```

Confidence bukan statistical confidence interval kecuali memang tersedia.

---

# 12. CROSS-TEST SYNTHESIS

Canonical synthesis:

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

Synthesis adalah recommendation layer, bukan arithmetic average.

## Recommendation input hierarchy

### Primary signals

```text
Interest
Cognitive Ability
Relevant Strength Profile
```

### Supporting signals

```text
Personality
Learning Profile
EQ
AQ
```

### Contextual signals

```text
User goals
Academic background
Constraints
Preferences
```

Tidak ada satu assessment yang boleh sendirian menentukan major.

---

# 13. RESULT LANGUAGE GOVERNANCE

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

Fit score bukan:

```text
probability of graduation
probability of success
guaranteed suitability
```

---

# 14. RIASEC FROZEN IMPLEMENTATION INVARIANTS

## Question Bank

Production set:

```text
60 questions

R = 10
I = 10
A = 10
S = 10
E = 10
C = 10
```

Candidate bank:

```text
84 total
14 per dimension
60 target
24 reserve
```

Lifecycle:

```text
DRAFT
  ↓
MAPPED
  ↓
APPROVED
  ↓
PUBLISHED
```

Jangan mengubah production set sebagai bagian dari unrelated platform work.

Setiap perubahan harus membuat Question Bank version baru dan melewati lifecycle gate.

## Selection

Selection harus:

- eligibility-aware
- deterministic from attempt seed
- versioned
- snapshot-based
- test-specific

Snapshot minimal menyimpan:

```text
attemptId
assessmentType
assessmentConfigurationVersion
questionBankVersion
taxonomyVersion
scoringVersion
selectionAlgorithmVersion
attemptSeed
selectedQuestionIds
selectedQuestionVersionIds
selectedQuestionSequence
selectionMetadata
```

## Question identity

Jangan pernah menggabungkan:

```text
Question.id
Question.code
QuestionVersion.id
```

menjadi satu identifier.

Canonical:

```text
Question
    =
stable logical identity

QuestionVersion
    =
immutable assessment-facing version
```

---

# 15. ACTUAL SOURCE / DATABASE INVARIANTS

Frozen/current runtime membuktikan pattern berikut.

## AssessmentAttempt

Version snapshot mencakup:

```text
assessmentConfigurationId
assessmentConfigurationVersion
questionBankVersion
taxonomyVersion
scoringVersion
selectionAlgorithmVersion
attemptSeed
selectionSnapshot
```

## Persistence boundary

Response membedakan:

```text
questionRecordId
questionVersionId
```

Canonical PostgreSQL Question identity harus dipertahankan di persistence boundary.

## Result persistence

Generic:

```text
AssessmentResult
```

dapat menjadi compatibility container, tetapi tidak boleh menjadi semantic owner seluruh Test Type.

RIASEC semantics berada di:

```text
result.riasec = {
    contractVersion: "RIASEC_RESULT_V1",
    measurement
}
```

Jangan flatten test-specific semantics menjadi generic fields tanpa keputusan arsitektural eksplisit.

---

# 16. AUTHORITATIVE DEVELOPMENT ROADMAP

Urutan canonical:

```text
PHASE 3.0
Assessment Architecture & Measurement Model
        ↓
PHASE 3.1
Commercial Product & Entitlement Architecture
        ↓
PHASE 3.2
Test Catalog & Taxonomy V2
        ↓
PHASE 3.3
Test-Specific Question Bank Architecture
        ↓
PHASE 3.4
Scoring Engine Architecture V2
        ↓
PHASE 3.5
Test Result & Interpretation Engine
        ↓
PHASE 3.6
Cross-Test Profile Engine
        ↓
PHASE 3.7
Study Direction Engine
        ↓
PHASE 3.8
Major Fit Engine
        ↓
PHASE 3.9
Career Exploration Engine
        ↓
PHASE 3.10
Commercial Dashboard & Entitlement UX
        ↓
PHASE 3.11
Reports & Parent Experience
        ↓
PHASE 3.12
B2C Conversion & Add-on Products
        ↓
PHASE 3.13
B2B School / Institution
        ↓
PHASE 3.14
Measurement Calibration
        ↓
PHASE 3.15
Release Hardening
```

**Sequence ini supersedes conflicting historical Phase 3 numbering.**

Historical `2.16.x` references harus dianggap historical context, bukan development cursor.

---


# 16A. PHASE 3.1 — LOCKED COMMERCIAL ENTITLEMENT MATRIX

Phase 3.1 is the current development cursor.

The commercial layer is explicitly separated from measurement:

```text
PRODUCT
PRODUCT TIER
ENTITLEMENT
       ≠
TEST TYPE
ASSESSMENT CONFIGURATION
```

Planning catalog:

| Tier | Planning Price | Purpose |
|---|---:|---|
| FREE | Rp0 | Experience the product and establish initial value |
| BASIC | Rp99.000 | Core assessment experience |
| MEDIUM | Rp199.000 | Multi-assessment profile |
| ADVANCE | Rp299.000 | Full assessment + direction intelligence |

Prices remain planning hypotheses.

Locked entitlement matrix:

```text
FREE
  TEST_ACCESS  → ASSESSMENT_CONFIGURATION: free-v1
  RESULT_ACCESS → ASSESSMENT_CONFIGURATION: free-v1

BASIC
  TEST_ACCESS / RESULT_ACCESS → COGNITIVE
  TEST_ACCESS / RESULT_ACCESS → STRENGTH

MEDIUM
  TEST_ACCESS / RESULT_ACCESS → COGNITIVE
  TEST_ACCESS / RESULT_ACCESS → STRENGTH
  TEST_ACCESS / RESULT_ACCESS → EQ
  TEST_ACCESS / RESULT_ACCESS → AQ
  TEST_ACCESS / RESULT_ACCESS → DISC
  TEST_ACCESS / RESULT_ACCESS → RIASEC
  PROFILE_ACCESS → CROSS_TEST_PROFILE_V1

ADVANCE
  TEST_ACCESS / RESULT_ACCESS → COGNITIVE
  TEST_ACCESS / RESULT_ACCESS → STRENGTH
  TEST_ACCESS / RESULT_ACCESS → EQ
  TEST_ACCESS / RESULT_ACCESS → AQ
  TEST_ACCESS / RESULT_ACCESS → DISC
  TEST_ACCESS / RESULT_ACCESS → RIASEC
  TEST_ACCESS / RESULT_ACCESS → LEARNING
  PROFILE_ACCESS → CROSS_TEST_PROFILE_V1
  DIRECTION_ACCESS → STUDY_DIRECTION_V1
  MAJOR_FIT_ACCESS → MAJOR_FIT_V1
  CAREER_ACCESS → CAREER_EXPLORATION_V1
  REPORT_ACCESS → ADVANCED_REPORT_V1
```

This is the Phase 3.1 implementation decision derived from the roadmap's commercial examples. It is now the controlled implementation baseline.

Payment, checkout, subscription, billing, purchase webhook, and commercial dashboard remain deferred to later phases.

# 17. PHASE BOUNDARIES

## Phase 3.0 — Assessment Architecture & Measurement Model

Tujuan:

- measurement model
- construct catalog
- instrument catalog
- dimension/indicator model
- scoring governance
- result semantics
- coverage/sufficiency
- claim governance
- question reconciliation
- regression

Phase 3.0 bukan feature-building phase.

## Phase 3.1 — Commercial Product & Entitlement Architecture

Memisahkan:

```text
Product
Product Tier
Entitlement
Test Type
Assessment Configuration
```

Product Tier mengontrol access, bukan measurement.

## Phase 3.2 — Test Catalog & Taxonomy V2

Membangun authoritative runtime catalog untuk multiple instruments dan taxonomy.

## Phase 3.3 — Test-Specific Question Bank Architecture

Menggeneralisasi logical question bank architecture dengan ownership tetap per Test Type.

## Phase 3.4 — Scoring Engine Architecture V2

Membangun scoring abstraction yang pluggable per Test Type / Scoring Model.

## Phase 3.5 — Test Result & Interpretation Engine

Setiap Test Type memiliki result semantics dan interpretation.

```text
score exists
    ≠
interpretation engine complete
```

## Phase 3.6 — Cross-Test Profile Engine

```text
Test Results
    ↓
Cross-Test Profile
```

Bukan raw average.

## Phase 3.7 — Study Direction Engine

```text
TEST RESULTS
    ↓
CROSS-TEST PROFILE
    ↓
EVIDENCE CLASSIFICATION
    ↓
STUDY AREA MAPPING
    ↓
STUDY DIRECTION
```

Study Direction tidak menentukan major secara langsung.

## Phase 3.8 — Major Fit Engine

```text
Study Direction
+
relevant evidence
+
major profile
    ↓
Major Fit
```

Fit adalah correspondence, bukan guarantee.

## Phase 3.9 — Career Exploration Engine

```text
Profile
+
Study Direction
+
Major Fit
+
career profile
    ↓
Career Exploration
```

Output harus exploration-oriented, bukan deterministic career assignment.

## Phase 3.10 — Commercial Dashboard & Entitlement UX

Commercial visibility dan entitlement experience.

## Phase 3.11 — Reports & Parent Experience

Reporting dan parent-facing experience.

## Phase 3.12 — B2C Conversion & Add-on Products

Conversion architecture dan add-on products.

## Phase 3.13 — B2B School / Institution

Institutional product layer.

## Phase 3.14 — Measurement Calibration

Di sini platform bergerak dari engineering correctness menuju calibrated measurement.

## Phase 3.15 — Release Hardening

Final hardening dan release readiness.

---

# 18. STUDY → MAJOR → CAREER BOUNDARY

Ini adalah salah satu boundary paling penting.

```text
3.5
RESULT + INTERPRETATION
"What did the instrument measure?"
        ↓
3.6
CROSS-TEST PROFILE
"What does the combined evidence say about me?"
        ↓
3.7
STUDY DIRECTION
"What study areas are worth exploring?"
        ↓
3.8
MAJOR FIT
"Which majors correspond to those areas?"
        ↓
3.9
CAREER EXPLORATION
"What career families can I explore from there?"
```

Jangan membalik urutan tersebut.

Jangan membangun:

```text
RIASEC
  ↓
Major
```

atau:

```text
One Test
  ↓
Career
```

secara deterministic.

---

# 19. PHASE 3.0 MEASUREMENT GATE

Phase 3.0 harus menghasilkan:

```text
Current System Audit
        ↓
Measurement Model
        ↓
Construct Catalog
        ↓
Instrument Catalog
        ↓
Scoring Governance
        ↓
Result Semantics
        ↓
Question Reconciliation
        ↓
Regression
        ↓
PASS
        ↓
LOCK
        ↓
Phase 3.1
```

Exit criteria utama:

- scoring formula documented
- ALL_NEUTRAL behavior explained
- 0–100 semantics defined
- construct catalog approved
- instrument catalog approved
- Ability / Trait / Interest / Preference separated
- dimension model defined
- reverse scoring defined
- weighting rule defined
- coverage defined
- sufficiency defined
- overall score policy defined
- cross-instrument synthesis defined
- recommendation input hierarchy defined
- claim governance defined
- question bank migration strategy defined
- regression matrix exists
- scoring changes versioned
- documentation committed
- no unresolved blocking measurement decision

---

# 20. REGRESSION INVARIANTS

Minimum test matrix:

| Test | Purpose |
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

Untuk RIASEC, unrelated changes wajib mempertahankan:

```text
start
60 questions
10/10/10/10/10/10
60 answers
persistence
submit
scoring
RIASEC_RESULT_V1
six dimensions
topCode
```

---

# 21. ZIP / SOURCE REPLACEMENT GATE

Setiap full-application ZIP baru harus melewati:

## Gate 1 — Architecture

```text
Does the ZIP preserve V3 architectural boundaries?
```

## Gate 2 — Specification

```text
Does the implementation follow the relevant Phase specification?
```

## Gate 3 — Actual Source

Review:

```text
Prisma schema
runtime-service
repositories
question engine
scoring
result adapter
result contract
API routes
configuration
migrations
```

Jangan mengasumsikan path atau field.

## Gate 4 — Frozen RIASEC Runtime

Harus PASS.

## Gate 5 — Database Contract

Verify:

```text
Prisma schema
migration state
PostgreSQL enum/model constraints
```

## Gate 6 — Versioning

Verify:

```text
Question Bank Version
QuestionVersion
Assessment Configuration Version
Scoring Version
Selection Algorithm Version
Taxonomy Version
Result Contract Version
```

## Gate 7 — Mutation Safety

Tidak boleh ada script yang diam-diam:

```text
approve
publish
rewrite question versions
change production candidates
```

tanpa relevant lifecycle gate.

---

# 22. FUTURE REVIEW REPORT FORMAT

Setiap implementation/replacement review wajib menghasilkan:

```text
=== READY SCORE V3 RECONCILIATION ===

Baseline:
    F.10-C.2-F PASS

Architecture:
    PASS / GAP / CONFLICT

Specification:
    PASS / GAP / CONFLICT

Actual Source:
    PASS / GAP / CONFLICT

Database Contract:
    PASS / GAP / CONFLICT

RIASEC Frozen Runtime:
    PASS / REGRESSION

New Phase:
    <phase>

Files Changed:
    <list>

New Contracts:
    <list>

Backward Compatibility:
    PASS / FAIL

Required Migration:
    YES / NO

Required Human Review:
    YES / NO

Next Gate:
    <exact command / phase>
```

---

# 23. CHANGE CONTROL

## Architecture change

```text
ARCHITECTURE CHANGE
        ↓
UPDATE SOURCE OF TRUTH
        ↓
UPDATE AFFECTED SPEC
        ↓
IMPLEMENT
        ↓
RUN FROZEN BASELINE REGRESSION
        ↓
NEW BASELINE
```

## Implementation change without architecture change

```text
IMPLEMENTATION CHANGE
        ↓
VERIFY SPEC CONFORMANCE
        ↓
VERIFY FROZEN RIASEC REGRESSION
        ↓
UPDATE ACTUAL-SOURCE STATUS
```

## Conflict

```text
CONFLICT
   ↓
STOP
   ↓
IDENTIFY SOURCE OF TRUTH
   ↓
DOCUMENT DECISION
   ↓
PATCH
   ↓
TEST
```

---

# 24. DOCUMENT INVENTORY

Governing documentation includes:

## Architecture / Roadmap

```text
ReadyScore_v3_Development_Master_Roadmap_v3.0.md
ReadyScore_v3_Development_Master_Roadmap_v3.1.md
ReadyScore_v3_Phase_3.0_Measurement_Model.md
ReadyScore_v3_Phase_3.0-B_Test_Type_Assessment_Model.md
ReadyScore_v3_Phase_3.0-C_Test_Specific_Assessment_Contract.md
```

## RIASEC Measurement

```text
ReadyScore_v3_Phase_3.0-D.1-A_RIASEC_Construct_Dimension_Validation.md
ReadyScore_v3_Phase_3.0-D.1-B_RIASEC_Item_Blueprint.md
ReadyScore_v3_Phase_3.0-D.1-C_RIASEC_Scoring_Specification.md
ReadyScore_v3_Phase_3.0-D.1-D_RIASEC_Result_Interpretation_Specification.md
ReadyScore_v3_Phase_3.0-D.1-E_RIASEC_Validation_Production_Readiness.md
```

## RIASEC Implementation

```text
ReadyScore_v3_Phase_3.0-D.1-F.1_Test_Type_Foundation.md
ReadyScore_v3_Phase_3.0-D.1-F.2_Assessment_Configuration_Refactor.md
ReadyScore_v3_Phase_3.0-D.1-F.3_RIASEC_Question_Bank_Integration.md
F.8 Persistence Boundary Audit
F.9 Runtime Wiring
F.10 Runtime E2E
```

---

# 25. CURRENT DEVELOPMENT POSITION

```text
F.10-C.2-F
RIASEC Actual Runtime E2E
PASS
        ↓
V3 MASTER RECONCILIATION
        ↓
PHASE 3.1
```

Current active sequence:

```text
3.1
  ↓
3.2
  ↓
3.3
  ↓
3.4
  ↓
3.5
  ↓
3.6
  ↓
3.7
  ↓
3.8
  ↓
3.9
...
```

Do not reopen F.10.x unless a new source-backed defect is found.

---

# 26. NON-NEGOTIABLE RULES FOR FUTURE WORK

## Rule 1

**Do not ask first:**

```text
"What code should we add?"
```

Ask:

```text
"What does the V3 architecture require?"
"What does the relevant specification require?"
"What does the actual source currently do?"
"What must remain frozen?"
```

## Rule 2

Do not infer architecture from current code alone.

## Rule 3

Do not infer measurement validity from successful runtime execution.

## Rule 4

Do not flatten test-specific semantics into universal scoring/result structures.

## Rule 5

Do not use raw arithmetic averages across heterogeneous assessments.

## Rule 6

Do not let one assessment automatically determine a major or career.

## Rule 7

Do not use 0–100 as a semantic shortcut.

## Rule 8

Do not make deterministic claims where evidence only supports exploration.

## Rule 9

Every material measurement/configuration/result change must be versioned.

## Rule 10

Every new ZIP must be reconciled before becoming the new baseline.

## Rule 11

If documentation conflicts, stop and reconcile. Do not guess.

## Rule 12

This document must be updated when the architecture intentionally changes.

---

# 27. CANONICAL DECISION SUMMARY

```text
READY SCORE V3
      │
      ▼
MEASUREMENT FOUNDATION
      │
      ▼
TEST-SPECIFIC ASSESSMENT SYSTEM
      │
      ├── Question Bank
      ├── Selection
      ├── Scoring
      ├── Result
      └── Interpretation
      │
      ▼
CROSS-TEST PROFILE
      │
      ▼
STUDY DIRECTION
      │
      ▼
MAJOR FIT
      │
      ▼
CAREER EXPLORATION
      │
      ▼
COMMERCIAL / REPORT / B2B LAYERS
      │
      ▼
MEASUREMENT CALIBRATION
      │
      ▼
RELEASE HARDENING
```

Commercial architecture remains separate from measurement identity:

```text
PRODUCT
PRODUCT TIER
ENTITLEMENT
       ≠
TEST TYPE
ASSESSMENT CONFIGURATION
```

Measurement identity remains separate from recommendation:

```text
MEASUREMENT
      ↓
PROFILE
      ↓
DIRECTION
      ↓
FIT
      ↓
EXPLORATION
```

---

# 28. FINAL SOURCE-OF-TRUTH STATEMENT

**Mulai 2026-08-26, dokumen ini adalah canonical reconciliation reference untuk ReadyScore v3.**

Jika percakapan, kode, file, atau keputusan lama bertentangan dengan dokumen ini:

1. jangan langsung mengikuti yang lama;
2. identifikasi konflik;
3. tentukan apakah perubahan memang intentional;
4. update source of truth jika arsitektur berubah;
5. update specification yang terdampak;
6. baru implementasikan;
7. jalankan regression terhadap frozen baseline.

**Tidak ada perubahan arsitektur yang dianggap terjadi hanya karena pernah disebut dalam percakapan.**

Perubahan arsitektur menjadi resmi hanya setelah masuk ke controlled documentation.

---

# STATUS

```text
DOCUMENT: RS-V3-SOURCE-OF-TRUTH
VERSION: 1.0.0
STATUS: FROZEN / CANONICAL REFERENCE

FROZEN ENGINEERING BASELINE:
    F.10-C.2-F = PASS

CURRENT DEVELOPMENT CURSOR:
    PHASE 3.1

NEXT:
    Commercial Product & Entitlement Architecture
```

# END
