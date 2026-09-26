# ReadyScore — Question Architecture Completion
## Architecture, Specification, Kaidah, dan Urutan Phase 17.9+

**Status:** Development Baseline / Architecture Lock Candidate  
**Audit basis:** `AppRS-v17.8(1).zip`  
**Audit date:** 2026-09-24  
**Current application baseline:** ReadyScore V17.8 source baseline  
**Purpose:** Menyelesaikan alignment arsitektur Question/Assessment Configuration sebelum melanjutkan AI Career Advisor.

---

# 1. Executive Summary

Audit terhadap source code V17.8 menunjukkan bahwa ReadyScore **sudah memiliki fondasi Question Architecture yang cukup lengkap**, bukan sistem question yang harus dibangun dari nol.

Fondasi yang sudah ada:

- `Question` sebagai stable logical identity.
- `QuestionVersion` sebagai immutable assessment-facing version.
- lifecycle question melalui `status` dan `mappingStatus`.
- `QuestionPackage`, `QuestionPackageVersion`, dan `QuestionPackageCompositionRule`.
- `AssessmentConfiguration` dan `AssessmentConfigurationVersion`.
- `AssessmentAttempt` sudah menyimpan configuration/version/scoring/question-bank metadata.
- selected `QuestionVersion` IDs sudah disimpan dalam assessment snapshot.
- Admin Question Bank, Review/Publishing, Question Package, dan Assessment Configuration sudah tersedia.
- runtime package selection sudah menggunakan database `QuestionPackageVersion` untuk RIASEC, DISC, EQ, dan Cognitive.

Namun audit juga menemukan **dua lapisan runtime configuration yang belum sepenuhnya menjadi satu source of truth**:

```text
DATABASE GOVERNANCE
AssessmentConfigurationVersion
QuestionPackageVersion
QuestionVersion
        │
        │
        X   ← belum sepenuhnya menjadi canonical runtime authority
        │
        ▼
STATIC RUNTIME CONFIG
lib/assessment-config.ts
```

`lib/assessment-config.ts` masih menjadi authority runtime untuk:

- assessment configuration ID/version;
- question count;
- scoring version;
- selection algorithm version;
- published status.

Selain itu, `question-engine.ts` masih menyimpan beberapa selection rule hardcoded, terutama untuk:

- RIASEC;
- DISC;
- EQ;
- Cognitive;
- Free RIASEC;
- Premium.

`question-package-runtime.ts` juga masih membandingkan package terhadap nilai hardcoded dari `ASSESSMENT_CONFIG`, termasuk question count, scoring version, dan production timer.

**Kesimpulan audit:**

> ReadyScore tidak membutuhkan Question Architecture baru dari nol. ReadyScore membutuhkan **completion/alignment** agar database governance, question package, assessment configuration, selection runtime, scoring metadata, dan attempt snapshot menjadi satu rantai canonical.

---

# 2. Current State Audit

## 2.1 Question Identity — EXISTING / GOOD

Model yang sudah ada:

```text
Question
  ├── id
  ├── code
  └── versions[]

QuestionVersion
  ├── questionId
  ├── testTypeId
  ├── taxonomyVersion
  ├── version
  ├── text
  ├── domain
  ├── subdomain
  ├── indicator
  ├── answerType
  ├── scoringKey
  ├── difficulty
  ├── status
  └── mappingStatus
```

Prinsip ini dipertahankan.

Tidak boleh dilakukan rewrite terhadap identity model.

---

## 2.2 Question Version Lifecycle — EXISTING / KEEP

`QuestionVersion` sudah menyediakan lifecycle governance:

```text
DRAFT
  ↓
VALIDATED / REVIEW_REQUIRED
  ↓
APPROVED
  ↓
PUBLISHED
  ↓
ARCHIVED
```

Runtime mengambil published + approved content.

**Keputusan:**

QuestionVersion tetap menjadi source of truth untuk content question.

---

## 2.3 Question Package — EXISTING / PARTIALLY CANONICAL

Database sudah memiliki:

```text
QuestionPackage
QuestionPackageVersion
QuestionPackageCompositionRule
```

Dengan:

- `totalQuestions`
- `timeLimitSeconds`
- `taxonomyVersionId`
- `status`
- composition rules
- required count per taxonomy node.

Runtime package selection sudah aktif untuk:

```text
RIASEC
DISC
EQ
COGNITIVE
```

dan menggunakan database package + composition rules.

Ini adalah fondasi yang benar dan harus dipertahankan.

---

## 2.4 Assessment Configuration — EXISTING / GOVERNANCE ONLY

Database sudah memiliki:

```text
AssessmentConfiguration
AssessmentConfigurationVersion
```

Version menyimpan:

```text
questionBankVersion
taxonomyVersion
scoringVersion
selectionAlgorithmVersion
questionCount
status
metadata
```

Admin juga sudah memiliki readiness/activation workflow.

Static validation terhadap architecture/configuration governance masih PASS.

Masalahnya:

> Runtime start assessment belum mengambil active `AssessmentConfigurationVersion` sebagai authority utama.

---

# 3. Critical Finding — Runtime Still Uses Static Configuration

File:

```text
lib/assessment-config.ts
```

masih berisi:

```text
ASSESSMENT_CONFIG
```

yang menentukan antara lain:

```text
free
premium
disc
eq
cognitive
riasec
```

masing-masing dengan:

```text
id
version
questionCount
scoringVersion
selectionAlgorithmVersion
status
timeLimitSeconds
```

`runtime-service.ts` langsung melakukan:

```text
const config = ASSESSMENT_CONFIG[type]
```

dan menggunakan configuration tersebut untuk start assessment.

Dengan demikian:

```text
Admin dapat memiliki active DB configuration
                +
Runtime dapat memiliki static configuration
```

Keduanya secara teoritis dapat berbeda.

Ini adalah architectural drift yang harus dihentikan.

---

# 4. Critical Finding — Selection Rules Still Contain Hardcoded Business Rules

`lib/assessment/question-engine.ts` masih memiliki selection logic yang langsung menentukan quota.

Contoh yang ditemukan:

### RIASEC

```text
R = 10
I = 10
A = 10
S = 10
E = 10
C = 10
```

### EQ

```text
EMOTION_AWARENESS = 6
EMOTION_REGULATION = 6
EMPATHY_SOCIAL_AWARENESS = 6
RELATIONSHIP_SOCIAL_RESPONSE = 6
```

### Cognitive

```text
VERBAL_REASONING = 6
NUMERICAL_REASONING = 6
LOGICAL_REASONING = 6
ABSTRACT_REASONING = 6
```

### Free RIASEC

```text
R = 2
I = 2
A = 2
S = 2
E = 1
C = 1
```

### Premium

Selection masih menggunakan quota/domain aliases yang ditentukan langsung di source code.

Business rule seperti ini seharusnya tidak menjadi primary runtime authority jika sudah tersedia model Package + Composition Rule.

---

# 5. Critical Finding — Package Runtime Still Depends on Static Configuration

`lib/question-package-runtime.ts` sudah benar dalam mengambil:

```text
QuestionPackageVersion
QuestionPackageCompositionRule
QuestionVersion
```

Tetapi package validation masih mengambil:

```text
ASSESSMENT_CONFIG[...].scoringVersion
ASSESSMENT_CONFIG[...].questionCount
```

dan bahkan production timer masih memiliki rule hardcoded:

```text
timeLimitSeconds === 1200
```

Dengan demikian package sudah database-driven, tetapi validasinya belum sepenuhnya database-driven.

---

# 6. Critical Finding — Assessment Configuration Does Not Explicitly Own Package Version

Saat ini:

```text
AssessmentConfigurationVersion
```

memiliki metadata configuration, tetapi tidak memiliki direct relational ownership terhadap:

```text
QuestionPackageVersion
```

Akibatnya hubungan konseptual masih berupa:

```text
AssessmentConfigurationVersion
        │
        │ implicit
        ▼
QuestionPackageVersion
```

Target architecture harus menjadi:

```text
AssessmentConfigurationVersion
        │
        ├── QuestionPackageVersion
        ├── Taxonomy Version
        ├── Scoring Version
        ├── Selection Algorithm Version
        └── Question Count
```

Relasi aktual harus diputuskan secara additive dan migration-safe.

---

# 7. What Is Already Correct

Jangan merombak bagian-bagian berikut:

```text
Question
QuestionVersion
Question Package
Question Package Version
Composition Rule
Question publishing
Review workflow
AssessmentAttempt snapshot
selectedQuestionVersionIds
Scoring engine
Result engine
Existing admin Question Bank
Existing Admin Review
Existing Assessment Configuration UI
```

AssessmentAttempt sudah menyimpan:

```text
assessmentConfigurationId
assessmentConfigurationVersion
questionBankVersion
taxonomyVersion
scoringVersion
selectionAlgorithmVersion
selectionSnapshot
```

dan snapshot juga sudah menyimpan selected question/version identities.

Ini adalah fondasi historical reproducibility yang harus dipertahankan.

---

# 8. Target Architecture

## 8.1 Canonical Runtime Chain

Target final:

```text
Assessment Type
      │
      ▼
Active AssessmentConfigurationVersion
      │
      ├───────────────┐
      │               │
      ▼               ▼
QuestionPackage   Scoring Version
Version
      │
      ├── Taxonomy Version
      ├── Composition Rules
      ├── Selection Algorithm Version
      └── Question Count
      │
      ▼
Eligible QuestionVersions
      │
      ▼
Selection Algorithm
      │
      ▼
AssessmentAttempt Snapshot
      │
      ├── Configuration Version
      ├── Package Version
      ├── QuestionBank Version
      ├── Taxonomy Version
      ├── Scoring Version
      ├── Selection Algorithm Version
      └── Selected QuestionVersion IDs
      │
      ▼
Scoring
      │
      ▼
Result / Report
```

---

# 9. Source of Truth Rules

## 9.1 Question Content

Canonical:

```text
PostgreSQL QuestionVersion
```

Tidak boleh:

- hardcoded question content;
- duplicate question catalog sebagai authority;
- question ID naming convention sebagai primary business rule.

---

## 9.2 Package Composition

Canonical:

```text
QuestionPackageVersion
+
QuestionPackageCompositionRule
```

Contoh:

```text
RIASEC package
R = 10
I = 10
A = 10
S = 10
E = 10
C = 10
```

harus berasal dari package configuration, bukan source-code quota.

---

## 9.3 Assessment Configuration

Canonical:

```text
Active AssessmentConfigurationVersion
```

Runtime tidak boleh memilih configuration version dari `lib/assessment-config.ts`.

---

## 9.4 Scoring

Scoring implementation tetap berada di code.

Namun runtime identity:

```text
scoringVersion
```

harus berasal dari active configuration/package contract.

AI dan report harus membaca result yang sudah dihitung, bukan menghitung ulang.

---

## 9.5 Selection Algorithm

Algorithm implementation tetap berada di code.

Tetapi version identity:

```text
selectionAlgorithmVersion
```

harus berasal dari configuration/package.

---

# 10. Free & Premium Assessment

Free dan Premium saat ini masih menggunakan `question-engine.ts` selection rules yang lebih hardcoded.

Target V17.9+:

> Jangan mempertahankan dua dunia runtime permanen.

Ada dua pilihan:

### Preferred

Modelkan Free dan Premium sebagai runtime package/configuration juga.

```text
FREE
  ↓
QuestionPackageVersion
  ↓
Composition Rules
  ↓
QuestionVersion

PREMIUM
  ↓
QuestionPackageVersion
  ↓
Composition Rules
  ↓
QuestionVersion
```

### Alternative

Jika product semantics Free/Premium memang berbeda dari instrument package, dokumentasikan secara eksplisit sebagai separate acquisition blueprint.

Namun keputusan tersebut harus dibuat di Phase 17.9 sebelum runtime migration.

Tidak boleh sekadar membiarkan hardcode tetap hidup tanpa classification.

---

# 11. Historical Integrity

Setiap AssessmentAttempt harus tetap immutable secara historis.

Ketika user mulai test:

```text
Active Configuration V3
       ↓
Package V5
       ↓
Question Versions
       ↓
Attempt Snapshot
```

Kemudian admin membuat:

```text
Configuration V4
Package V6
```

attempt lama tetap menggunakan:

```text
Configuration V3
Package V5
QuestionVersion IDs lama
```

Tidak boleh berubah retroaktif.

---

# 12. Runtime Behavior

Start assessment harus menjadi:

```text
POST /api/assessment/start
        │
        ▼
Resolve assessment type
        │
        ▼
Resolve active AssessmentConfigurationVersion
        │
        ▼
Resolve linked runtime package
        │
        ▼
Validate readiness
        │
        ▼
Load eligible QuestionVersions
        │
        ▼
Execute selection algorithm
        │
        ▼
Create immutable snapshot
        │
        ▼
Persist Attempt
        │
        ▼
Return public questions
```

Tidak boleh:

```text
POST /api/assessment/start
        ↓
ASSESSMENT_CONFIG[type]
        ↓
hardcoded quota
```

sebagai primary path.

---

# 13. What Must NOT Be Changed

V17.9+ tidak boleh merombak:

- scoring algorithm existing;
- result engine;
- report engine;
- BusinessLead;
- authentication;
- entitlement;
- payment;
- WhatsApp Inbox;
- customer UX;
- historical attempt data.

Perubahan harus additive dan backward-compatible.

---

# 14. Kaidah Development

## Rule 1 — Database Becomes Runtime Authority

Jika sebuah value sudah merupakan configuration yang dapat berubah melalui Admin, runtime tidak boleh memiliki copy hardcoded sebagai authority kedua.

---

## Rule 2 — Code Contains Algorithm, DB Contains Configuration

Contoh:

```text
DB:
RIASEC R=10
I=10
A=10
...

Code:
composition selection algorithm
```

Bukan:

```text
Code:
R=10
I=10
A=10
...
```

---

## Rule 3 — No Naming Convention as Business Rule

Jangan menggunakan:

```text
question.id.startsWith("DISC-")
```

atau pola ID serupa sebagai primary business rule.

Gunakan:

```text
testTypeId
taxonomyVersion
taxonomyNode
domain
subdomain
composition rule
```

---

## Rule 4 — One Runtime Authority

Assessment start harus memiliki satu canonical configuration path.

---

## Rule 5 — Historical Attempts Are Immutable

Configuration change hanya memengaruhi assessment baru.

---

## Rule 6 — Additive Migration

Database migration harus:

```text
safe
additive
backward-compatible
```

Tidak boleh menghapus historical identity.

---

## Rule 7 — Existing Runtime Must Remain Recoverable

Selama migration, fallback hanya boleh digunakan sebagai controlled compatibility path.

Fallback tidak boleh menjadi permanent second source of truth.

---

## Rule 8 — No AI Yet

AI Career Advisor tidak boleh mulai sebelum Question Architecture Freeze.

AI membutuhkan Result/Assessment sebagai source of truth.

---

# 15. Phase Plan

## PHASE 17.9 — Question Architecture Audit & Canonical Contract

### Objective

Menyelesaikan keputusan arsitektur sebelum mengubah runtime.

### Scope

1. Inventory seluruh hardcoded assessment/question configuration.
2. Klasifikasikan:
   - constant;
   - algorithm;
   - configuration;
   - legacy compatibility.
3. Lock canonical relationship:
   ```text
   AssessmentConfigurationVersion
        ↓
   QuestionPackageVersion
        ↓
   Composition Rules
        ↓
   QuestionVersion
   ```
4. Tentukan treatment Free dan Premium.
5. Tentukan schema changes minimum.
6. Tentukan migration strategy.
7. Tentukan runtime compatibility boundary.
8. Tambahkan static gate untuk mencegah kembali munculnya duplicate runtime configuration.

### Output

```text
Question Architecture Contract
Runtime Source-of-Truth Matrix
Migration Plan
Free/Premium Decision
Regression Matrix
```

### Gate

```text
17.9 PASS
```

Acceptance:

- semua runtime configuration source terinventarisasi;
- canonical authority disepakati;
- tidak ada ambiguity antara DB configuration dan static runtime;
- Free/Premium sudah memiliki keputusan arsitektur;
- migration plan aman;
- no production change.

---

# PHASE 17.10 — Runtime Alignment & Configuration Migration

### Objective

Memindahkan runtime ke canonical configuration tanpa mengubah behavior assessment yang sudah berjalan.

### Scope

1. Additive schema migration jika diperlukan.
2. Link active AssessmentConfigurationVersion ke runtime package/version.
3. Build canonical runtime resolver.
4. Migrate RIASEC/DISC/EQ/Cognitive runtime.
5. Migrate Free/Premium sesuai keputusan 17.9.
6. Remove hardcoded question quotas from primary runtime path.
7. Remove static configuration as runtime authority.
8. Keep only technical constants/algorithm implementations in code.
9. Update snapshot metadata.
10. Preserve historical attempt compatibility.

### Target

```text
Assessment Start
      ↓
DB Active Configuration
      ↓
Package
      ↓
Composition
      ↓
QuestionVersion
```

### Gate

```text
17.10 PASS
```

Acceptance:

- all assessment types start successfully;
- question count unchanged;
- composition unchanged;
- scoring unchanged;
- selected QuestionVersion IDs persist;
- snapshot metadata correct;
- old attempts remain readable;
- no runtime dependency on `ASSESSMENT_CONFIG` as authority.

---

# PHASE 17.11 — Question Architecture Freeze & Full Regression

### Objective

Memastikan architecture baru benar-benar production-safe.

### Scope

### Static

- typecheck;
- build;
- architecture gate;
- no forbidden hardcoded runtime rules.

### Runtime

Test:

```text
FREE
PREMIUM
RIASEC
DISC
EQ
COGNITIVE
```

For each:

```text
start
selection
snapshot
answer
submit
scoring
result
```

### Governance

Test:

```text
Draft
Review
Approved
Published
Active
Archived
```

### Historical

Test:

```text
Attempt created with Config V1
↓
Config V2 activated
↓
Old attempt still resolves using V1
```

### Regression

Must preserve:

- assessment;
- scoring;
- result;
- report;
- matching;
- reassessment;
- entitlement;
- lead;
- commercial;
- WhatsApp outbound;
- WhatsApp Inbox.

### Gate

```text
READYScore Question Architecture — PASS
```

---

# 16. Phase Count

Total:

```text
17.9 — Audit & Canonical Contract
17.10 — Runtime Alignment & Migration
17.11 — Freeze & Full Regression
```

**Total: 3 phases.**

Tidak dibuat 6–10 phase karena fondasi existing sebenarnya sudah kuat.

---

# 17. Definition of Done

Question Architecture dianggap selesai hanya jika:

### Architecture

- [ ] satu canonical runtime configuration;
- [ ] QuestionVersion tetap canonical content;
- [ ] PackageVersion menjadi canonical composition;
- [ ] ConfigurationVersion menjadi canonical assessment identity;
- [ ] Free/Premium sudah memiliki architecture decision;
- [ ] tidak ada duplicate configuration authority.

### Runtime

- [ ] all assessment types start;
- [ ] package selection bekerja;
- [ ] composition bekerja;
- [ ] question count tetap;
- [ ] scoring version benar;
- [ ] selection algorithm version benar;
- [ ] snapshot lengkap.

### Historical

- [ ] old attempts tetap dapat dibaca;
- [ ] configuration baru tidak mengubah attempt lama;
- [ ] QuestionVersion identity immutable.

### Governance

- [ ] publish/readiness tetap bekerja;
- [ ] activation hanya untuk configuration ready;
- [ ] package lifecycle tetap bekerja;
- [ ] Question lifecycle tetap bekerja.

### Security / Regression

- [ ] no secret changes;
- [ ] no auth regression;
- [ ] no commercial regression;
- [ ] no WhatsApp regression;
- [ ] typecheck PASS;
- [ ] build PASS;
- [ ] full E2E PASS.

---

# 18. Relationship to WhatsApp and AI Roadmap

Current product roadmap:

```text
V17.8
WhatsApp Inbox implementation
        │
        ▼
17.9
Question Architecture Audit
        │
        ▼
17.10
Question Runtime Alignment
        │
        ▼
17.11
Question Architecture Freeze
        │
        ▼
V18
WhatsApp Production Runtime Completion
        │
        ▼
V19
AI Career Advisor
```

WhatsApp remains architecturally separate from the Question refactor.

AI must wait until Question Architecture is frozen because AI's highest-authority context is ReadyScore scoring/result data.

---

# 19. Final Architecture Principle

ReadyScore should have:

```text
QUESTION CONTENT
QuestionVersion
        │
        ▼
QUESTION COMPOSITION
QuestionPackageVersion
        │
        ▼
ASSESSMENT IDENTITY
AssessmentConfigurationVersion
        │
        ▼
RUNTIME
        │
        ▼
ATTEMPT SNAPSHOT
        │
        ▼
SCORING
        │
        ▼
RESULT / REPORT
```

The key rule is:

> **Database configuration defines what assessment is active. Code defines how the configured algorithm executes it.**

And:

> **An assessment attempt freezes the exact configuration, question versions, and selection metadata it used.**

---

# 20. Final Commandment

> **Do not rebuild the Question Architecture. Complete it.**

ReadyScore already has the major pieces.

The job of 17.9–17.11 is to remove the remaining split between:

```text
Governance
```

and

```text
Runtime
```

so that the next layers — WhatsApp operational context and AI Career Advisor — can rely on one consistent assessment source of truth.
