# ReadyScore v3 --- Development Master Roadmap & Product Architecture

**Document:** ReadyScore v3 Development Master Roadmap\
**Version:** 3.0\
**Status:** MASTER REFERENCE --- READ BEFORE DEVELOPMENT\
**Date:** 2026-08-22\
**Current development position:** Phase 2.16.1 --- Assessment Scoring &
Coverage Reconciliation\
**Next phase:** Phase 2.16.2 --- Measurement Model & Construct
Reconciliation

------------------------------------------------------------------------

# 1. PURPOSE

Dokumen ini menjadi **single development reference** untuk arah
ReadyScore v3 setelah Phase 2.16.1.

Tujuannya bukan sekadar menentukan "phase berikutnya", tetapi mengunci
perubahan arah produk:

> ReadyScore tidak lagi diposisikan hanya sebagai assessment "readiness
> score".

ReadyScore v3 diarahkan menjadi:

> **Personal Assessment & Education Direction Platform**

dengan kemampuan menggabungkan beberapa assessment/instrument untuk
membantu pengguna memahami:

``` text
WHO AM I?
    ↓
WHAT AM I GOOD AT?
    ↓
HOW DO I THINK / FEEL / RESPOND?
    ↓
WHAT DO I ENJOY?
    ↓
WHAT ARE MY POTENTIAL STRENGTHS?
    ↓
WHAT STUDY AREAS MAY FIT ME?
    ↓
WHAT SHOULD I EXPLORE NEXT?
```

Fokus komersial awal:

-   siswa SMA;
-   mahasiswa;
-   orang tua;
-   pengguna umum yang ingin memahami profil diri;
-   kemudian sekolah/lembaga pendidikan sebagai B2B.

------------------------------------------------------------------------

# 2. CURRENT STATE --- BASELINE

## 2.1 Engineering state

Pada baseline terakhir:

-   Question Bank: **200 questions**
-   QuestionVersion: **200**
-   Question Bank menggunakan satu source of truth.
-   Admin Question Bank sudah tersedia.
-   Mapping domain → subdomain → indicator sudah tersedia.
-   Assessment runtime sudah berjalan.
-   Free assessment: 20 questions.
-   Result page sudah menampilkan score dan domain profile.
-   Database PostgreSQL sudah berjalan.
-   Prisma migration state telah diverifikasi.
-   `pnpm typecheck` PASS.
-   `pnpm build` PASS setelah reconciliation pada scoring/runtime.
-   Assessment submit sudah berhasil sampai result page setelah beberapa
    runtime/type issues diperbaiki.

Question Bank architecture sebelumnya menetapkan bahwa Free dan Premium
menggunakan satu Question Bank utama, bukan bank terpisah. Selection
Engine juga dirancang untuk menggunakan eligibility filter, taxonomy,
deterministic selection, snapshot, dan versioning.
fileciteturn57file0 fileciteturn57file9

## 2.2 Current production-like test observation

User melakukan assessment dengan jawaban **Netral** dan result yang
muncul adalah:

``` text
ReadyScore = 75
```

Result juga menunjukkan:

``` text
Motivasi = 75
1 / 8 domain terukur
20 soal
20 terjawab
2 / 2 subdomain
```

Observasi ini sangat penting.

**Jangan langsung menganggap angka 75 benar secara psikometrik hanya
karena secara teknis sistem berhasil menghitungnya.**

Phase 2.16.1 membuktikan bahwa scoring pipeline dapat menghasilkan
result.

Phase berikutnya harus memastikan bahwa:

> **result yang dihasilkan memang memiliki makna measurement yang benar
> untuk tujuan produk.**

------------------------------------------------------------------------


# 3. V3 PHASE BOUNDARY

# 3.1 V3 ASSESSMENT ARCHITECTURE — LOCKED

ReadyScore v3 adopts a **multi-instrument assessment architecture**.

The platform does NOT assume that all tests share one universal scoring formula.

The fundamental model is:

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

This is a core architectural decision for ReadyScore v3.

---

## 3.1.1 Test Type

A **Test Type** identifies an assessment instrument/product.

Initial candidate test types:

```text
COGNITIVE
EQ
AQ
DISC
RIASEC
STRENGTH
LEARNING
```

The catalog is extensible.

A new test type must not require rewriting the entire assessment runtime.

---

## 3.1.2 Test-Specific Scoring

Each Test Type may have its own scoring model.

Examples:

```text
COGNITIVE
Correct / Incorrect
        ↓
Raw Ability Score
        ↓
Dimension Scores

DISC
Responses
        ↓
D / I / S / C
        ↓
Behavioral Profile

RIASEC
Responses
        ↓
R / I / A / S / E / C
        ↓
Interest Profile

EQ
Responses
        ↓
EQ Dimensions
        ↓
Emotional Profile
```

Therefore:

> `SCORING_V1` is not the universal ReadyScore scoring model. It is a scoring implementation that may serve a particular assessment model.

Scoring engines should be **pluggable by Test Type / Scoring Model**.

---

## 3.1.3 Test-Specific Question Bank

ReadyScore uses one physical question repository where practical, but multiple logical question banks.

Conceptually:

```text
QUESTION REPOSITORY
        │
        ├── Cognitive Bank
        ├── EQ Bank
        ├── AQ Bank
        ├── DISC Bank
        ├── RIASEC Bank
        ├── Strength Bank
        └── Learning Bank
```

This does NOT require a separate database for every test.

The logical separation must be explicit through Test Type / Instrument / Question Version mapping.

A question must belong to a defined measurement context.

Question count alone is not a quality metric.

---

## 3.1.4 Test-Specific Result

Each Test Type owns its result semantics.

Examples:

```text
COGNITIVE
├── Logical
├── Numerical
├── Verbal
└── Spatial

DISC
├── D
├── I
├── S
└── C

RIASEC
├── R
├── I
├── A
├── S
├── E
└── C
```

A generic:

```text
overallScore = 75
```

must NOT be assumed to be the primary result for every instrument.

Result models may contain:

```text
profile vectors
dimension scores
bands
rank/order
dominant dimensions
coverage
quality
interpretation metadata
```

---

## 3.1.5 Cross-Test Profile

Test Results are not the same as the user's final Personal Profile.

The architecture is:

```text
Cognitive Result
EQ Result
AQ Result
DISC Result
RIASEC Result
Strength Result
Learning Result
        │
        ▼
CROSS-TEST PROFILE
```

The Cross-Test Profile is a synthesis layer.

It must NOT simply average unrelated assessment scores.

Example:

```text
COGNITIVE
    +
RIASEC
    +
STRENGTH
    +
DISC
    +
EQ
    +
AQ
    ↓
PERSONAL PROFILE
```

---

## 3.1.6 Direction Engine

The Cross-Test Profile may later feed:

```text
STUDY DIRECTION
        ↓
MAJOR FIT
        ↓
CAREER EXPLORATION
```

This is a recommendation / decision-support layer.

It is NOT part of the raw scoring engine.

No assessment result should automatically determine a major or career.

---

# 3.2 COMMERCIAL ENTITLEMENT ARCHITECTURE — LOCKED

ReadyScore v3 has four commercial product tiers.

Initial commercial concept:

| Tier | Price | Purpose |
|---|---:|---|
| FREE TRIAL | Rp0 | Experience the product and establish initial value |
| BASIC | Rp99.000 | Core assessment experience |
| MEDIUM | Rp199.000 | Multi-assessment profile |
| ADVANCE | Rp299.000 | Full assessment + direction intelligence |

Prices are **commercial planning values**, not yet final pricing commitments.

---

## 3.2.1 Product Tier ≠ Test Type

This distinction is mandatory.

```text
PRODUCT TIER
    ↓
ENTITLEMENTS
    ↓
AVAILABLE TESTS / REPORTS / INSIGHTS
```

Example:

```text
Basic
 ├── Cognitive
 └── Strength

Medium
 ├── Cognitive
 ├── Strength
 ├── EQ
 ├── AQ
 ├── DISC
 └── RIASEC

Advance
 ├── All available tests
 ├── Cross-Test Profile
 ├── Study Direction
 ├── Major Fit
 ├── Career Exploration
 └── Advanced Report
```

The exact tier-to-test mapping remains a product decision and must be locked before commercial implementation.

---

## 3.2.2 Entitlement

The platform should use an explicit entitlement model rather than hard-coded plan checks.

Conceptual model:

```text
USER
 ↓
SUBSCRIPTION / PURCHASE
 ↓
PRODUCT TIER
 ↓
ENTITLEMENTS
 ↓
ACCESS
```

Potential entitlement types:

```text
TEST_ACCESS
RESULT_ACCESS
PROFILE_ACCESS
REPORT_ACCESS
DIRECTION_ACCESS
MAJOR_FIT_ACCESS
CAREER_ACCESS
```

This allows future expansion without redesigning the subscription model.

---

## 3.2.3 Dashboard Composition

The user dashboard is entitlement-aware.

It should not merely show one static dashboard with arbitrary locked features.

Conceptually:

```text
USER
 ↓
ENTITLEMENTS
 ↓
DASHBOARD COMPOSITION
```

The dashboard therefore represents the product value the user owns.

Example:

```text
BASIC DASHBOARD
├── Available Tests
├── Completed Results
├── Profile Progress
└── Upgrade Opportunities

MEDIUM DASHBOARD
├── Multiple Test Results
├── Cross-Test Profile
├── Profile Progress
└── Direction Preview

ADVANCE DASHBOARD
├── Complete Personal Profile
├── Study Direction
├── Major Fit
├── Career Exploration
├── Advanced Reports
└── Ongoing Profile History
```

Locked content must be handled through entitlement-aware UX.

---

# 3.3 MEASUREMENT / COMMERCIAL SEPARATION

ReadyScore v3 explicitly separates:

```text
MEASUREMENT LAYER
    ├── Test Type
    ├── Question Bank
    ├── Selection
    ├── Scoring
    ├── Result
    └── Interpretation

COMMERCIAL LAYER
    ├── Product
    ├── Product Tier
    ├── Subscription / Purchase
    └── Entitlement

EXPERIENCE LAYER
    ├── Dashboard
    ├── Assessment UX
    ├── Result UX
    └── Reports

SYNTHESIS LAYER
    ├── Cross-Test Profile
    ├── Study Direction
    ├── Major Fit
    └── Career Exploration
```

No layer should silently absorb another layer's responsibility.

---

# 3.4 UPDATED V3 DEVELOPMENT SEQUENCE

The roadmap is adjusted to reflect the locked architecture.

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

This sequence supersedes any earlier Phase 3 numbering where the responsibilities conflict with the architecture above.

---

# 3.5 PHASE 3.0 IMMEDIATE WORK

Before implementing new scoring code, Phase 3.0 must answer:

```text
1. What Test Types exist?
2. What does each Test Type measure?
3. What Question Bank belongs to each Test Type?
4. What Scoring Model does each Test Type use?
5. What Result Model does each Test Type produce?
6. What Interpretation Model does each Test Type use?
7. Which Test Types can participate in Cross-Test Profile?
8. Which results are available under each Product Tier?
9. What does the Dashboard show for each entitlement state?
```

The current `SCORING_V1` implementation is retained as evidence of the existing system and must be audited before replacement.

---

# 3.6 ARCHITECTURAL RULES — LOCKED

### Rule 1
There is no assumption of one universal scoring formula.

### Rule 2
Every Test Type must declare its scoring model.

### Rule 3
Every Test Type must have a logical Question Bank.

### Rule 4
Every Test Type must have defined Result semantics.

### Rule 5
Cross-Test Profile is a synthesis layer, not a raw score average.

### Rule 6
Product Tier controls entitlement; it does not redefine measurement.

### Rule 7
Dashboard content is derived from entitlement.

### Rule 8
Study / Major / Career recommendations are downstream of assessment results.

### Rule 9
Question volume must never substitute for measurement quality.

### Rule 10
Scoring versions must be immutable and traceable.

---

# 3.7 V3 NORTH STAR

```text
                    USER
                      │
                      ▼
              PRODUCT / TIER
                      │
                      ▼
                ENTITLEMENT
                      │
                      ▼
                 DASHBOARD
                      │
          ┌───────────┼───────────┐
          ▼           ▼           ▼
       TEST A       TEST B      TEST C
          │           │           │
       BANK A       BANK B      BANK C
          │           │           │
       SCORE A      SCORE B     SCORE C
          │           │           │
       RESULT A     RESULT B    RESULT C
          └───────────┼───────────┘
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
```

This is the target conceptual architecture for ReadyScore v3.



ReadyScore v3 starts at **Phase 3.0**.

## ReadyScore v1
Early product / initial implementation.

## ReadyScore v2
Assessment Platform Foundation:

- Question Bank
- Assessment Runtime
- PostgreSQL / Prisma
- Selection
- Scoring foundation
- Dashboard
- Account
- Result

## ReadyScore v3
Personal Intelligence, Education & Career Direction:

- Measurement Model
- Assessment Instruments
- Taxonomy V2
- Scoring V2
- Profile
- Interpretation
- Study Direction
- Major Fit
- Career Exploration
- Commercialization
- Parent Experience
- B2B Education

This boundary is intentional. It prevents the v3 roadmap from being mixed with historical Phase 2 implementation work.

# 4. IMPORTANT PRODUCT DECISION

ReadyScore v3 **tidak boleh dikembangkan dengan pola berikut:**

``` text
Tambah banyak jenis tes
        ↓
Tambah banyak soal
        ↓
Tambah banyak score
        ↓
Tambah halaman result
```

Itu akan menghasilkan kumpulan psikotes, bukan produk yang kuat.

Architecture yang benar:

``` text
ASSESSMENT INSTRUMENTS
        ↓
CONSTRUCTS
        ↓
QUESTION / ITEM MODEL
        ↓
SCORING MODEL
        ↓
PROFILE
        ↓
INTERPRETATION
        ↓
EDUCATION / CAREER DIRECTION
        ↓
COMMERCIAL PRODUCT
```

------------------------------------------------------------------------

# 4. COMMERCIAL VISION

Commercial architecture yang menjadi target:

  Product        Price Core Promise
  ----------- -------- ----------------------------------------
  Free             Rp0 Know Yourself
  Essential      Rp99K Understand Yourself
  Complete      Rp199K Understand Your Potential
  Future        Rp299K Discover Your Study & Career Direction

Harga ini adalah **commercial hypothesis**, bukan hard-coded engineering
requirement.

Commercial configuration harus dapat diubah tanpa mengubah scoring
engine.

------------------------------------------------------------------------

# 5. PRODUCT LADDER

## 5.1 FREE --- Know Yourself

Tujuan:

-   acquisition;
-   product sampling;
-   lead generation;
-   membuktikan value;
-   mengarahkan ke paid assessment.

Free bukan diagnostic penuh.

Output:

``` text
Personal Snapshot
+
Basic Strength
+
Basic Domain Insight
+
Coverage explanation
```

Free tidak boleh memberikan kesan bahwa 20 pertanyaan sudah cukup untuk
menyimpulkan seluruh potensi seseorang.

------------------------------------------------------------------------

## 5.2 ESSENTIAL --- Understand Yourself --- Rp99K

Target:

> pengguna yang ingin mengenal profil dirinya.

Candidate instruments:

-   Cognitive Snapshot / reasoning-lite;
-   Personality;
-   Emotional profile;
-   Strength profile.

Output:

``` text
Personal Profile
+
Strength Profile
+
Basic Personality Profile
+
Basic Cognitive Profile
+
Development Snapshot
```

------------------------------------------------------------------------

## 5.3 COMPLETE --- Understand Your Potential --- Rp199K

Candidate instruments:

-   Cognitive;
-   EQ;
-   AQ;
-   Personality;
-   Strength;
-   RIASEC / Interest;
-   Learning Profile.

Output:

``` text
Overall Profile
+
Domain Profile
+
Interest Profile
+
Learning Profile
+
Potential Study Areas
```

------------------------------------------------------------------------

## 5.4 FUTURE --- Discover Your Direction --- Rp299K

Target utama:

> siswa + orang tua.

Candidate instruments:

-   Cognitive;
-   EQ;
-   AQ;
-   Personality;
-   Strength / 8 Intelligence;
-   RIASEC;
-   Learning Profile;
-   Interest;
-   Direction profile.

Output utama:

``` text
Personal Profile
        ↓
Strength Profile
        ↓
Interest Profile
        ↓
Learning Profile
        ↓
Study Direction
        ↓
Major Fit
        ↓
Career Exploration
```

Future adalah **hero product**, tetapi hanya boleh dijual sebagai produk
utama setelah measurement model dan recommendation logic cukup kuat.

------------------------------------------------------------------------

# 6. ASSESSMENT CATALOG --- HYPOTHESIS, NOT YET LOCKED

Candidate assessment families:

## 6.1 Cognitive / IQ-like assessment

Potential construct:

-   reasoning;
-   numerical reasoning;
-   verbal reasoning;
-   abstract reasoning;
-   pattern recognition;
-   problem solving.

**Important:**

Jangan menggunakan label "IQ" secara komersial hanya karena assessment
menghasilkan angka.

Jika tidak menggunakan instrumen IQ yang tervalidasi secara psikometrik,
gunakan terminology seperti:

> Cognitive Ability Profile

atau:

> Cognitive Reasoning Assessment

until the construct and validity are established.

------------------------------------------------------------------------

## 6.2 EQ

Potential constructs:

-   emotional awareness;
-   emotional regulation;
-   empathy;
-   interpersonal awareness;
-   emotional response.

EQ harus memiliki construct definition sendiri.

Jangan hanya mengambil skor personality lalu menyebutnya EQ.

------------------------------------------------------------------------

## 6.3 AQ

Potential constructs:

-   persistence;
-   resilience;
-   response to adversity;
-   recovery;
-   adaptability.

AQ juga harus mempunyai scoring model sendiri.

------------------------------------------------------------------------

## 6.4 Personality / DISC

DISC dapat menjadi salah satu personality profile.

Output tidak boleh sekadar:

``` text
D = 72
I = 81
S = 55
C = 62
```

Tetapi harus memiliki:

``` text
Dominant Pattern
+
Secondary Pattern
+
Behavioral Tendencies
+
Potential Strengths
+
Potential Challenges
```

------------------------------------------------------------------------

## 6.5 8 Intelligence / Strength Profile

Candidate dimensions:

-   Linguistic;
-   Logical-Mathematical;
-   Spatial;
-   Bodily-Kinesthetic;
-   Musical;
-   Interpersonal;
-   Intrapersonal;
-   Naturalistic.

**Important product rule:**

Jika menggunakan konsep Multiple Intelligences, jangan memasarkan hasil
sebagai ukuran "IQ alternatif" atau bukti kemampuan akademik tanpa dasar
validitas yang sesuai.

Lebih aman memposisikannya sebagai:

> Strength / Preference Profile

sampai measurement basis dikunci.

------------------------------------------------------------------------

## 6.6 RIASEC / Interest

RIASEC sangat penting untuk tujuan pendidikan.

Dimensions:

``` text
Realistic
Investigative
Artistic
Social
Enterprising
Conventional
```

RIASEC harus dipisahkan dari personality.

Karena:

``` text
Personality ≠ Interest
Interest ≠ Ability
Ability ≠ Strength
```

Semua dapat berkontribusi pada rekomendasi, tetapi tidak boleh dicampur
menjadi satu score mentah.

------------------------------------------------------------------------

# 7. CORE MEASUREMENT MODEL

ReadyScore v3 harus membedakan:

``` text
CONSTRUCT
    ↓
INSTRUMENT
    ↓
ITEM
    ↓
RESPONSE
    ↓
RAW SCORE
    ↓
NORMALIZED SCORE
    ↓
PROFILE
    ↓
INTERPRETATION
```

Contoh:

``` text
RIASEC
  ↓
Interest Construct
  ↓
RIASEC Instrument
  ↓
Items
  ↓
Responses
  ↓
R / I / A / S / E / C raw scores
  ↓
Normalized scores
  ↓
Top-3 Holland Code
  ↓
Interest Profile
```

------------------------------------------------------------------------

# 8. SCORE SEPARATION RULE

**Tidak boleh semua assessment dipaksa menghasilkan satu angka lalu
dijumlahkan.**

Misalnya:

``` text
IQ = 82
EQ = 78
AQ = 85
DISC = 71
RIASEC = 90
```

tidak boleh otomatis menjadi:

``` text
Overall = 81.2
```

tanpa conceptual basis.

Yang benar:

``` text
Cognitive Profile
Emotional Profile
Resilience Profile
Personality Profile
Interest Profile
Strength Profile
```

Kemudian recommendation engine melakukan synthesis.

------------------------------------------------------------------------

# 9. READY SCORE --- REPOSITIONING

"ReadyScore" tetap dapat menjadi umbrella score.

Tetapi umbrella score harus jelas maknanya.

Option yang direkomendasikan:

> **ReadyScore = readiness profile for a defined decision context**

Bukan:

> skor kecerdasan seseorang.

Contoh:

``` text
Study Readiness
Career Exploration Readiness
Personal Development Readiness
```

Untuk Future:

``` text
Study Direction Readiness
```

Namun umbrella score tidak boleh menutupi profile instrument-level.

------------------------------------------------------------------------

# 10. PHASE 2.16.2 --- MEASUREMENT MODEL & CONSTRUCT RECONCILIATION

**Status:** NEXT PHASE --- DESIGN / VALIDATION\
**Objective:** Mengunci apa yang sebenarnya diukur ReadyScore sebelum
menambah commercial assessment.

## In Scope

-   construct catalog;
-   instrument catalog;
-   definition setiap construct;
-   distinction ability/personality/interest/strength;
-   score semantics;
-   normalization rules;
-   reverse-scoring rules;
-   weighting principles;
-   missing/partial response handling;
-   coverage rules;
-   minimum sample size per construct;
-   result confidence language;
-   disclaimer language;
-   assessment naming;
-   terminology governance.

## Out of Scope

-   payment;
-   subscription;
-   checkout;
-   AI recommendation;
-   university database;
-   marketing automation;
-   B2B school dashboard.

## Deliverables

``` text
ReadyScore_Construct_Catalog_v1.md
ReadyScore_Assessment_Instrument_Catalog_v1.md
ReadyScore_Scoring_Governance_v1.md
ReadyScore_Result_Semantics_v1.md
```

## Exit Criteria

-   [ ] Semua construct memiliki definisi.
-   [ ] Setiap instrument memiliki tujuan.
-   [ ] Ability, personality, interest, dan strength tidak tercampur.
-   [ ] Score meaning terdokumentasi.
-   [ ] Normalization rule terdokumentasi.
-   [ ] Coverage rule terdokumentasi.
-   [ ] Claim yang boleh/tidak boleh dibuat terdokumentasi.
-   [ ] Current scoring 2.16.1 diaudit.
-   [ ] Neutral-response behavior dipahami.
-   [ ] Current ReadyScore 75 behavior dijelaskan dari formula.
-   [ ] Tidak ada score yang dipertahankan hanya karena "sudah bekerja".

------------------------------------------------------------------------

# 11. PHASE 2.17 --- ASSESSMENT PRODUCT ARCHITECTURE

**Objective:** Mengubah kumpulan assessment menjadi product catalog yang
configurable.

Architecture:

``` text
Assessment Product
    ↓
Assessment Configuration
    ↓
Instrument Set
    ↓
Selection Configuration
    ↓
Scoring Configuration
    ↓
Result Configuration
    ↓
Entitlement
```

Contoh:

``` text
ESSENTIAL
 ├── Cognitive
 ├── Personality
 ├── Emotional
 └── Strength
```

``` text
COMPLETE
 ├── Cognitive
 ├── Personality
 ├── EQ
 ├── AQ
 ├── Strength
 ├── RIASEC
 └── Learning
```

``` text
FUTURE
 ├── Cognitive
 ├── Personality
 ├── EQ
 ├── AQ
 ├── Strength
 ├── RIASEC
 ├── Learning
 └── Direction
```

## Principle

Product tier tidak boleh di-hardcode ke question bank.

------------------------------------------------------------------------

# 12. PHASE 2.18 --- QUESTION BANK & TAXONOMY V2

Current taxonomy:

``` text
Domain
  ↓
Subdomain
  ↓
Indicator
```

harus dievaluasi apakah masih cocok untuk multi-instrument assessment.

Target taxonomy:

``` text
Assessment
    ↓
Instrument
    ↓
Construct
    ↓
Dimension
    ↓
Subdimension
    ↓
Item
```

Contoh:

``` text
RIASEC
 ↓
Interest
 ↓
Investigative
 ↓
Problem Exploration
 ↓
Item
```

Untuk DISC:

``` text
DISC
 ↓
Personality
 ↓
Dominance
 ↓
Behavioral Assertiveness
 ↓
Item
```

Untuk Cognitive:

``` text
Cognitive
 ↓
Reasoning Ability
 ↓
Numerical Reasoning
 ↓
Item
```

## Important

Current Question Bank tidak boleh langsung dimigrasikan secara agresif.

Lakukan:

``` text
CURRENT TAXONOMY
      ↓
RECONCILIATION MAP
      ↓
TARGET TAXONOMY
      ↓
MIGRATION
```

Existing question tetap harus dapat ditelusuri.

------------------------------------------------------------------------

# 13. PHASE 2.19 --- SCORING ENGINE V2

Ini adalah salah satu phase paling kritis.

Target:

``` text
Instrument
    ↓
Scoring Model
    ↓
Raw Score
    ↓
Normalization
    ↓
Dimension Score
    ↓
Profile
```

Scoring engine harus mendukung:

-   Likert;
-   reverse-scored items;
-   weighted items;
-   subscale;
-   multi-dimension;
-   normalized score;
-   percentage;
-   percentile jika basis data tersedia;
-   partial result;
-   coverage;
-   confidence indicator;
-   versioning.

## Hard Rule

Tidak boleh ada:

``` text
one-size-fits-all scoring formula
```

untuk:

-   EQ;
-   AQ;
-   DISC;
-   RIASEC;
-   cognitive;
-   strength.

Masing-masing instrument memiliki scoring specification.

------------------------------------------------------------------------

# 14. PHASE 2.20 --- ASSESSMENT SELECTION ENGINE V2

Selection Engine lama sudah menetapkan prinsip penting:

-   satu Question Bank;
-   eligibility filter;
-   deterministic selection;
-   snapshot;
-   versioning;
-   no duplicate;
-   Free 20;
-   Premium 100;
-   Premium coverage. fileciteturn57file0

Pada v2, selection harus naik level menjadi:

``` text
Product
 ↓
Instrument
 ↓
Construct
 ↓
Dimension quota
 ↓
Item selection
 ↓
Difficulty / balance
 ↓
Deterministic seed
 ↓
Attempt snapshot
```

Contoh Future:

``` text
Cognitive
  20 items

DISC
  24 items

EQ
  20 items

AQ
  20 items

RIASEC
  30 items

Strength
  32 items
```

Jumlah tersebut hanyalah contoh architecture, **bukan angka final**.

Final item count harus ditentukan oleh measurement requirement.

------------------------------------------------------------------------

# 15. PHASE 2.21 --- RESULT & INTERPRETATION ENGINE

Current result page sudah dapat menampilkan:

-   overall score;
-   domain ranking;
-   strength;
-   priority;
-   coverage.

Itu menjadi foundation.

Target v2:

``` text
RAW RESULT
     ↓
PROFILE
     ↓
INTERPRETATION
     ↓
INSIGHT
```

Output:

### Profile

Apa hasil pengukuran?

### Interpretation

Apa arti hasil tersebut?

### Insight

Apa yang kemungkinan relevan bagi user?

### Action

Apa yang dapat dieksplorasi berikutnya?

------------------------------------------------------------------------

# 16. INTERPRETATION SAFETY RULE

Jangan menghasilkan klaim:

``` text
Anda pasti cocok menjadi dokter.
Anda tidak cocok menjadi programmer.
IQ Anda menentukan jurusan.
```

Gunakan:

``` text
Strong fit
Potential fit
Worth exploring
Potential challenge
Area to validate
```

Result harus mengakui bahwa:

``` text
assessment ≠ destiny
```

Assessment membantu decision-making, bukan menentukan masa depan
seseorang.

------------------------------------------------------------------------

# 17. PHASE 2.22 --- STUDY DIRECTION ENGINE

Ini adalah titik dimana ReadyScore mulai benar-benar menjadi produk
pendidikan.

Input:

``` text
Cognitive
+
Personality
+
EQ
+
AQ
+
Strength
+
RIASEC
+
Learning Profile
```

Output:

``` text
Study Area
```

Contoh:

``` text
Technology & Computing
Business & Management
Engineering
Health & Life Sciences
Social Sciences
Communication
Design & Creative
Education
Law
Agriculture / Environmental
```

Jangan langsung menuju universitas.

Pertama:

``` text
PROFILE
 ↓
STUDY AREA
```

------------------------------------------------------------------------

# 18. PHASE 2.23 --- MAJOR FIT ENGINE

Setelah Study Direction stabil:

``` text
Study Area
 ↓
Major
 ↓
Fit Factors
 ↓
Recommendation
```

Recommendation harus menjelaskan:

``` text
Major
Fit Score
Why it appears
Supporting factors
Potential challenges
What to explore
```

Contoh:

``` text
#1 Computer Science
Fit: 92

Supporting:
- Investigative interest
- Logical reasoning
- Analytical strength
- Persistence

Potential challenges:
- Social interaction preference: moderate

Explore:
- Programming
- Data
- AI
- Systems
```

**Fit Score bukan probability of success.**

------------------------------------------------------------------------

# 19. PHASE 2.24 --- CAREER EXPLORATION ENGINE

Major bukan final destination.

Architecture:

``` text
Profile
 ↓
Study Area
 ↓
Major
 ↓
Career Family
 ↓
Career Exploration
```

Contoh:

``` text
Computer Science
 ↓
Software Engineering
Data
AI
Cybersecurity
Product
Systems
```

Career output tetap bersifat exploratory.

------------------------------------------------------------------------

# 20. PHASE 2.25 --- COMMERCIAL ENTITLEMENT & PRICING

Commercial layer:

``` text
Product Catalog
    ↓
Price
    ↓
Entitlement
    ↓
Assessment Access
    ↓
Result Access
    ↓
Report Access
```

Tier:

``` text
FREE
ESSENTIAL
COMPLETE
FUTURE
```

Jangan hard-code:

``` text
if price == 299000
```

Gunakan product/entitlement model.

Contoh:

``` text
Product:
FUTURE

Entitlements:
- COGNITIVE_FULL
- PERSONALITY_FULL
- EQ_FULL
- AQ_FULL
- STRENGTH_FULL
- RIASEC_FULL
- LEARNING_FULL
- STUDY_DIRECTION
- MAJOR_FIT
- CAREER_EXPLORATION
- FULL_REPORT
```

------------------------------------------------------------------------

# 21. PHASE 2.26 --- REPORT & PARENT EXPERIENCE

Future product harus mempunyai report yang dapat dipahami orang tua.

Target:

``` text
Student Report
Parent Insight
```

Parent report bukan copy dari student report.

Parent report fokus:

-   strengths;
-   interests;
-   learning tendencies;
-   study directions;
-   areas to explore;
-   potential challenges;
-   suggested conversations;
-   questions parents can discuss with child.

------------------------------------------------------------------------

# 22. PHASE 2.27 --- B2C CONVERSION FUNNEL

Target funnel:

``` text
Landing Page
    ↓
Free Assessment
    ↓
Result
    ↓
Profile Gap
    ↓
Essential / Complete / Future
    ↓
Payment
    ↓
Premium Assessment
    ↓
Detailed Result
    ↓
Major Exploration
    ↓
Parent Report / Deep Dive
```

Important:

Free result harus membuat user memahami:

> "Saya baru melihat sebagian dari profil saya."

Bukan:

> "Saya sudah mendapatkan semua."

------------------------------------------------------------------------

# 23. PHASE 2.28 --- ADD-ON PRODUCTS

Setelah Future stabil:

## Major Deep Dive

Candidate price:

``` text
Rp49K
```

## Parent Insight Report

Candidate price:

``` text
Rp49K
```

## Career Deep Dive

Candidate price:

``` text
Rp49K–99K
```

Harga adalah commercial hypothesis.

Architecture harus memungkinkan add-on tanpa mengubah core assessment.

------------------------------------------------------------------------

# 24. PHASE 2.29 --- B2B SCHOOL / INSTITUTION

Setelah B2C engine terbukti:

``` text
School
 ↓
Student Cohort
 ↓
Assessment
 ↓
Aggregate Profile
 ↓
Counselor Dashboard
```

Potential use cases:

-   student profiling;
-   career guidance;
-   study direction;
-   counseling support;
-   cohort analysis;
-   parent discussion.

B2B tidak boleh dibangun sebelum measurement model dan B2C output cukup
matang.

------------------------------------------------------------------------

# 25. PHASE 2.30 --- MEASUREMENT CALIBRATION

Ini sangat penting.

Jika ReadyScore ingin membuat klaim yang semakin kuat, perlu dilakukan:

-   item analysis;
-   response distribution analysis;
-   internal consistency;
-   subscale analysis;
-   item discrimination review;
-   reliability review;
-   construct review;
-   test-retest consideration;
-   normative dataset planning.

Jika memakai istilah psikometrik formal atau membuat klaim diagnostik,
perlu validasi yang sesuai dan keterlibatan profesional yang kompeten.

**Engineering tidak boleh menganggap sebuah formula valid hanya karena
hasilnya terlihat masuk akal.**

------------------------------------------------------------------------

# 26. PHASE 2.31 --- RELEASE HARDENING

Final hardening:

``` text
Architecture Audit
 ↓
Data Integrity
 ↓
Scoring Regression
 ↓
Selection Regression
 ↓
Result Regression
 ↓
Commercial Entitlement Test
 ↓
Security
 ↓
Performance
 ↓
Typecheck
 ↓
Build
 ↓
Production Readiness
```

------------------------------------------------------------------------

# 27. MASTER ROADMAP

``` text
2.16.1  Assessment Scoring & Coverage Reconciliation
          ↓
3.0   Measurement Model & Construct Reconciliation
          ↓
3.1   Assessment Product Architecture
          ↓
3.2   Question Bank & Taxonomy V2
          ↓
3.3   Scoring Engine V2
          ↓
3.4   Assessment Selection Engine V2
          ↓
3.5   Result & Interpretation Engine
          ↓
3.6   Study Direction Engine
          ↓
3.7   Major Fit Engine
          ↓
3.8   Career Exploration Engine
          ↓
3.9   Commercial Entitlement & Pricing
          ↓
3.10  Report & Parent Experience
          ↓
3.11  B2C Conversion Funnel
          ↓
3.12  Add-on Products
          ↓
3.13  B2B School / Institution
          ↓
3.14  Measurement Calibration
          ↓
3.15  Release Hardening
```

------------------------------------------------------------------------

# 28. DEVELOPMENT PRIORITY

Priority ranking:

## P0 --- MUST BE CORRECT

``` text
Measurement Model
Scoring
Question Mapping
Selection
Coverage
Result semantics
```

## P1 --- MUST CREATE VALUE

``` text
Study Direction
Major Fit
Commercial Product
```

## P2 --- GROWTH

``` text
Parent Report
Major Deep Dive
Career Deep Dive
B2C Funnel
```

## P3 --- SCALE

``` text
B2B School
Cohort Analytics
Advanced Calibration
```

------------------------------------------------------------------------

# 29. WHAT WE MUST NOT DO NOW

Do not immediately build:

-   payment;
-   subscription;
-   AI chatbot;
-   AI career counselor;
-   university marketplace;
-   school dashboard;
-   PDF generator;
-   mobile app;
-   gamification;
-   adaptive testing;
-   machine learning recommendation;
-   large-scale marketing automation.

Reason:

> Semua itu akan memperbesar sistem sebelum kita memastikan measurement
> core benar.

------------------------------------------------------------------------

# 30. CURRENT SCORING RECONCILIATION --- NON-NEGOTIABLE

Current observation:

``` text
20 answers
All Neutral
Result = 75
```

harus menjadi test case permanen.

Create regression case:

``` text
CASE: ALL_NEUTRAL_RESPONSE
```

Expected result harus ditentukan oleh measurement specification.

Tidak boleh ditentukan berdasarkan:

> "angka 75 kelihatan bagus."

Expected semantics harus berasal dari scoring model.

------------------------------------------------------------------------

# 31. TEST DATA STRATEGY

Minimal synthetic test profiles:

## Profile A --- All Neutral

``` text
All responses = 3
```

## Profile B --- All Positive

``` text
All responses = 5
```

## Profile C --- All Negative

``` text
All responses = 1
```

## Profile D --- Mixed

``` text
1 / 2 / 3 / 4 / 5
```

## Profile E --- Reverse Items

Memastikan reverse scoring benar.

## Profile F --- Partial

Sebagian unanswered.

## Profile G --- Single Construct Dominant

Memastikan subscale separation.

------------------------------------------------------------------------

# 32. VERSIONING RULE

Every critical engine must be versioned.

``` text
QUESTION_BANK_V1
TAXONOMY_V1
SELECTION_V1
SCORING_V1
INTERPRETATION_V1
RECOMMENDATION_V1
```

When materially changed:

``` text
SCORING_V2
```

Existing result snapshots remain reproducible.

------------------------------------------------------------------------

# 33. SNAPSHOT RULE

Completed assessment must preserve:

``` text
assessmentType
assessmentConfigurationVersion
questionBankVersion
taxonomyVersion
selectionAlgorithmVersion
scoringVersion
selectedQuestionIds
responses
result
```

Question Bank changes must not alter historical results.

This follows the existing selection architecture's immutability and
snapshot principles. fileciteturn57file9

------------------------------------------------------------------------

# 34. ARCHITECTURE TARGET

Target architecture:

``` text
                    READY SCORE V2
                          │
              ┌───────────┴───────────┐
              │                       │
        PRODUCT CATALOG          QUESTION BANK
              │                       │
        ENTITLEMENT               TAXONOMY
              │                       │
              └───────────┬───────────┘
                          ↓
                 ASSESSMENT ENGINE
                          │
          ┌───────────────┼────────────────┐
          ↓               ↓                ↓
      SELECTION        RUNTIME          SCORING
          │               │                │
          └───────────────┼────────────────┘
                          ↓
                     PROFILE ENGINE
                          ↓
                 INTERPRETATION ENGINE
                          ↓
               DIRECTION ENGINE
                  │             │
                  ↓             ↓
             STUDY AREA      CAREER
                  ↓
              MAJOR FIT
                  ↓
              REPORTING
                  ↓
          COMMERCIAL EXPERIENCE
```

------------------------------------------------------------------------

# 35. DOMAIN SEPARATION

The system must distinguish:

``` text
Assessment
Instrument
Construct
Dimension
Question
Response
Score
Profile
Interpretation
Recommendation
Product
Entitlement
Report
```

These are separate concepts.

Do not collapse them into one giant `AssessmentResult`.

------------------------------------------------------------------------

# 36. DATA MODEL DIRECTION

Future conceptual model:

``` text
AssessmentProduct
    ├── AssessmentConfiguration
    ├── Entitlement
    └── Price

AssessmentConfiguration
    ├── InstrumentConfiguration
    ├── SelectionConfiguration
    ├── ScoringConfiguration
    └── ResultConfiguration

Instrument
    ├── Construct
    ├── Dimension
    └── ScoringModel

Question
    ├── Instrument
    ├── Dimension
    ├── Indicator
    └── ScoringKey

Attempt
    ├── Product
    ├── ConfigurationVersion
    ├── SelectedQuestions
    ├── Responses
    └── ResultSnapshot

Result
    ├── InstrumentResults
    ├── Profile
    ├── Coverage
    └── Interpretation

Recommendation
    ├── StudyArea
    ├── Major
    └── CareerFamily
```

This is a target architecture, not an instruction to immediately migrate
the current database.

------------------------------------------------------------------------

# 37. ONE ACTIVE PHASE RULE

Only one phase is active at a time.

``` text
PHASE N
   ↓
IMPLEMENT
   ↓
VERIFY
   ↓
PASS
   ↓
LOCK
   ↓
PHASE N+1
```

No phase skipping.

No "sekalian".

No silent architecture changes.

------------------------------------------------------------------------

# 38. DISCOVER → CLASSIFY → ACT

Every issue found during development must be classified:

``` text
BLOCKING
REQUIRED BY CURRENT PHASE
TECHNICAL DEBT
FUTURE ENHANCEMENT
```

Only:

``` text
BLOCKING
REQUIRED BY CURRENT PHASE
```

may change active implementation.

------------------------------------------------------------------------

# 39. PHASE CONTRACT

Every phase must contain:

``` text
Objective
In Scope
Out of Scope
Dependencies
Target Files
Target Data Model
Acceptance Criteria
Verification Commands
Known Risks
Exit Criteria
```

------------------------------------------------------------------------

# 40. DEFINITION OF DONE

A phase is PASS only when:

-   implementation complete;
-   typecheck PASS;
-   build PASS;
-   relevant runtime flow tested;
-   database state verified where applicable;
-   regression cases PASS;
-   no blocking error;
-   known deferred issues documented.

Then:

``` text
PASS
LOCK
NEXT
```

------------------------------------------------------------------------

# 41. DOCUMENTATION SET

The ReadyScore v3 documentation should evolve into:

``` text
docs/
├── 00_PRODUCT_VISION.md
├── 01_MASTER_ROADMAP.md
├── 02_MEASUREMENT_MODEL.md
├── 03_ASSESSMENT_CATALOG.md
├── 04_TAXONOMY.md
├── 05_QUESTION_BANK_STANDARD.md
├── 06_SELECTION_ENGINE.md
├── 07_SCORING_ENGINE.md
├── 08_INTERPRETATION_ENGINE.md
├── 09_STUDY_DIRECTION_ENGINE.md
├── 10_MAJOR_FIT_ENGINE.md
├── 11_COMMERCIAL_MODEL.md
├── 12_REPORT_MODEL.md
├── 13_B2B_MODEL.md
└── phases/
    ├── PHASE_2.16.2.md
    ├── PHASE_2.17.md
    ├── PHASE_2.18.md
    └── ...
```

------------------------------------------------------------------------

# 42. IMMEDIATE NEXT ACTION

**Do not start Phase 2.17 yet.**

The immediate next work is:

# Phase 2.16.2 --- Measurement Model & Construct Reconciliation

First objective:

> **Pastikan kita benar-benar tahu apa yang sedang kita ukur.**

Specifically:

1.  audit current scoring-engine;
2.  document the exact current formula;
3.  explain why all-neutral currently produces 75;
4.  define what "neutral" means;
5.  define scale semantics;
6.  define construct boundaries;
7.  decide which candidate instruments are actually appropriate;
8.  decide which instruments can be claimed as formal assessments;
9.  define the measurement model for each;
10. only then redesign scoring.

------------------------------------------------------------------------

# 43. DECISION GATE

Before Phase 2.17 starts, we must be able to answer:

### Measurement

-   What does each assessment measure?
-   What does each score mean?
-   What does a 75 mean?
-   What does Neutral mean?
-   What is the baseline?
-   What is high/medium/low?
-   How much coverage is sufficient?

### Product

-   What does Free sell?
-   What does Essential sell?
-   What does Complete sell?
-   What does Future sell?

### Education

-   How do profiles contribute to study direction?
-   Which signals are strong?
-   Which signals are supporting?
-   What should never determine a major by itself?

### Architecture

-   Which engine owns scoring?
-   Which engine owns interpretation?
-   Which engine owns recommendation?
-   Which data must be immutable?
-   Which versions must be persisted?

If these questions cannot be answered:

``` text
STOP
```

Do not proceed to commercial implementation.

------------------------------------------------------------------------

# 44. STRATEGIC PRINCIPLE

The most important shift for ReadyScore v3 is:

``` text
OLD

Question
  ↓
Score
  ↓
Result
```

becomes:

``` text
NEW

Question
   ↓
Measurement
   ↓
Construct
   ↓
Profile
   ↓
Interpretation
   ↓
Study Direction
   ↓
Major Exploration
   ↓
Career Exploration
```

And commercially:

``` text
FREE
 ↓
ESSENTIAL
 ↓
COMPLETE
 ↓
FUTURE
 ↓
DEEP DIVE
 ↓
PARENT
 ↓
SCHOOL
```

------------------------------------------------------------------------

# 45. FINAL V2 NORTH STAR

ReadyScore v3 should not compete primarily on:

``` text
number of questions
number of tests
AI features
dashboard sophistication
```

It should compete on:

> **the quality of the connection between a person's profile and the
> direction they should explore next.**

The core product loop is:

``` text
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

Where:

``` text
MEASURE
= assessment instruments

UNDERSTAND
= profile + interpretation

CONNECT
= cross-instrument synthesis

EXPLORE
= study / major / career direction

DECIDE
= informed next step
```

This is the core north star for ReadyScore v3.

------------------------------------------------------------------------

# 46. CURRENT STATUS

``` text
READY SCORE v2

Phase 2.16.1
Assessment Scoring & Coverage Reconciliation
STATUS: IMPLEMENTED / VERIFIED AT RUNTIME BASELINE

                    ↓

Phase 2.16.2
Assessment Architecture & Measurement Model
STATUS: ACTIVE

                    ↓

Phase 2.17+
Productization & Direction Intelligence
STATUS: PLANNED
```

**No Phase 2.17 implementation should begin until Phase 2.16.2 is PASS
and LOCKED.**

# END OF READY SCORE V2 MASTER ROADMAP
