# ReadyScore V17.9 — Question Architecture Audit & Canonical Contract

**Phase:** 17.9  
**Baseline:** V17.8  
**Status:** AUDIT / CONTRACT LOCK  
**Purpose:** Menetapkan source-of-truth dan boundary arsitektur Question/Assessment sebelum runtime migration pada Phase 17.10.

---

## 1. Phase Objective

Phase 17.9 tidak melakukan rewrite Question Architecture dan tidak melakukan migration runtime.

Phase ini mengunci:

1. kondisi arsitektur V17.8 yang benar-benar ada;
2. source-of-truth canonical;
3. boundary antara configuration dan algorithm;
4. hubungan Assessment Configuration ↔ Question Package;
5. aturan historical reproducibility;
6. keputusan Free;
7. migration boundary untuk Phase 17.10;
8. static contract yang mencegah architectural drift baru.

---

## 2. Current Architecture — V17.8 Baseline

### 2.1 Question identity

```text
Question
  └── QuestionVersion[]
```

`Question` adalah stable logical identity. `QuestionVersion` adalah versi assessment-facing yang memuat content, taxonomy, scoring metadata, status, dan mapping status.

**Decision:** KEEP.

### 2.2 Question lifecycle

Runtime menggunakan question version yang telah memenuhi publication/review requirements.

**Decision:** KEEP.

### 2.3 Question package

Database sudah memiliki:

```text
QuestionPackage
QuestionPackageVersion
QuestionPackageCompositionRule
```

Package version memiliki total question, timer, taxonomy reference, status, dan composition rules.

**Decision:** KEEP. Ini menjadi fondasi selection blueprint canonical.

### 2.4 Assessment configuration

Database sudah memiliki:

```text
AssessmentConfiguration
AssessmentConfigurationVersion
```

Configuration version memiliki:

```text
questionBankVersion
taxonomyVersion
scoringVersion
selectionAlgorithmVersion
questionCount
status
metadata
```

**Decision:** KEEP, tetapi pada Phase 17.10 harus menjadi runtime authority.

---

## 3. Confirmed Architectural Drift

### 3.1 Static runtime configuration

`lib/assessment-config.ts` masih menyediakan `ASSESSMENT_CONFIG` dan runtime service membaca configuration tersebut secara langsung.

Static configuration saat ini mencakup:

- assessment configuration id;
- configuration version;
- question count;
- scoring version;
- selection algorithm version;
- publication status;
- optional timer.

**Contract:** static config boleh tetap ada sebagai compatibility artifact selama migration, tetapi tidak boleh menjadi runtime authority setelah Phase 17.10.

### 3.2 Hardcoded selection rules

`lib/assessment/question-engine.ts` masih memiliki quota/rule selection untuk beberapa assessment.

Yang teridentifikasi pada baseline:

- RIASEC: 10 per dimension;
- EQ: 6 per dimension;
- Cognitive: 6 per dimension;
- Free RIASEC: 2/2/2/2/1/1;
- Premium: domain quota map;
- DISC: count-driven slice dari runtime pool.

**Contract:** rule yang bersifat product/configuration harus dipindahkan ke package/composition configuration pada Phase 17.10. Algorithm implementation tetap berada di code.

### 3.3 Package runtime cross-check terhadap static config

`lib/question-package-runtime.ts` masih membandingkan package terhadap `ASSESSMENT_CONFIG` dan memiliki production timer assumption 1200 seconds.

**Contract:** package runtime pada Phase 17.10 harus menerima canonical configuration/package contract, bukan membaca static configuration sebagai authority.

### 3.4 Assessment Configuration ↔ Package ownership

`AssessmentConfigurationVersion` belum memiliki direct relation ke `QuestionPackageVersion`.

**Contract:** Phase 17.10 harus membuat ownership/reference tersebut eksplisit secara additive dan migration-safe.

---

## 4. Canonical Runtime Contract

Target canonical chain:

```text
Assessment Type
      │
      ▼
Active AssessmentConfigurationVersion
      │
      ├───────────────┐
      │               │
      ▼               ▼
QuestionPackageVersion  Scoring Version
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
      ├── Configuration identity
      ├── Package identity
      ├── Question bank version
      ├── Taxonomy version
      ├── Scoring version
      ├── Selection algorithm version
      └── Selected QuestionVersion IDs
      │
      ▼
Scoring
      │
      ▼
Result / Report
```

This is the canonical architecture for Phase 17.10 and later.

---

## 5. Source-of-Truth Matrix

| Concern | Canonical authority | Code may contain | Must not contain |
|---|---|---|---|
| Question identity | `Question` | domain model/types | duplicate identity catalog |
| Question content/version | `QuestionVersion` | DTO/algorithm types | production question content authority |
| Question publication | QuestionVersion lifecycle | validation logic | second publication authority |
| Package identity | `QuestionPackage` | package domain types | duplicate package catalog |
| Package version | `QuestionPackageVersion` | selection implementation | hardcoded production package definition |
| Package composition | `QuestionPackageCompositionRule` | generic composition algorithm | fixed production quotas as primary authority |
| Assessment identity | Active `AssessmentConfigurationVersion` | resolver/adapter | `ASSESSMENT_CONFIG` as runtime authority |
| Question count | active configuration/package contract | validation | hardcoded count as business authority |
| Timer | active package/configuration contract | generic timer calculation | fixed production timer as business authority |
| Taxonomy identity | DB taxonomy/version contract | taxonomy algorithm | hidden fallback as production authority |
| Scoring implementation | scoring code | algorithm implementation | duplicated scoring implementation |
| Scoring version identity | active configuration/package contract | version-aware dispatch | static config authority |
| Selection implementation | selection code | algorithm implementation | undocumented business quotas |
| Selection version identity | active configuration/package contract | version-aware dispatch | static config authority |
| Attempt history | `AssessmentAttempt` + frozen snapshot | persistence code | retroactive mutation |

---

## 6. Configuration vs Algorithm Boundary

### Configuration belongs in DB

- question count;
- taxonomy composition;
- domain/dimension coverage;
- package version;
- timer;
- scoring version identity;
- selection algorithm version identity;
- activation status;
- question bank version.

### Algorithm belongs in code

- seeded shuffle implementation;
- max-flow/composition solver;
- eligibility evaluation;
- scoring calculations;
- validation algorithm;
- deterministic selection mechanics.

The algorithm may interpret database configuration, but must not silently replace it with another production rule.

---

## 7. Current Assessment Model

For the canonical architecture, the current runtime assessment set is **Free, RIASEC, DISC, EQ, and Cognitive**. Premium is not an assessment type in the current Question Architecture.

Target:

```text
FREE / RIASEC / DISC / EQ / COGNITIVE
            ↓
AssessmentConfigurationVersion
            ↓
QuestionPackageVersion (internal runtime artifact)
            ↓
Composition Rules
            ↓
Published QuestionVersion Pool
```

This removes the permanent split between package-driven paid instruments and hardcoded Free selection.

The Admin model is intentionally simple:

```text
Question Bank = add as many published questions as needed
Assessment Setting = define composition and total
Readiness = system checks published pool capacity
Runtime = select the configured number from the published pool
```

Changing composition does not require editing or reassigning existing questions. A configuration change affects new attempts; historical attempts remain frozen.

---

## 8. Historical Integrity Contract

When an attempt starts, the runtime must freeze the exact identity used for that attempt.

Minimum frozen identity:

```text
AssessmentConfigurationVersion
QuestionPackageVersion
QuestionBankVersion
TaxonomyVersion
ScoringVersion
SelectionAlgorithmVersion
Selected QuestionVersion IDs
Attempt Seed
```

Later activation of another configuration/package must not alter an existing attempt.

Example:

```text
Attempt A
  Configuration V3
  Package V5
  QuestionVersions X/Y/Z

Later:
  Configuration V4
  Package V6

Attempt A MUST remain V3 + V5 + X/Y/Z.
```

---

## 9. Migration Boundary

### Phase 17.9 — Audit & Contract

Allowed:

- documentation;
- source-of-truth contract;
- architecture decision records;
- static audit gate;
- classification of existing hardcodes;
- migration design.

Not allowed:

- production runtime source-of-truth switch;
- destructive schema rewrite;
- deleting historical question/configuration records;
- changing scoring semantics;
- changing user-facing assessment content.

### Phase 17.10 — Runtime Alignment

Will implement:

1. additive schema relation from configuration version to package version;
2. canonical active configuration resolver;
3. package/configuration runtime contract;
4. migration of all assessment types;
5. migration of Free selection rules;
6. removal of static configuration as runtime authority;
7. snapshot extension with package identity where required;
8. historical compatibility handling.

### Phase 17.11 — Freeze & Regression

Will certify:

- no forbidden production hardcodes;
- all six assessment types;
- configuration lifecycle;
- package lifecycle;
- selection;
- scoring;
- result/report;
- reassessment;
- entitlement;
- commercial/free funnel;
- historical attempt reproducibility.

---

## 10. Compatibility Rule

During migration, `ASSESSMENT_CONFIG` may exist only behind an explicitly named compatibility boundary.

It must not be silently used by a new runtime path.

Any compatibility read must be:

1. visible;
2. temporary;
3. covered by a static gate;
4. scheduled for removal by Phase 17.10/17.11.

---

## 11. Prohibited Future Drift

The following patterns are prohibited as primary business configuration:

```text
const quota = 10
const quota = 6
const questionCount = 100
const timeLimitSeconds = 1200
const DOMAIN_QUOTAS = ...
```

when the value represents an active product/package rule that should be controlled by the database configuration.

Generic constants are allowed when they are technical invariants rather than product configuration.

---

## 12. Phase 17.9 Gate

Phase 17.9 is complete when:

```text
baseline audit       PASS
source-of-truth      PASS
configuration split  PASS
Free decision PASS
historical contract   PASS
migration boundary    PASS
static audit gate     PASS
```

No runtime migration is required for Phase 17.9.

---

## 13. Phase 17.9 → 17.10 Handoff

The implementation team must treat this document as the architecture contract.

The next runtime implementation must start from:

> **Active AssessmentConfigurationVersion is the runtime configuration authority; QuestionPackageVersion is the selection blueprint; QuestionVersion is the content authority; code contains algorithms, not undocumented product quotas.**
