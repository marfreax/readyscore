# ReadyScore V13 — Production Assessment System
## Production Specification, Kaidah, Phase Order & Acceptance Gates
**Version:** 1.0  
**Date:** 2026-09-07  
**Status:** DEVELOPMENT ROADMAP — V13 SERIES

---

# 1. Purpose

V13 is the productionization phase of ReadyScore.

The objective is not merely to make the assessment runtime work, but to complete the end-to-end production assessment system:

```text
ADMIN
  ↓
Question Bank
  ↓
Mapping & Review
  ↓
Question Publish
  ↓
Question Package
  ↓
Package Validation
  ↓
Package Publish
  ↓
Production Eligibility
  ↓
CUSTOMER
  ↓
Assessment Access
  ↓
Start
  ↓
Timed Assessment
  ↓
Submit / Timeout
  ↓
Scoring
  ↓
Result
```

At the end of V13, an authorized admin must be able to configure and publish a production assessment through the application UI, and a customer must be able to consume that published assessment through the real customer flow.

V13 must preserve the V13.1, V13.2 and V13.3 foundations that have already passed.

---

# 2. V13 Baseline

The following are frozen foundations and must not be casually redesigned during V13.4+:

- Question Package architecture
- Composition-based runtime question selection
- Taxonomy validation
- QuestionVersion eligibility rules
- Frozen package/question snapshot per attempt
- Randomized question order per attempt
- Durable answer persistence
- Interrupted-attempt resume semantics
- Server-authoritative expiry
- Timeout auto-finalization
- Post-expiry answer rejection
- Existing Result Experience behavior unless a later phase explicitly requires production content/report changes

V13.4+ must extend the system without regressing these foundations.

Any change to frozen behavior requires an explicit scope decision and a new regression gate.

---

# 3. Production Target

Current production assessment target:

| Assessment | Questions | Maximum Time |
|---|---:|---:|
| RIASEC | 60 | 20 minutes |
| DISC | 80 | 20 minutes |
| EQ | 50 | 20 minutes |
| Cognitive / IQ | 40 | 20 minutes |

Timer representation:

```text
20 minutes = 1,200 seconds
```

The 20-minute value is the maximum allowed assessment time. It must not be interpreted as a requirement that every participant finish all questions.

These values are a PRODUCTION DESIGN TARGET until the relevant blueprint and scoring/content validation gates are passed.

They are not, by themselves, a claim of psychometric optimality or international validation.

---

# 4. Core Production Principles

## 4.1 Quality before quantity

Do not publish a question merely because the required item count has been reached.

Every production question must satisfy the applicable:

- content requirement
- taxonomy mapping
- scoring requirement
- lifecycle requirement
- review requirement
- package eligibility requirement

---

## 4.2 Blueprint before question selection

No production question pool is considered final until its assessment blueprint is defined.

The blueprint must determine:

- construct being measured
- dimensions/domains/subdomains applicable to the assessment
- intended reporting structure
- item count
- composition
- scoring implications
- timer assumptions
- required production pool
- reserve pool requirements where applicable

---

## 4.3 Package is configuration, not the scoring engine

Question Package defines delivery configuration.

It must not become a substitute for:

- construct definition
- scoring model
- psychometric validation
- content review

Package configuration must remain compatible with the assessment's scoring model.

---

## 4.4 Published content must be traceable

Every published QuestionVersion must be traceable to:

- question code
- version
- taxonomy mapping
- mapping approval
- question approval
- publication state
- scoring configuration
- applicable assessment type

---

## 4.5 Production runtime must select only eligible content

Runtime eligibility requires the applicable QuestionVersion to satisfy the existing production eligibility rules, including:

- published status
- approved mapping
- correct taxonomy
- correct assessment/TestType
- required scoring compatibility

Runtime must not silently fall back to arbitrary or legacy questions when a production package cannot be satisfied.

---

## 4.6 No silent mutation of production attempts

Once an attempt has started:

- package identity is frozen
- package version/snapshot is frozen
- selected question versions are frozen
- question sequence is frozen
- answers persist against the attempt
- later content changes must not alter the historical attempt

---

## 4.7 Legacy content boundary

The legacy general readiness question bank is not to be cleaned, migrated, or silently reused as part of V13 production instruments unless an explicit later specification authorizes it.

V13 establishes eligibility boundaries rather than performing a broad legacy-content migration.

---

## 4.8 Every phase is independently gated

Every V13 phase must follow:

```text
SPECIFICATION
  ↓
IMPLEMENTATION
  ↓
STATIC GATE
  ↓
REAL DATABASE / HTTP E2E
  ↓
REGRESSION
  ↓
PASS
  ↓
FREEZE
```

A phase is not considered complete because code compiles.

---

# 5. V13 Phase Order

## V13.4 — P1: Production Assessment Blueprint

### Objective

Create the formal production blueprint for RIASEC, DISC, EQ and Cognitive.

### Required output

For each assessment define:

1. construct
2. taxonomy structure
3. dimensions/domains/subdomains
4. intended score/report outputs
5. item count
6. composition rules
7. scoring model/version dependency
8. timer model
9. production pool size
10. reserve pool policy
11. content acceptance criteria
12. psychometric validation requirements

### Critical rule

Do not infer missing blueprint structure merely from the current database taxonomy.

The blueprint must be explicitly defined before final production content is approved.

### Acceptance

- Four assessment blueprints documented
- Item counts reconciled
- Composition totals equal package totals
- Scoring dependencies identified
- No unresolved construct/reporting contradiction
- Blueprint artifact frozen

### Gate

`V13.4 PASS / FROZEN`

---

# 6. V13.5 — P2: Production Question Pool

### Objective

Create/import the production candidate pools according to V13.4.

### Workflow

```text
Production source
  ↓
Normalize
  ↓
Validate structure
  ↓
Import as DRAFT
  ↓
Candidate pool
```

### Rules

- Import through controlled Question Bank flow.
- Never publish directly from import.
- Preserve question codes and version traceability.
- Do not mix unrelated legacy questions into production instruments.
- Production target count and reserve count must follow V13.4.
- Duplicate questions must be detected.
- Missing required fields must be rejected or flagged.
- Scoring configuration must be structurally valid.

### Assessment-specific note

RIASEC currently has a V2 production candidate bank aligned with the 60-item target.

DISC, EQ and Cognitive require expansion from their currently available smaller V2 production banks if their production targets remain 80, 50 and 40 respectively.

### Acceptance

- Production candidate pools exist
- Required fields are complete
- No unresolved structural duplicates
- Candidate pools meet blueprint quantity requirements
- All imported items are DRAFT
- Import provenance is traceable

### Gate

`V13.5 PASS / FROZEN`

---

# 7. V13.6 — P3: Mapping & Content Review

### Objective

Move production questions through the controlled lifecycle and establish approved taxonomy mappings.

### Required lifecycle

```text
DRAFT
  ↓
VALIDATED
  ↓
REVIEW_REQUIRED
  ↓
APPROVED
  ↓
PUBLISHED
  ↓
ACTIVE
```

Mapping approval is a required prerequisite where applicable.

### Rules

A question must not be published when:

- required mapping is missing
- mapping is incomplete
- mapping is not approved
- assessment/TestType is inconsistent
- scoring configuration is invalid
- content review has not passed

### Review dimensions

At minimum:

- wording clarity
- construct relevance
- taxonomy correctness
- scoring correctness
- duplicate/near-duplicate risk
- response option integrity
- cultural/language suitability where applicable
- inappropriate ambiguity
- obvious cueing or answer leakage

### Acceptance

- Required production questions have approved mappings
- Content review is complete
- Lifecycle states are correct
- No unresolved blocking review findings
- Published eligibility can be established deterministically

### Gate

`V13.6 PASS / FROZEN`

---

# 8. V13.7 — P4: Scoring Validation

### Objective

Verify that production item counts and compositions are compatible with the actual scoring engines.

### Rules

Changing package item count is not sufficient to claim scoring compatibility.

For every assessment verify:

- scoring version
- required dimensions
- required answer structures
- weighting
- missing-answer behavior
- normal submission behavior
- timeout behavior
- score calculation
- result payload
- result interpretation compatibility

### Special requirement

DISC 80, EQ 50 and Cognitive 40 must not be declared production-ready merely because their package can technically select the required number of questions.

Their scoring models must be explicitly validated against the final production blueprint.

### Acceptance

For each assessment:

```text
Production item set
        ↓
Actual scoring engine
        ↓
Expected score structure
        ↓
Expected result payload
        ↓
PASS
```

Normal submit and timeout paths must both be tested where applicable.

### Gate

`V13.7 PASS / FROZEN`

---

# 9. V13.8 — P5: Package Configuration

### Objective

Configure production Question Packages through the Admin UI.

### Admin capability

Admin must be able to:

- create package
- select assessment/TestType
- enter total questions
- enter time limit
- select taxonomy version
- define composition rules
- save draft
- inspect package
- validate package
- publish package

### Package validation

Must validate:

- total question count
- timer
- taxonomy linkage
- composition presence
- composition total
- positive composition counts
- taxonomy validity
- TestType compatibility

### Target packages

#### RIASEC

```text
Total = 60
Timer = 1200

R = 10
I = 10
A = 10
S = 10
E = 10
C = 10
```

#### DISC

Composition must follow the V13.4 blueprint and the actual DISC V2 taxonomy/scoring model.

#### EQ

Composition must follow the V13.4 blueprint and actual EQ V2 taxonomy/scoring model.

#### Cognitive

Composition must follow the V13.4 blueprint and actual Cognitive V2 taxonomy/scoring model.

### Acceptance

- All production packages can be created through UI
- All package validations pass
- No package contains invalid taxonomy references
- Composition totals equal total questions
- Timer is correctly persisted
- Package remains DRAFT until explicitly published

### Gate

`V13.8 PASS / FROZEN`

---

# 10. V13.9 — P6: Publish & Production Eligibility

### Objective

Establish a deterministic boundary between configured content and runtime-eligible production content.

### Publish rules

A package can only be published after package configuration validation passes.

Runtime must subsequently verify actual question availability.

### Required availability checks

For every composition node:

```text
Eligible Published QuestionVersions
>=
Required Composition Count
```

The system must not silently publish a package that runtime cannot satisfy unless the product explicitly defines such a state.

### Production eligibility matrix

For each assessment document:

- package ID/version
- taxonomy version
- total questions
- timer
- composition
- eligible question count by node
- reserve count
- scoring version
- publication status

### Acceptance

- Package publication succeeds only when configuration is valid
- Runtime eligibility can be inspected/verified
- Required pools are available
- No hidden dependency on legacy content
- Production package identity is traceable

### Gate

`V13.9 PASS / FROZEN`

---

# 11. V13.10 — P7: Production E2E & Customer Readiness

## Objective

Prove the complete real-world path from Admin setup to customer result.

This is the final V13 readiness gate.

---

## 11.1 Admin E2E

Prove that an admin can perform the complete workflow through the actual application UI:

```text
Create / Import Question
  ↓
Draft
  ↓
Validate
  ↓
Mapping
  ↓
Review
  ↓
Approve
  ↓
Publish
  ↓
Create Package
  ↓
Configure Composition
  ↓
Configure Timer
  ↓
Validate
  ↓
Publish
```

No database-only shortcut may be required for ordinary production setup.

---

## 11.2 Customer E2E

For every production assessment:

```text
Customer access
  ↓
Start
  ↓
Question selection
  ↓
Correct composition
  ↓
Randomized sequence
  ↓
Answer
  ↓
Next / previous as supported
  ↓
Refresh
  ↓
Reconnect
  ↓
Resume
  ↓
Submit
  ↓
Score
  ↓
Result
```

---

## 11.3 Timeout E2E

For every timed production assessment verify:

```text
Timer reaches expiry
  ↓
Server authoritative expiry
  ↓
Attempt finalization
  ↓
Timeout scoring
  ↓
Result persistence
  ↓
Post-expiry answer rejection
```

Unanswered questions must not automatically be synthesized as incorrect unless the specific scoring model explicitly requires it.

---

## 11.4 Snapshot integrity

After an attempt starts:

- package cannot mutate the attempt
- question order cannot change
- selected QuestionVersions cannot change
- refresh cannot create a new attempt accidentally
- later publication changes cannot rewrite the active/historical attempt

---

## 11.5 Result integrity

Verify:

- scoring version
- dimensions
- scores
- result payload
- interpretation
- displayed result
- persistence
- reload behavior

---

## 11.6 Production customer usability

Verify at minimum:

- clear assessment instructions
- visible timer
- understandable answer controls
- progress indication
- submit confirmation where applicable
- timeout messaging
- resume behavior
- error/retry behavior
- result accessibility

### Gate

`V13.10 PASS / FROZEN`

---

# 12. V13 Final Definition of Done

V13 is COMPLETE only when all conditions below are true.

## Admin

An authorized admin can:

- manage production questions
- import question pools
- validate content
- approve mappings
- approve questions
- publish questions
- create packages
- configure composition
- configure timer
- validate packages
- publish packages
- verify production eligibility

## Runtime

The production runtime can:

- resolve the correct published package
- select only eligible questions
- satisfy exact composition
- randomize question order
- freeze the attempt snapshot
- persist answers
- resume interrupted attempts
- enforce server-authoritative timeout
- finalize timeout attempts
- reject post-expiry answers
- score normally
- score timeout attempts according to the scoring model

## Customer

A customer can:

- obtain valid assessment access
- start an assessment
- complete it
- survive refresh/reconnect
- submit or time out
- receive a valid result
- reload the result

## Content / Measurement

Each published assessment has:

- locked blueprint
- approved production question pool
- approved taxonomy mapping
- validated scoring compatibility
- documented scoring version
- documented composition
- documented timer
- production eligibility boundary

---

# 13. Important Non-Goals

V13 does NOT automatically claim:

- clinical diagnostic validity
- universal psychometric validity
- international norm equivalence
- local Indonesian norming
- suitability for high-stakes employment decisions
- that item counts are universally optimal

Those claims require separate empirical validation and evidence.

---

# 14. Post-V13 Items

The following may remain outside V13 unless explicitly pulled into scope:

- large-scale normative study
- external psychometric validation study
- local population norming
- DIF / fairness analysis at scale
- formal external test review/certification
- advanced report generation
- billing/payment integration
- marketing automation
- large-scale analytics
- enterprise administration
- advanced anti-cheating/proctoring

However, any item that is necessary for the actual intended customer purchase-to-test-to-result flow must be completed before declaring the corresponding commercial launch ready.

---

# 15. V13 Phase Dependency

```text
V13.1
Question Package Configuration
        │
        ▼
V13.2
Composition Validation & Question Selection
        │
        ▼
V13.3
Timed Attempt & Resilience
        │
        ▼
V13.4
Production Assessment Blueprint
        │
        ▼
V13.5
Production Question Pool
        │
        ▼
V13.6
Mapping & Content Review
        │
        ▼
V13.7
Scoring Validation
        │
        ▼
V13.8
Package Configuration
        │
        ▼
V13.9
Publish & Production Eligibility
        │
        ▼
V13.10
Production E2E & Customer Readiness
        │
        ▼
================================
READY SCORE V13 PRODUCTION READY
================================
```

---

# 16. Change-Control Rule

After a phase is marked `PASS / FROZEN`:

- do not casually modify its contract
- later phases must consume its frozen outputs
- regressions require investigation
- any intentional contract change requires an explicit phase amendment or new phase

The goal is to prevent V13 from becoming an uncontrolled collection of feature changes.

---

# 17. Required Evidence Per Phase

Every phase must produce:

1. specification / implementation record
2. changed files
3. migration, if applicable
4. static validation output
5. build/typecheck output where applicable
6. real DB/HTTP E2E evidence
7. regression evidence
8. final PASS/FAIL statement
9. freeze point
10. known limitations, if any

A phase without evidence is not considered PASS.

---

# 18. Final V13 Principle

The definition of success is not:

> “The developer can configure it.”

It is:

> **“An authorized admin can configure and publish a valid production assessment entirely through the application, and a real customer can take that published assessment from start to finish and receive the correct persisted result without engineering intervention.”**

That is the V13 production contract.
