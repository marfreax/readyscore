# ReadyScore V8–V9 Development Reference
## Assessment Instrument Audit → Customer Experience & Question Bank Redesign

**Document status:** MASTER REFERENCE / DEVELOPMENT BASELINE  
**Created:** 2026-08-29  
**Product:** ReadyScore  
**Baseline:** V7 Final / L20 Full Product Regression QA PASS  
**Next:** V8.0 Assessment Instrument Audit  
**Then:** V8 customer-result architecture as informed by audit  
**V9:** Customer UI + Question Bank implementation changes

---

# 1. PURPOSE

Dokumen ini menjadi acuan utama pengembangan ReadyScore setelah V7 Final.

V7/L20 telah diposisikan sebagai frozen baseline. V8 tidak boleh langsung mengubah customer UI atau question bank sebelum dilakukan audit terhadap instrumen assessment.

Urutan prinsip:

```text
V7 FINAL / FROZEN
        ↓
V8.0 ASSESSMENT INSTRUMENT AUDIT
        ↓
AUDIT FINDINGS
        ↓
DESIGN DECISIONS
        ↓
V8 CUSTOMER RESULT / ASSESSMENT ARCHITECTURE
        ↓
V9 CUSTOMER UI + QUESTION BANK
```

Tujuan utamanya adalah memastikan:

> **Apa yang diukur → bagaimana diukur → bagaimana dinilai → bagaimana hasil dijelaskan → bagaimana hasil disajikan kepada user**

merupakan satu rantai yang konsisten.

---

# 2. V7 BASELINE

V7/L20 adalah baseline engineering yang telah melalui regression QA.

Baseline mempertahankan:

- authentication and access
- customer shell
- assessment flow
- scoring/runtime
- result
- reassessment
- commercial/entitlement
- Scalev boundary
- cross-test profiling
- admin
- institution boundary
- accessibility baseline
- regression safety

V7 juga menetapkan bahwa measurement architecture tidak boleh diubah hanya untuk mempermudah UI.

Core architectural principles yang dibawa ke V8/V9:

```text
Measurement Is Frozen
Product and Measurement Remain Separate
Question Identity Is Version-Safe
Historical Assessment Content Is Immutable
No Universal Score
No Raw-Average Synthesis
```

Namun, V8.0 secara eksplisit membuka **audit substantif** terhadap instrumen dan scoring yang sudah ada.

Audit bukan berarti perubahan otomatis.

Setiap existing component harus dikategorikan:

```text
KEEP
REFINE
REDESIGN
REPLACE
```

---

# 3. FUNDAMENTAL V8 DECISION

## 3.1 V8.0 adalah Assessment Instrument Audit

V8.0 bukan UI makeover.

V8.0 bukan langsung membuat question bank baru.

V8.0 adalah audit untuk menjawab:

> **Apakah setiap assessment ReadyScore menggunakan metode pengukuran yang sesuai dengan konstruk yang diklaimnya?**

Assessment yang diaudit:

1. Cognitive / IQ
2. Emotional Intelligence / EQ
3. DISC
4. RIASEC

---

# 4. AUDIT FRAMEWORK

Setiap assessment wajib diperiksa melalui rantai berikut:

```text
CONSTRUCT
   ↓
INTENDED USE
   ↓
ITEM BLUEPRINT
   ↓
QUESTION FORMAT
   ↓
RESPONSE MODEL
   ↓
SCORING RULE
   ↓
DIMENSION SCORE
   ↓
OVERALL / PROFILE
   ↓
CLASSIFICATION
   ↓
INTERPRETATION
   ↓
CUSTOMER RESULT
```

Tidak boleh hanya mengaudit scoring code.

---

# 5. AUDIT QUESTIONS

Untuk setiap assessment, jawab secara eksplisit:

### A. Construct

- Apa konstruk yang dimaksud?
- Apa yang sebenarnya diukur?
- Apakah konstruk sesuai dengan nama produk?

### B. Intended use

- Untuk tujuan apa assessment digunakan?
- Apa yang boleh disimpulkan dari hasil?
- Apa yang tidak boleh disimpulkan?

### C. Item design

- Apa jenis stimulus?
- Mengapa stimulus tersebut relevan?
- Apakah item merepresentasikan konstruk?
- Apakah item terlalu mudah ditebak?
- Apakah item terlalu transparan?

### D. Response model

- Apakah user memilih jawaban benar/salah?
- Apakah Likert/self-report?
- Apakah forced-choice?
- Apakah situational judgment?
- Apakah image/pattern choice?
- Apakah response model sesuai dengan konstruk?

### E. Scoring

- Bagaimana respons dikonversi menjadi score?
- Apakah ada reverse scoring?
- Apakah semua item berbobot sama?
- Apakah ada dimension weighting?
- Bagaimana missing/invalid response ditangani?
- Bagaimana tie ditangani?
- Bagaimana score range ditentukan?

### F. Result

- Apa score utama?
- Apa dimension scores?
- Bagaimana kategori ditentukan?
- Apa interpretation?
- Apakah interpretation benar-benar didukung oleh measurement?

### G. Customer claim

- Apakah nama assessment akurat?
- Apakah copy customer-facing melebih-lebihkan kemampuan assessment?
- Apakah istilah seperti "IQ", "EQ", "personality", "behavior", atau "interest" digunakan secara tepat?

---

# 6. COGNITIVE / IQ AUDIT

## 6.1 Red Flag yang Harus Diverifikasi

Jika item Cognitive saat ini berbentuk:

```text
Pernyataan
↓
Setuju / Tidak Setuju
```

maka harus diaudit secara serius.

Self-report agreement terhadap pernyataan tentang diri sendiri tidak otomatis mengukur cognitive ability.

Contoh:

```text
"Saya suka memecahkan masalah."
```

tidak sama dengan:

```text
"2, 6, 12, 20, 30, ?"
```

atau:

```text
problem / pattern
↓
multiple-choice answer
↓
correct / incorrect
```

Perbedaan:

```text
PREFERENCE / SELF-PERCEPTION
        ≠
COGNITIVE PERFORMANCE
```

## 6.2 Hal yang harus diputuskan

Apakah ReadyScore Cognitive:

### Option A — Cognitive Ability Assessment

Jika demikian, item harus menguji kemampuan melalui task yang memiliki objective response.

Candidate domains harus ditentukan dari blueprint, misalnya:

- verbal reasoning
- numerical reasoning
- logical reasoning
- abstract/pattern reasoning

Tidak boleh menambahkan domain hanya karena terlihat menarik; blueprint harus menjadi keputusan formal V8.0.

### Option B — Cognitive Self-Profile

Jika instrument ternyata self-report, maka positioning customer-facing harus disesuaikan dan tidak boleh secara otomatis disebut IQ.

## 6.3 IQ Terminology

Jangan mengubah:

```text
Cognitive Score
```

menjadi:

```text
IQ
```

hanya karena user mengharapkan angka IQ.

Audit harus membuktikan:

- score scale
- norm/reference
- calculation
- interpretation

sebelum istilah IQ digunakan sebagai psychometric claim.

---

# 7. EQ / EMOTIONAL INTELLIGENCE AUDIT

EQ tidak harus menggunakan objective right/wrong seperti Cognitive.

Namun response model harus jelas.

Possible measurement families yang perlu diaudit:

```text
SELF-REPORT
        +
/ atau
SITUATIONAL JUDGMENT
```

## 7.1 Self-report

Contoh:

```text
"Saya mampu tetap tenang ketika menghadapi konflik."
```

dapat menggunakan response scale yang sesuai.

Namun self-perception harus dibedakan dari demonstrated ability.

## 7.2 Situational Judgment

Contoh:

```text
Anda sedang menghadapi konflik dengan anggota tim.
Apa respons yang paling tepat?
```

dapat menggunakan multiple-choice dengan keyed/scored responses.

## 7.3 Audit Decision

V8.0 harus menentukan secara eksplisit:

- apakah EQ self-report;
- situational judgment;
- kombinasi;
- atau model lain yang dapat dipertanggungjawabkan.

Tidak boleh mencampurkan model secara informal.

---

# 8. DISC AUDIT

DISC mengukur behavioral tendency/profile, bukan kemampuan benar/salah.

Format statement/self-report dapat digunakan.

Namun V8.0 harus mengevaluasi apakah model saat ini cukup baik.

## 8.1 Candidate Direction

Model situational forced-choice dapat menjadi kandidat redesign.

Contoh:

```text
Jika kamu melihat kecelakaan di jalan,
mana yang paling mewakili diri kamu?

A. Mengambil inisiatif mengatur kondisi
B. Membuat suasana lebih tenang/normal
C. Meredakan ketegangan
D. Mengamati dan memahami alur kejadian
```

Internal metadata dapat memetakan:

```text
A → D
B → I
C → S
D → C
```

Namun label D/I/S/C tidak perlu ditampilkan kepada peserta.

## 8.2 Required Audit

Jika forced-choice dipilih:

- seluruh opsi harus sama-sama plausible;
- opsi tidak boleh terlalu transparan;
- mapping D/I/S/C harus dapat divariasikan antar item;
- posisi A/B/C/D tidak boleh selalu berarti D/I/S/C;
- scoring dan tie handling harus formal;
- blueprint harus menjelaskan coverage setiap dimension.

Forced-choice adalah kandidat desain, bukan keputusan final sebelum audit.

---

# 9. RIASEC AUDIT

RIASEC secara konsep berbeda dari Cognitive.

RIASEC mengukur interest/preference.

Karena itu format seperti:

```text
"Saya tertarik melakukan aktivitas X."
```

dengan response preference dapat sesuai.

Baseline V7 memiliki:

```text
60 questions
10 R
10 I
10 A
10 S
10 E
10 C
```

dan menghasilkan:

```text
6 dimensions
+
topCode
```

Baseline runtime tersebut harus dipertahankan sebagai evidence sampai V8.0 memutuskan apakah instrument perlu redesign.

## 9.1 Audit Required

- apakah item benar-benar merepresentasikan interest;
- apakah wording bebas dari ability/personality contamination;
- apakah enam dimension coverage seimbang;
- apakah scoring benar-benar merepresentasikan preference;
- apakah topCode/tie handling benar;
- apakah interpretation sesuai dengan interest profile;
- apakah customer-facing copy menghindari klaim "pekerjaan yang pasti cocok".

---

# 10. COMPARATIVE MODEL

Keempat assessment tidak boleh dipaksa menggunakan format yang sama.

Target architecture:

```text
                         QUESTION ENGINE
                               │
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
     RIASEC                  DISC                    EQ                 Cognitive
        │                      │                      │                    │
     Interest              Behavior              Emotional            Cognitive
     Profile               Profile              Construct             Ability*
        │                      │                      │                    │
  preference              self-report /        self-report /        objective
                          forced-choice        SJT / hybrid          task*
```

`*` ditentukan oleh V8.0 audit.

Unified question-bank administration is only an administrative shell. It must not force identical measurement structures.

---

# 11. QUESTION TYPE ARCHITECTURE

V8/V9 should support assessment-specific question types where justified.

Candidate types:

```text
LIKERT
SINGLE_CHOICE
FORCED_CHOICE
SCENARIO
IMAGE_CHOICE
PATTERN
NUMERICAL
TEXT_STIMULUS
```

These are candidate capabilities, not a requirement to implement every type.

The final set must follow V8.0 instrument decisions.

---

# 12. SCORING ARCHITECTURE

Scoring must be explicit per assessment.

General model:

```text
QUESTION RESPONSE
       ↓
ITEM SCORING
       ↓
DIMENSION AGGREGATION
       ↓
OVERALL / PROFILE RULE
       ↓
CLASSIFICATION
       ↓
INTERPRETATION
```

Do not assume:

```text
highest raw total = correct final result
```

without a documented measurement rationale.

Every assessment must have:

- scoring version
- item-to-dimension mapping
- scoring rules
- reverse-key rules where applicable
- normalization/scale rules where applicable
- tie handling
- classification rules
- interpretation rules

---

# 13. RESULT SEMANTICS

V8 should make the customer-facing result hierarchy explicit.

Recommended conceptual hierarchy:

```text
RESULT
│
├── Main Result
│
├── Dimension Profile
│
├── Interpretation
│
└── Detailed Explanation
```

But each assessment can have a different result structure.

## Cognitive

Potential structure:

```text
Main Cognitive Score
        ↓
Cognitive Dimensions
        ↓
Interpretation
        ↓
Detailed explanation
```

Do not call the main score "IQ" unless the audit supports that terminology.

## EQ

Potential structure:

```text
Overall EQ / defined result
        ↓
EQ Dimensions
        ↓
Interpretation
        ↓
Detailed explanation
```

The exact terminology must follow V8.0.

## DISC

Potential structure:

```text
Primary Style
        ↓
Secondary Style
        ↓
D/I/S/C Profile
        ↓
Behavioral Interpretation
```

## RIASEC

Potential structure:

```text
Six Interest Dimensions
        ↓
Top Code
        ↓
Interest Interpretation
```

---

# 14. PROFILE VS RESULT

These must remain separate.

```text
INDIVIDUAL RESULT
        ↓
assessment-specific
        ↓
score/profile/interpretation

CROSS-TEST PROFILE
        ↓
multi-assessment synthesis
        ↓
radar/spider visualization
```

Cross-test profiling must not create:

```text
Universal Score
```

or:

```text
Raw Average of unrelated tests
```

The future Profile radar should visualize meaningful domains without implying that unrelated test scores are directly interchangeable.

---

# 15. CUSTOMER EXPERIENCE PRINCIPLES

Once V8.0 establishes the instrument semantics, customer UX can be designed around them.

Recommended journey:

```text
ASSESSMENTS
     ↓
ASSESSMENT CARD
     ↓
ABOUT ASSESSMENT
     ↓
PRE-TEST
     ↓
TEST
     ↓
RESULT
     ↓
PROFILE / REPORT / NEXT ACTION
```

## Assessment Card

Should answer:

- what this assessment is;
- what it measures;
- why take it;
- what user gets;
- duration;
- question count;
- access state.

## About Assessment

Provides deeper explanation without overloading the catalog.

## Pre-Test

Should explain:

- purpose;
- what will be measured;
- what user should expect;
- response method;
- duration;
- question count;
- preparation/instructions.

## Test

Must reflect the correct response model for that assessment.

## Result

Must answer:

1. What is my result?
2. What does it mean?
3. What contributes to it?
4. What should I do next?

---

# 16. PROFILE REDESIGN DIRECTION

The previously identified desired direction is:

```text
ABILITY
EMOTIONAL
BEHAVIOR
INTEREST
...
```

presented as a visual radar/spider profile.

The intended interaction:

```text
SPIDER / RADAR
       ↓
click domain
       ↓
domain detail
       ↓
score
       ↓
description
       ↓
interpretation
```

This is a V9/customer experience direction and must be derived from V8.0 measurement decisions.

No universal score should be introduced merely to make the radar easier to render.

---

# 17. V8.0 AUDIT DELIVERABLES

V8.0 is complete only when each assessment has an approved audit record.

Required output per assessment:

```text
1. Construct Definition
2. Intended Use
3. Item Blueprint
4. Response Model
5. Question Type
6. Dimension Mapping
7. Scoring Model
8. Overall/Profile Rule
9. Classification Rule
10. Interpretation Rule
11. Customer Terminology
12. Known Limitations
13. KEEP / REFINE / REDESIGN / REPLACE decision
14. Regression Impact
```

---

# 18. V8.0 DECISION MATRIX

| Assessment | Primary Audit Concern | Initial Direction | Final Decision |
|---|---|---|---|
| Cognitive / IQ | Ability vs self-report; score terminology | Objective task candidate | TBD |
| EQ | Self-report vs SJT; overall semantics | Explicit response-model decision | TBD |
| DISC | Behavioral measurement quality | Situational forced-choice candidate | TBD |
| RIASEC | Interest measurement and topCode | Existing model candidate | TBD |

No final redesign decision should be inferred from this table.

---

# 19. V9 SCOPE

V9 begins only after V8.0 decisions are locked.

V9 focus:

### A. Customer UI

- assessment catalog
- assessment explanation
- pre-test
- test runtime
- result
- profile
- reports
- activity
- access & plans
- responsive/mobile
- accessibility
- language consistency

### B. Question Bank

- new question types
- assessment-specific item formats
- item metadata
- dimension mapping
- answer/key metadata
- versioning
- activation/review workflow
- immutable historical versions

### C. Assessment Engine

Only where required by V8.0:

- response handling
- item scoring
- dimension aggregation
- classification
- interpretation
- assessment-specific result rendering

---

# 20. V9 IMPLEMENTATION SAFETY

Any change to measurement must be versioned.

Existing principle:

```text
Question
    =
stable logical identity

QuestionVersion
    =
immutable assessment-facing version
```

If a question or scoring rule changes materially:

```text
OLD VERSION
     ≠
NEW VERSION
```

Do not silently mutate historical assessment content.

Assessment snapshots must preserve relevant configuration/version boundaries.

---

# 21. REGRESSION REQUIREMENTS

V9 changes must preserve the V7 baseline unless a deliberate measurement redesign is approved.

At minimum, regression must verify:

```text
Authentication
Customer access
Entitlement
Assessment start
Question selection
Answer persistence
Submit
Scoring
Result ownership
Result semantics
Reassessment
Commercial flow
Scalev boundary
Cross-test profiling
Admin
Institution boundary
Security
Accessibility
```

For changed assessment instruments, dedicated measurement regression must also verify:

```text
Question → response
response → item score
item score → dimension
dimension → result
result → interpretation
```

---

# 22. NON-NEGOTIABLE RULES

## Rule 1
Do not optimize measurement for UI convenience.

## Rule 2
Do not make all four assessments use the same question format.

## Rule 3
Do not call a self-report cognitive questionnaire an IQ test without supporting measurement justification.

## Rule 4
Do not equate a generated number with a psychometric score without defining its scale and meaning.

## Rule 5
Do not create a universal score across RIASEC, DISC, EQ, and Cognitive.

## Rule 6
Do not average unrelated assessment scores into a customer-facing overall score.

## Rule 7
Do not expose internal scoring metadata to customers.

## Rule 8
Do not silently overwrite historical question versions.

## Rule 9
Do not change scoring semantics without versioning and regression.

## Rule 10
Do not let attractive UI determine what an assessment claims to measure.

---

# 23. DEVELOPMENT ORDER

```text
V7 FINAL
   │
   ▼
V8.0 Assessment Instrument Audit
   │
   ├── Cognitive / IQ
   ├── EQ
   ├── DISC
   └── RIASEC
   │
   ▼
Measurement Decisions
   │
   ▼
Assessment Specification
   │
   ▼
Customer Result Architecture
   │
   ▼
V9
   │
   ├── Customer UI
   ├── Pre-Test
   ├── Test Runtime
   ├── Result
   ├── Profile
   ├── Question Bank
   └── Engine changes required by audit
```

---

# 24. CURRENT V8/V9 STATUS

As of 2026-08-29:

```text
V7 FINAL
    PASS

V8.0
    NEXT: ASSESSMENT INSTRUMENT AUDIT

V9
    BLOCKED UNTIL V8.0 DECISIONS ARE LOCKED
```

The purpose of this gate is deliberate:

> **We will not improve the appearance of an assessment before we are confident that the assessment itself is measuring and reporting the intended construct correctly.**

---

# 25. FINAL PRINCIPLE

ReadyScore should not merely produce:

```text
ANSWER
   ↓
NUMBER
```

It should produce a defensible chain:

```text
USER RESPONSE
      ↓
MEASUREMENT
      ↓
SCORING
      ↓
RESULT
      ↓
INTERPRETATION
      ↓
UNDERSTANDING
```

The customer should ultimately understand:

> **"Apa yang diukur, bagaimana hasil saya diperoleh, apa artinya tentang saya, dan apa yang dapat saya lakukan dengan informasi tersebut."**

That is the core objective of V8.0 and the foundation for V9.

# ReadyScore V8 — Phase Plan
V8.0  Assessment Instrument Audit
          ↓
V8.1  Measurement Specification Lock
          ↓
V8.2  Question & Scoring Architecture
          ↓
V8.3  Cognitive/IQ Instrument
          ↓
V8.4  EQ Instrument
          ↓
V8.5  DISC Instrument
          ↓
V8.6  RIASEC Instrument
          ↓
V8.7  Unified Assessment Engine Adaptation
          ↓
V8.8  Result Semantics & Interpretation
          ↓
V8.9  Assessment UX Specification
          ↓
V8.10 Customer Assessment Experience
          ↓
V8.11 Customer Result & Profile Experience
          ↓
V8.12 Full Customer Regression
          ↓
V8.13 V8 Final Acceptance / Freeze