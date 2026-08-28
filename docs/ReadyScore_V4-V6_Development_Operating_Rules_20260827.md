# ReadyScore V4--V6 Development Operating Rules

## Development Update & Source-of-Truth Extension

**Document:** ReadyScore V4--V6 Development Operating Rules\
**Date:** 2026-08-27\
**Status:** ACTIVE DEVELOPMENT CONTROL\
**Based on:** ReadyScore v3 Comprehensive Context Handoff +
`RS-V3-SOURCE-OF-TRUTH` v1.0.0\
**Purpose:** Menjadi pedoman operasional selama development ReadyScore
V4, V5, dan V6.

------------------------------------------------------------------------

# 1. PURPOSE

Dokumen ini menjadi update operasional setelah ReadyScore v3 mencapai
frozen engineering baseline dan seluruh scope development berikutnya
dibatasi menjadi:

``` text
V4 → L1–L7
V5 → L8–L10
V6 → L11–L12
```

Dokumen ini tidak menggantikan arsitektur V3 atau source-of-truth
measurement model.

Fungsi dokumen ini adalah:

1.  menjaga scope development tetap terkunci;
2.  menjaga frozen architecture tetap tidak berubah tanpa keputusan
    eksplisit;
3.  menetapkan cara kerja development berbasis full ZIP;
4.  memastikan user tidak perlu melakukan manual file patch;
5.  memastikan setiap implementation menghasilkan full ZIP yang dapat
    langsung diuji;
6.  menjaga regression baseline;
7.  mencegah pembuatan folder `docs` baru di dalam ZIP;
8.  memastikan dokumentasi tambahan ditempatkan dalam folder versi dan
    dapat dipindahkan manual oleh user;
9.  menjadi operating rule untuk seluruh development V4--V6.

------------------------------------------------------------------------

# 2. SOURCE-OF-TRUTH HIERARCHY

Source of truth utama tetap:

``` text
ReadyScore V3 SOURCE OF TRUTH
        ↓
V3 Master Architecture / Reconciliation
        ↓
Relevant Phase / Version Specification
        ↓
Actual Source / Database Contract
        ↓
Frozen Runtime Baseline
```

Jika terjadi konflik:

``` text
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
UPDATE AFFECTED DOCUMENTATION
   ↓
IMPLEMENT
   ↓
REGRESSION
```

Tidak boleh menyelesaikan konflik dengan asumsi.

------------------------------------------------------------------------

# 3. FROZEN V3 BOUNDARY

Baseline engineering yang tetap berlaku:

``` text
F.10-C.2-F
RIASEC Actual Runtime E2E
PASS
```

Frozen RIASEC regression minimum:

``` text
Start route reachability       PASS
Question selection             PASS
60 questions                   PASS
R/I/A/S/E/C                    10/10/10/10/10/10
60 answer submissions          PASS
Persistence / reload           PASS
Submit + scoring               PASS
Result payload                 PASS
RIASEC measurement             PASS
RIASEC_RESULT_V1               PASS
Six dimensions                 PASS
Top code                       PASS
Scoring version                PASS
```

V4--V6 tidak membuka kembali F.10.x kecuali ditemukan defect baru yang
didukung oleh actual source/runtime evidence.

Successful runtime execution juga tidak boleh dianggap sebagai bukti
psychometric validation.

------------------------------------------------------------------------

# 4. DEVELOPMENT SCOPE --- LOCKED

Mulai dokumen ini, development scope dibatasi secara eksplisit:

``` text
READY SCORE V3
       │
       ▼
FROZEN ARCHITECTURE
       │
       ▼
V4
L1–L7
       │
       ▼
V5
L8–L10
       │
       ▼
V6
L11–L12
       │
       ▼
LAUNCH
```

Tidak membuat Phase 3.16, 3.17, atau phase tambahan lain sebagai
development cursor.

Phase 3.1--3.15 tetap menjadi frozen architectural history/boundary
sebagaimana ditetapkan dalam development context terbaru.

------------------------------------------------------------------------

# 5. VERSION 4 --- CORE PRODUCT

## V4 Scope

``` text
V4
│
├── L1 Commercial Runtime
├── L2 Scalev → ReadyScore Integration
├── L3 RIASEC Productization
├── L4 DISC MVP
├── L5 EQ MVP
├── L6 Cognitive MVP
└── L7 Result Experience
```

## V4 Objective

Target V4:

> Customer dapat masuk melalui commercial flow, memperoleh akses yang
> benar, mengerjakan assessment, dan menerima result yang
> customer-facing serta dapat dipahami.

V4 tidak bertujuan menyelesaikan seluruh future intelligence layer.

------------------------------------------------------------------------

# 6. V4 --- L1 COMMERCIAL RUNTIME

## Objective

Mengubah commercial model yang sudah ditetapkan menjadi runtime
application behavior.

Customer-facing commercial truth:

  ------------------------------------------------------------------------
  Product                                      Price Scope
  --------------------- ---------------------------- ---------------------
  Single Test                               Rp99.000 1 test pilihan

  All Tests                                Rp199.000 IQ + EQ + DISC +
                                                     RIASEC

  All Tests + Profiling                    Rp249.000 All Tests +
                                                     Cross-Test Profiling

  Reassessment Credit                       Rp49.000 1 assessment attempt
                                                     tambahan untuk test
                                                     yang sudah unlocked
  ------------------------------------------------------------------------

## Rules

Tidak ada:

-   Rp299k customer-facing product;
-   standalone Rp150k All Tests product;
-   unlimited free assessment;
-   30-day reassessment cooldown;
-   standalone upgrade product yang mengubah catalog.

Upgrade differential:

``` text
99 → 199 = +100k
99 → 249 = +150k
199 → 249 = +50k
```

Differential adalah credit/upgrade logic, bukan product tier baru.

## Architectural boundary

Tetap pisahkan:

``` text
PRODUCT
PRODUCT TIER
ENTITLEMENT
        ≠
TEST TYPE
ASSESSMENT CONFIGURATION
        ≠
SCORING
RESULT
```

Commercial access tidak boleh mengubah measurement semantics.

------------------------------------------------------------------------

# 7. V4 --- L2 SCALEV → READYSCORE INTEGRATION

## Objective

Mewujudkan paid acquisition path:

``` text
Paid Ads
   ↓
Scalev Landing
   ↓
Payment
   ↓
Payment Confirmation
   ↓
ReadyScore Handoff
   ↓
Customer Identity
   ↓
Transaction
   ↓
Product Mapping
   ↓
Entitlement
   ↓
ReadyScore Application
```

## Required capability

Implementation harus mempertimbangkan:

-   handoff mechanism;
-   identity mapping;
-   transaction/reference ID;
-   purchased product;
-   entitlement mapping;
-   secure validation;
-   idempotency;
-   duplicate protection;
-   failure handling;
-   return/deep link;
-   auditability.

Tidak boleh mengandalkan query parameter sederhana seperti:

``` text
?paid=true
```

sebagai bukti pembayaran tanpa server-side verification.

## Scope boundary

Payment provider/checkout implementation hanya dibangun sejauh
diperlukan oleh launch integration scope.

Jangan memperluas L2 menjadi billing/subscription architecture baru
tanpa keputusan eksplisit.

------------------------------------------------------------------------

# 8. V4 --- L3 RIASEC PRODUCTIZATION

RIASEC engine existing adalah frozen baseline.

L3 bukan rewrite scoring engine.

## Focus

-   assessment UX;
-   question presentation;
-   progress experience;
-   answer interaction;
-   loading state;
-   error state;
-   completion experience;
-   result visualization;
-   six dimension presentation;
-   top interest pattern;
-   interpretation;
-   result CTA;
-   assessment history foundation jika dibutuhkan oleh result
    experience.

## Regression requirement

Unrelated changes wajib mempertahankan:

``` text
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

------------------------------------------------------------------------

# 9. V4 --- L4 DISC MVP

DISC menjadi customer-facing assessment MVP.

Minimum scope:

``` text
DISC
 │
 ├── Question Bank
 ├── Assessment
 ├── Persistence
 ├── Scoring
 ├── Result Contract
 ├── Interpretation
 └── Result UX
```

Minimum output:

-   Primary Pattern;
-   Secondary Pattern;
-   Behavioral Tendencies;
-   Potential Strengths;
-   Potential Challenges.

DISC adalah behavioral/personality profile.

DISC bukan aptitude dan tidak boleh secara otomatis menentukan major
atau career.

------------------------------------------------------------------------

# 10. V4 --- L5 EQ MVP

EQ dibangun sebagai assessment MVP dengan separation yang jelas dari
personality.

Minimum conceptual dimensions:

``` text
Emotion Awareness
Emotion Regulation
Empathy / Social Awareness
Relationship / Social Response
```

Scope:

-   question bank;
-   assessment;
-   persistence;
-   scoring;
-   dimension result;
-   interpretation;
-   customer-facing UX;
-   coverage/sufficiency handling;
-   claim governance.

Terminology harus mengikuti evidence instrument.

------------------------------------------------------------------------

# 11. V4 --- L6 COGNITIVE MVP

Untuk launch MVP, cognitive assessment tidak otomatis diberi formal IQ
claim.

Terminology yang aman sesuai source-of-truth:

``` text
Cognitive Ability Profile
```

atau:

``` text
Cognitive Reasoning Assessment
```

Scope:

-   question bank;
-   assessment;
-   persistence;
-   scoring;
-   cognitive dimensions;
-   result contract;
-   interpretation;
-   customer-facing UX.

Tidak boleh melakukan:

``` text
score 0–100
    ↓
langsung disebut IQ
```

0--100 adalah presentation scale dan bukan otomatis measurement meaning.

------------------------------------------------------------------------

# 12. V4 --- L7 RESULT EXPERIENCE

Result adalah bagian utama product experience.

Target generic flow:

``` text
ASSESSMENT COMPLETE
        ↓
RESULT SUMMARY
        ↓
WHAT THIS MEANS
        ↓
YOUR PROFILE
        ↓
STRENGTHS
        ↓
AREAS TO WATCH
        ↓
WHAT TO EXPLORE
        ↓
NEXT ACTION
```

Setiap test tetap memiliki result semantics sendiri.

Measurement chain tetap:

``` text
RAW SCORE
    ↓
SCALE SCORE
    ↓
PROFILE SCORE
    ↓
INTERPRETATION
```

Tidak boleh mengubah score menjadi klaim yang tidak didukung.

Allowed language antara lain:

``` text
Strong fit
Potential fit
Worth exploring
Areas to strengthen
Potential challenge
Suggested exploration
```

Hindari deterministic claims seperti:

``` text
You must become...
You are definitely suitable for...
You will succeed in...
Your IQ determines...
```

------------------------------------------------------------------------

# 13. VERSION 4 EXIT CONDITION

V4 dapat dianggap selesai hanya jika secara keseluruhan:

``` text
L1 Commercial Runtime             PASS
L2 Scalev Integration             PASS
L3 RIASEC Productization          PASS
L4 DISC MVP                       PASS
L5 EQ MVP                         PASS
L6 Cognitive MVP                  PASS
L7 Result Experience              PASS
```

Dan:

``` text
typecheck                         PASS
build                             PASS
relevant gates                    PASS
frozen RIASEC regression          PASS
database/migration verification  PASS
```

------------------------------------------------------------------------

# 14. VERSION 5 --- RETEST, UPGRADE & PROFILING

## V5 Scope

``` text
V5
│
├── L8 Reassessment
├── L9 Upgrade & Conversion
└── L10 Cross-Test Profiling
```

## V5 Objective

Target V5:

> Customer yang telah memiliki assessment dapat kembali, melakukan
> reassessment, membeli assessment tambahan, melakukan upgrade, dan
> mendapatkan Cross-Test Profiling.

------------------------------------------------------------------------

# 15. V5 --- L8 REASSESSMENT

Reassessment adalah assessment attempt baru.

Bukan retry.

Bukan overwrite.

Model:

``` text
Initial Assessment
       ↓
Official Result #1
       ↓
Rp49k Reassessment Credit
       ↓
New Assessment Attempt
       ↓
Official Result #2
```

## Immutable result principle

Setiap attempt adalah official snapshot.

``` text
Attempt #1
Attempt #2
Attempt #3
```

Result sebelumnya tidak boleh dihapus atau ditimpa.

## Rate limit

``` text
No cooldown period
```

Tetapi:

``` text
Maximum 1 reassessment
per test type
per calendar day
```

Rule berlaku per test type, bukan global.

Contoh:

``` text
RIASEC → 1 reassessment/day
DISC   → 1 reassessment/day
EQ     → 1 reassessment/day
IQ     → 1 reassessment/day
```

jika credit tersedia.

------------------------------------------------------------------------

# 16. V5 --- L9 UPGRADE & CONVERSION

Customer journey:

``` text
Rp99k
Single Test
    ↓
Existing Ownership
    ↓
Upgrade
    ├── Rp199k All Tests
    └── Rp249k All Tests + Profiling
```

Differential:

``` text
99 → 199 = +100k
99 → 249 = +150k
199 → 249 = +50k
```

Catalog tetap:

``` text
99
199
249
```

Tidak membuat product tier baru hanya untuk representasi differential.

Upgrade calculation harus mempertimbangkan entitlement/credit yang
benar-benar telah dimiliki customer.

------------------------------------------------------------------------

# 17. V5 --- L10 CROSS-TEST PROFILING

Profiling adalah premium differentiation.

Input:

``` text
Cognitive Profile
        +
EQ Profile
        +
DISC Profile
        +
RIASEC Profile
        ↓
CROSS-TEST PROFILE
```

Profiling bukan arithmetic average.

Dilarang:

``` text
IQ + EQ + DISC + RIASEC
-----------------------
            4
```

## Evidence hierarchy

Primary signals:

``` text
Interest
Cognitive Ability
Relevant Strength Profile
```

Supporting signals:

``` text
Personality
Learning Profile
EQ
AQ
```

Contextual signals:

``` text
User goals
Academic background
Constraints
Preferences
```

Profiling tidak boleh membuat deterministic career/major claims dari
satu test.

------------------------------------------------------------------------

# 18. VERSION 5 EXIT CONDITION

``` text
L8 Reassessment                  PASS
L9 Upgrade & Conversion          PASS
L10 Cross-Test Profiling         PASS
```

Dengan:

``` text
typecheck                         PASS
build                             PASS
relevant gates                    PASS
frozen RIASEC regression          PASS
database/migration verification  PASS
```

------------------------------------------------------------------------

# 19. VERSION 6 --- PAID E2E & LAUNCH

## V6 Scope

``` text
V6
│
├── L11 Paid Customer E2E
└── L12 Launch QA
```

## V6 Objective

Membuktikan bahwa ReadyScore dapat digunakan oleh customer berbayar dari
awal sampai akhir.

------------------------------------------------------------------------

# 20. V6 --- L11 PAID CUSTOMER E2E

Minimum journey:

``` text
Paid Ads
   ↓
Scalev
   ↓
Rp99k Payment
   ↓
ReadyScore
   ↓
Identity / Account
   ↓
Entitlement
   ↓
Choose Test
   ↓
Assessment
   ↓
Scoring
   ↓
Result
   ↓
Reassessment / Upgrade
   ↓
Additional Tests
   ↓
Profiling
```

Minimum scenarios:

### Scenario A --- Single Test

``` text
Rp99k
↓
Choose one test
↓
Assessment
↓
Result
```

### Scenario B --- All Tests

``` text
Rp199k
↓
IQ
EQ
DISC
RIASEC
↓
Results
```

### Scenario C --- All Tests + Profiling

``` text
Rp249k
↓
All Tests
↓
All Results
↓
Cross-Test Profile
```

### Scenario D --- Reassessment

``` text
Existing Test
↓
Rp49k Credit
↓
New Attempt
↓
New Official Result
```

### Scenario E --- Upgrade

``` text
99 → 199
99 → 249
199 → 249
```

------------------------------------------------------------------------

# 21. V6 --- L12 LAUNCH QA

Launch QA harus memverifikasi:

## Functional

-   account/access;
-   commercial entitlement;
-   Scalev handoff;
-   assessment start;
-   question delivery;
-   response persistence;
-   submit;
-   scoring;
-   result;
-   reassessment;
-   upgrade;
-   profiling.

## Integration

-   transaction mapping;
-   entitlement provisioning;
-   duplicate transaction protection;
-   idempotency;
-   failure handling;
-   deep link;
-   return flow.

## Technical

``` text
pnpm typecheck
pnpm build
relevant gates
pnpm e2e:riasec
database/migration checks
release/hardening checks
```

Command aktual harus mengikuti command yang benar-benar tersedia pada
application source.

Jangan mengarang command.

------------------------------------------------------------------------

# 22. FULL ZIP DEVELOPMENT RULE

Ini adalah aturan operasional utama.

## User workflow

User hanya melakukan:

``` text
1. Berikan full ZIP aplikasi existing
2. Berikan .md/source-of-truth yang relevan
```

Kemudian:

``` text
AI
 ↓
Analyze existing ZIP
 ↓
Reconcile against documentation
 ↓
Implement required scope
 ↓
Validate source
 ↓
Produce FULL ZIP
 ↓
User extracts/runs terminal
 ↓
User reports output
```

## User tidak melakukan manual patch

Tidak boleh memberikan instruksi seperti:

``` text
Buka file X
Cari line Y
Ganti kode Z
```

sebagai requirement implementation.

Jika perubahan diperlukan, perubahan tersebut harus sudah berada di full
ZIP yang diberikan kembali.

------------------------------------------------------------------------

# 23. FULL ZIP ANALYSIS RULE

Setiap menerima full ZIP existing:

``` text
ZIP
 ↓
Inspect project structure
 ↓
Inspect package configuration
 ↓
Inspect Prisma/schema
 ↓
Inspect migrations
 ↓
Inspect runtime
 ↓
Inspect routes
 ↓
Inspect assessment engine
 ↓
Inspect scoring
 ↓
Inspect result
 ↓
Inspect tests/gates
 ↓
Reconcile against source-of-truth
 ↓
Implement
 ↓
Validate
 ↓
Generate full ZIP
```

Jangan mengasumsikan path, model, field, command, atau architecture
hanya berdasarkan dokumentasi.

Actual source tetap harus diperiksa.

------------------------------------------------------------------------

# 24. ZIP OUTPUT RULE

Setiap implementation ZIP harus:

1.  menggunakan latest existing application sebagai baseline;
2.  mempertahankan frozen architecture;
3.  hanya mengubah scope yang diperlukan;
4.  mempertahankan existing functionality;
5.  mempertahankan regression wiring;
6.  memastikan TypeScript compatibility;
7.  memastikan build compatibility;
8.  memastikan relevant gate tersedia;
9.  memastikan database/migration consistency;
10. tidak menghapus existing documentation;
11. tidak melakukan destructive replacement yang tidak diperlukan.

Output harus berupa **full application ZIP**, bukan patch ZIP parsial.

------------------------------------------------------------------------

# 25. DOCUMENTATION FOLDER RULE

## NON-NEGOTIABLE

Jangan membuat folder:

``` text
docs/
```

di dalam implementation ZIP baru.

Alasannya:

Existing application mungkin sudah memiliki:

``` text
docs/
```

dan replacement dapat berisiko menimpa/mengacaukan dokumentasi existing.

## Allowed

Dokumentasi baru boleh ditempatkan dalam folder version-specific:

``` text
V4/
```

atau:

``` text
V5/
```

atau:

``` text
V6/
```

Contoh:

``` text
V4/
├── README.md
├── V4_LAUNCH_SCOPE.md
└── V4_CHANGELOG.md
```

User kemudian akan memindahkan dokumentasi tersebut ke `docs/` secara
manual jika diperlukan.

Tidak boleh membuat:

``` text
docs/
```

baru hanya untuk menaruh dokumentasi.

------------------------------------------------------------------------

# 26. DOCUMENT PRESERVATION RULE

ZIP baru tidak boleh:

-   menghapus documentation existing;
-   mengganti `docs/` existing;
-   mengganti source-of-truth lama tanpa instruksi eksplisit;
-   menghapus historical phase documentation;
-   menghapus test/gate documentation.

Jika diperlukan dokumentasi tambahan:

``` text
V4/
V5/
V6/
```

menjadi tempat yang aman.

------------------------------------------------------------------------

# 27. NO MANUAL PATCH PRINCIPLE

Jika implementation menghasilkan error setelah user menjalankan:

``` text
typecheck
build
gate
deploy
```

maka workflow:

``` text
USER
 ↓
send terminal output
 ↓
AI analyzes error
 ↓
AI updates FULL SOURCE
 ↓
AI returns NEW FULL ZIP
 ↓
USER replaces/runs again
```

Bukan:

``` text
USER
 ↓
manually edit source
```

Manual patch bukan bagian dari operating model ReadyScore V4--V6.

------------------------------------------------------------------------

# 28. VALIDATION RESPONSIBILITY

AI bertanggung jawab memastikan sebelum memberikan ZIP bahwa perubahan
telah dianalisis terhadap:

``` text
Architecture
Specification
Actual Source
Database Contract
Frozen Runtime
Regression
```

User bertanggung jawab menjalankan environment-specific commands yang
tersedia di local environment, termasuk bila diperlukan:

``` text
typecheck
build
deploy
gate
E2E
migration verification
```

Output terminal dari user kemudian menjadi evidence untuk iteration
berikutnya.

------------------------------------------------------------------------

# 29. RECONCILIATION REPORT

Setiap implementation/replacement review harus menggunakan struktur:

``` text
=== READY SCORE V4–V6 RECONCILIATION ===

Version:
    V4 / V5 / V6

Layer:
    Lx

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

Frozen RIASEC Runtime:
    PASS / REGRESSION

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
    <exact command / next scope>
```

Jika ada conflict:

``` text
CONFLICT
↓
STOP
↓
IDENTIFY
↓
DOCUMENT
↓
DECIDE
↓
IMPLEMENT
```

------------------------------------------------------------------------

# 30. VERSION TRANSITION RULE

Tidak boleh lompat versi tanpa exit criteria.

``` text
V4
 ↓
V4 EXIT GATE
 ↓
V5
 ↓
V5 EXIT GATE
 ↓
V6
 ↓
V6 LAUNCH GATE
```

## V4 → V5

Harus tersedia:

``` text
Commercial
Scalev
RIASEC
DISC
EQ
Cognitive
Result Experience
```

## V5 → V6

Harus tersedia:

``` text
Reassessment
Upgrade
Cross-Test Profiling
```

## V6 → Launch

Harus tersedia:

``` text
Paid Customer E2E
Launch QA
```

------------------------------------------------------------------------

# 31. SCOPE DISCIPLINE

Selama V4--V6 development:

> Jangan menambahkan pekerjaan hanya karena pekerjaan tersebut menarik
> atau secara arsitektural memungkinkan.

Pertanyaan utama:

``` text
Apakah pekerjaan ini termasuk L1–L7?
    → V4

Apakah pekerjaan ini termasuk L8–L10?
    → V5

Apakah pekerjaan ini termasuk L11–L12?
    → V6

Jika tidak:
    → OUT OF SCOPE
```

Out-of-scope work tidak dimasukkan ke implementation tanpa keputusan
eksplisit.

------------------------------------------------------------------------

# 32. MEASUREMENT GOVERNANCE TETAP BERLAKU

V4--V6 tidak mengubah prinsip measurement V3.

Tetap berlaku:

``` text
Construct
 ↓
Instrument
 ↓
Dimension
 ↓
Indicator
 ↓
Item
 ↓
Response
 ↓
Raw Score
 ↓
Scale Score
 ↓
Profile
 ↓
Interpretation
```

0--100 adalah presentation scale.

Tidak boleh:

``` text
0–100
↓
otomatis 0–100% ability
```

Tidak boleh membuat universal overall score dengan raw averaging
heterogeneous assessments.

Cross-Test Profile tetap merupakan synthesis.

------------------------------------------------------------------------

# 33. RECOMMENDATION GOVERNANCE TETAP BERLAKU

Urutan:

``` text
MEASUREMENT
    ↓
PROFILE
    ↓
STUDY DIRECTION
    ↓
MAJOR FIT
    ↓
CAREER EXPLORATION
```

Tidak boleh:

``` text
RIASEC
 ↓
Major
```

atau:

``` text
One Test
 ↓
Career
```

secara deterministic.

Allowed:

``` text
Strong fit
Potential fit
Worth exploring
Areas to strengthen
Potential challenge
Suggested exploration
```

------------------------------------------------------------------------

# 34. IMMUTABILITY OF ASSESSMENT HISTORY

Assessment attempt adalah measurement event.

Tidak boleh:

``` text
Old Result
   ↓
overwrite
```

Model:

``` text
User
 ↓
Test Access
 ↓
Attempt #1
 └── Result Snapshot #1
 ↓
Attempt #2
 └── Result Snapshot #2
 ↓
Attempt #3
 └── Result Snapshot #3
```

Ini menjadi foundation V5 reassessment.

------------------------------------------------------------------------

# 35. FINAL OPERATING MODEL

Development ReadyScore V4--V6 harus selalu mengikuti:

``` text
USER PROVIDES
    │
    ├── Full Existing Application ZIP
    └── Relevant .md / Source of Truth
            │
            ▼
       AI ANALYSIS
            │
            ▼
      SOURCE RECONCILIATION
            │
            ▼
        IMPLEMENTATION
            │
            ▼
      INTERNAL VALIDATION
            │
            ▼
      FULL APPLICATION ZIP
            │
            ▼
      USER RUNS TERMINAL
            │
            ├── typecheck
            ├── build
            ├── gate
            ├── deploy
            └── E2E
            │
            ▼
       TERMINAL OUTPUT
            │
            ▼
       NEXT ITERATION
```

Tidak ada manual patch sebagai bagian dari workflow normal.

------------------------------------------------------------------------

# 36. CANONICAL V4--V6 MAP

``` text
READY SCORE
│
├── V4 — CORE PRODUCT
│   │
│   ├── L1 Commercial Runtime
│   ├── L2 Scalev Integration
│   ├── L3 RIASEC Productization
│   ├── L4 DISC MVP
│   ├── L5 EQ MVP
│   ├── L6 Cognitive MVP
│   └── L7 Result Experience
│
├── V5 — RETEST / CONVERSION / PROFILING
│   │
│   ├── L8 Reassessment
│   ├── L9 Upgrade & Conversion
│   └── L10 Cross-Test Profiling
│
└── V6 — LAUNCH
    │
    ├── L11 Paid Customer E2E
    └── L12 Launch QA
```

------------------------------------------------------------------------

# 37. NON-NEGOTIABLE RULES

1.  **Full ZIP in → Full ZIP out.**
2.  Tidak ada manual patch sebagai workflow normal.
3.  Existing application menjadi baseline implementation.
4.  Source of Truth menjadi architectural reference.
5.  Actual source harus diperiksa sebelum membuat perubahan.
6.  Frozen V3 architecture tidak boleh dibuka kembali tanpa
    evidence/decision.
7.  F.10-C.2-F RIASEC tetap regression baseline.
8.  V4 hanya L1--L7.
9.  V5 hanya L8--L10.
10. V6 hanya L11--L12.
11. Tidak membuat phase baru di luar V4--V6 tanpa keputusan eksplisit.
12. Jangan membuat folder `docs/` baru di implementation ZIP.
13. Dokumentasi tambahan ditempatkan pada folder `V4/`, `V5/`, atau
    `V6/`.
14. Jangan menghapus atau menimpa dokumentasi existing.
15. Setiap material change harus direconcile.
16. Setiap ZIP baru harus dapat menjadi full replacement baseline.
17. Tidak mengarang path, field, command, migration, atau architecture.
18. Tidak menggunakan successful runtime sebagai bukti psychometric
    validity.
19. Tidak melakukan raw average antar heterogeneous assessment.
20. Tidak membuat deterministic educational/career claims tanpa
    evidence.
21. Assessment attempt harus immutable.
22. Retest bukan retry.
23. Commercial entitlement tidak boleh mengubah measurement semantics.
24. Setiap version harus melewati exit gate sebelum pindah ke version
    berikutnya.

------------------------------------------------------------------------

# 38. FINAL DEVELOPMENT CONTRACT

Mulai development ReadyScore setelah dokumen ini ditetapkan:

``` text
V4
L1 → L7
     ↓
CORE CUSTOMER PRODUCT

V5
L8 → L10
     ↓
RETENTION / MONETIZATION / PROFILING

V6
L11 → L12
     ↓
PAID E2E / LAUNCH
```

Tidak keluar dari scope tersebut.

Setiap development iteration mengikuti kontrak:

``` text
FULL ZIP EXISTING
        +
RELEVANT .MD
        ↓
ANALYSIS
        ↓
RECONCILIATION
        ↓
IMPLEMENTATION
        ↓
FULL ZIP OUTPUT
        ↓
USER TERMINAL VALIDATION
        ↓
ITERATION
```

**Tidak ada manual edit source sebagai requirement implementation.**

------------------------------------------------------------------------

# STATUS

``` text
READY SCORE V4–V6 DEVELOPMENT CONTROL

V3 Architecture:
    FROZEN

RIASEC F.10-C.2-F:
    PASS

V4:
    L1–L7
    LOCKED SCOPE

V5:
    L8–L10
    LOCKED SCOPE

V6:
    L11–L12
    LOCKED SCOPE

Manual Source Patch:
    NOT ALLOWED AS NORMAL WORKFLOW

Implementation Input:
    FULL EXISTING ZIP + RELEVANT .MD

Implementation Output:
    FULL APPLICATION ZIP

Documentation Folder:
    DO NOT CREATE / REPLACE docs/

Version Documentation:
    V4/ or V5/ or V6/

Primary Development Objective:
    LAUNCH-READY READYSCORE
```

# END
