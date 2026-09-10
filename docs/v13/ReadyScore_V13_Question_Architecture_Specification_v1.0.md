# ReadyScore V13 — Question Architecture
## Specification, Rules, Architecture Principles & Development Phase Order

**Document Status:** LOCKED DEVELOPMENT REFERENCE — Draft v1.0  
**Version:** V13  
**Scope:** Question Architecture, Question Package, Composition Validation, Question Selection, Randomization, Timed Attempt & Resilience  
**Date:** 2026-09-07

---

# 1. Purpose

ReadyScore V13 is dedicated to evolving the existing question/assessment runtime into a generic, scalable **Question Package Architecture**.

V13 must support multiple question packages for every assessment type without creating assessment-specific implementations.

Examples:

- DISC: 8 packages
- IQ / Cognitive: 10 packages
- EQ: 5 packages
- RIASEC: 6 packages

The number of packages is **not fixed** and must be configurable.

V13 is an extension of the existing ReadyScore architecture, not a rewrite of the existing Question, QuestionVersion, Scoring, AssessmentAttempt, or AttemptQuestion foundations.

---

# 2. Core Definition

## 2.1 Question Package

A **Question Package** is a versioned, validated set of assessment delivery rules that determines:

1. How many questions are presented.
2. What composition of question dimensions/types must be fulfilled.
3. Which eligible questions may be selected.
4. How a package is selected for an attempt.
5. How questions are ordered/randomized.
6. How long the assessment may run.
7. Which configuration/scoring versions are associated with the attempt.

A package is a **delivery configuration**, not the scoring engine itself.

---

# 3. Generic Architecture

The architecture must be generic across:

- DISC
- IQ / Cognitive
- EQ
- RIASEC
- Future assessment types

The system must NOT create separate package engines such as:

- `DiscQuestionPackage`
- `IqQuestionPackage`
- `EqQuestionPackage`
- `RiasecQuestionPackage`

Instead:

```text
Test Type
    ↓
Question Package
    ↓
Composition Rules
    ↓
Eligible Question Pool
    ↓
Question Selection
    ↓
Question Order Randomization
    ↓
Attempt Snapshot
    ↓
Assessment Runtime
```

---

# 4. Question Package Configuration

Each package must support, at minimum, the following settings.

## 4.1 Identity

- Package name
- Test Type
- Package version
- Status
- Created/updated metadata

Recommended lifecycle:

```text
DRAFT
PUBLISHED
ARCHIVED
```

Only a valid `PUBLISHED` package may be considered for runtime.

---

## 4.2 Total Question Count

Each package defines:

```text
totalQuestions
```

Example:

```text
DISC Package A
totalQuestions = 24
```

The total must be consistent with the composition rules.

Mandatory invariant:

```text
SUM(composition requirements) = totalQuestions
```

If the invariant fails, the package is invalid.

---

## 4.3 Question Composition

Composition defines how many questions of each relevant assessment dimension/category/type must appear.

Example:

```text
DISC
D = 6
I = 6
S = 6
C = 6
```

Example:

```text
RIASEC
R = 10
I = 10
A = 10
S = 10
E = 10
C = 10
```

The composition model must be generic and must not hard-code DISC dimensions.

The package should refer to the applicable taxonomy/dimension/category identifiers.

---

# 5. Composition Rules

Composition is a **measurement constraint**, not merely a display preference.

The system must validate that a package has a valid composition before it can be published.

At minimum:

1. Every referenced dimension/category exists.
2. Every referenced dimension/category belongs to the package's Test Type/taxonomy.
3. Required counts are positive and valid.
4. The sum of all required counts equals `totalQuestions`.
5. The package's eligible question pool contains enough questions to satisfy every required component.
6. The selected questions remain compatible with the scoring configuration.

A package failing any mandatory rule must not be runtime-eligible.

---

# 6. Question Eligibility

V13 must establish a clear boundary between the general question library and questions eligible for production/runtime selection.

The existing development question pool may remain in the database.

It must NOT be assumed to be runtime-eligible merely because a question exists.

A question eligible for a production package should satisfy the applicable requirements, including:

- Correct Test Type
- Correct taxonomy
- Correct dimension/category mapping
- Correct question/question-version status
- Approved mapping where applicable
- Compatibility with the package/configuration
- Valid scoring relationship
- No disallowed/invalid state

Business rules must use structured metadata and relationships, not question ID naming conventions or prefixes.

Example of a rule that must not remain a primary business rule:

```text
question.id.startsWith("DISC-")
```

---

# 7. Package Validation

Package validation has two distinct levels.

## 7.1 Configuration Validation

Executed when a package is created, edited, versioned, or published.

Checks:

```text
totalQuestions
composition
taxonomy
Test Type
configuration compatibility
timer
required metadata
```

Example:

```text
Total = 24

D = 6
I = 6
S = 6
C = 6

6 + 6 + 6 + 6 = 24 ✓
```

---

## 7.2 Runtime Availability Validation

A package can be configuration-valid but unavailable at runtime.

Example:

```text
Required:
D = 6
I = 6
S = 6
C = 6

Available:
D = 4
I = 20
S = 20
C = 20
```

The package is structurally valid but runtime-unavailable because the D requirement cannot be fulfilled.

Therefore runtime eligibility must be:

```text
PUBLISHED
+
CONFIGURATION VALID
+
QUESTION AVAILABILITY VALID
+
SCORING COMPATIBLE
```

Only then can a package be selected.

---

# 8. Package Selection

When the user clicks **Start Test**, the user does not manually select a package.

The system must:

```text
Start Test
    ↓
Resolve Test Type / entitlement
    ↓
Get runtime-eligible packages
    ↓
Select one package
    ↓
Validate availability
    ↓
Select questions
```

The number of packages is dynamic.

Example:

```text
DISC
  Package 01
  Package 02
  ...
  Package 08
```

The same mechanism must work for any number of packages.

---

# 9. Package Selection Randomization

Package selection should support controlled randomization.

Recommended initial implementation:

```text
eligible packages
      ↓
seeded selection
      ↓
selected package
```

The existing `attemptSeed` concept should be reused where appropriate.

The selected package must be persisted/frozen as part of the attempt.

The system must never re-select a different package merely because the browser is refreshed or the user reconnects.

---

# 10. Question Selection

After package selection:

```text
Selected Package
      ↓
Read Composition Rules
      ↓
Resolve Eligible Question Pool
      ↓
Select required questions per composition
      ↓
Validate final selection
      ↓
Randomize order
      ↓
Snapshot
```

Question selection must satisfy the package composition exactly.

The selection algorithm must be versioned so that historical attempts remain auditable.

---

# 11. Question Order Randomization

Question order must be randomized after the package has been selected and the question set has been resolved.

Example:

```text
Package contains:

Q01
Q02
Q03
...
Q24
```

One attempt may receive:

```text
Q17
Q04
Q22
Q01
...
```

Another attempt may receive:

```text
Q08
Q21
Q03
Q19
...
```

Both attempts may use the same package and question set while receiving different presentation orders.

The randomization must happen **once per attempt**.

It must NOT run again on:

- Browser refresh
- Page navigation
- Reconnect
- Resume
- Reloading an active attempt

The final sequence must be persisted/frozen in `AttemptQuestion.sequence` or the equivalent attempt snapshot structure.

---

# 12. Randomization Principle

V13 must distinguish:

1. Package selection randomization
2. Question selection
3. Question order randomization

These are separate concerns.

Conceptually:

```text
Package Selection
        ↓
Question Selection
        ↓
Question Order Randomization
        ↓
Attempt Snapshot
```

Optional future capability:

```text
Option/choice order randomization
```

This is NOT mandatory for V13 and must only be implemented if compatible with the instrument's scoring model.

---

# 13. Attempt Snapshot

Once an assessment begins, the resolved assessment delivery state must be frozen.

The attempt must retain enough information to reproduce and audit what the user actually received.

At minimum, the attempt snapshot should preserve:

- Package identity
- Package version
- Test Type
- Question IDs/versions
- Question order/sequence
- Question snapshots as already supported by the existing architecture
- Timer configuration
- Attempt seed
- Selection algorithm version
- Relevant assessment configuration version
- Relevant taxonomy/scoring versions

After snapshot creation, changing the current package must not change an existing attempt.

---

# 14. Timer Configuration

Each Question Package must define:

```text
timeLimitSeconds
```

The timer is part of the assessment configuration.

Example:

```text
12 minutes
=
720 seconds
```

Seconds are preferred for storage so the system can support arbitrary durations.

The timer must be frozen into the attempt at start.

---

# 15. Server-Authoritative Timer

The frontend timer is only a presentation/UX mechanism.

The server is the source of truth.

Recommended model:

```text
startedAt
timeLimitSeconds
expiresAt
```

with:

```text
expiresAt = startedAt + timeLimitSeconds
```

The server must determine whether an attempt has expired.

Client/device clock must not be trusted as the authoritative time source.

---

# 16. Connection Loss / Resume

Connection loss must NOT automatically invalidate an active attempt.

Answers must be persisted incrementally.

Recommended flow:

```text
User selects answer
      ↓
Persist answer
      ↓
Server confirms save
```

The frontend may maintain pending/failed local state and retry when connectivity returns.

When the user reconnects:

```text
Reconnect
    ↓
Load existing active attempt
    ↓
Restore frozen question order
    ↓
Restore saved answers
    ↓
Calculate remaining server-authoritative time
    ↓
Continue
```

A new attempt must not be created merely because the browser reloaded or the connection was interrupted.

---

# 17. Browser Refresh / Browser Close

Refreshing or closing the browser must not create a new attempt.

If the existing attempt is still active:

```text
Existing Attempt
    ↓
Resume
```

The following must remain unchanged:

- Package
- Package version
- Question list
- Question sequence
- Saved answers
- Timer/expiry
- Relevant configuration versions

---

# 18. Timeout Handling

When:

```text
now >= expiresAt
```

the attempt must be finalized automatically.

Recommended flow:

```text
TIME EXPIRED
    ↓
Finalize Attempt
    ↓
Persist/finalize available answers
    ↓
Mark unanswered questions appropriately
    ↓
Score
    ↓
Generate Result
```

Frontend timeout handling is useful for UX, but server-side expiry is authoritative.

---

# 19. Unanswered Questions

An unanswered question must not automatically be classified as a wrong answer unless the specific scoring model explicitly defines that behavior.

Recommended representation:

```text
Answered
Unanswered
```

The scoring engine determines the measurement treatment.

This prevents Question Architecture from incorrectly embedding assessment-specific scoring rules.

---

# 20. Attempt Lifecycle

V13 should keep the lifecycle simple and explicit.

Recommended states:

```text
STARTED
SUBMITTED
EXPIRED
```

followed by existing/future finalization/scoring states as appropriate.

Important principle:

> Leaving the assessment page is not automatically equivalent to abandoning the attempt.

An attempt remains resumable while:

```text
status = STARTED
AND
now < expiresAt
```

---

# 21. Expiration Finalization

Expiration should be supported through both:

## A. Lazy expiration

Any relevant request checks:

```text
if now >= expiresAt
    finalize attempt
```

## B. Background finalization

A periodic process finds expired active attempts and finalizes them.

This ensures abandoned browser sessions do not remain indefinitely in `STARTED`.

---

# 22. Autosave / Answer Persistence

Answer persistence must be incremental rather than deferred until final Submit.

The system should save answers as they are selected.

The exact debounce/retry strategy may be optimized during implementation, but the invariant is:

> A successfully persisted answer must survive browser refresh, connection interruption, and resume.

Concurrency handling for multiple tabs/devices should be considered during implementation, with server-side consistency remaining authoritative.

---

# 23. Scoring Boundary

Question Package defines:

- What questions are delivered
- How many are delivered
- Composition
- Timer
- Selection/randomization rules

Question Package must NOT redefine the scoring algorithm.

Conceptually:

```text
Question Package
    ↓
WHAT is presented?

Scoring Configuration
    ↓
HOW is it evaluated?
```

Both configurations must be versioned and associated with the attempt.

---

# 24. Development Scope Boundary

V13 is intentionally limited.

## Included

- Generic Question Package architecture
- Package configuration
- Composition rules
- Composition validation
- Question eligibility boundary
- Runtime availability validation
- Package selection
- Question selection
- Question order randomization
- Attempt snapshot integration
- Timer configuration
- Server-authoritative timer
- Answer persistence/resume
- Timeout/finalization handling
- Relevant E2E/regression coverage

## Explicitly excluded

- Midtrans integration
- Xendit integration
- Email delivery
- WhatsApp delivery
- Payment fulfillment
- Customer access handoff delivery
- Broad redesign of scoring algorithms
- Complete migration/curation of every development question
- Unrelated UI redesign

The existing development question library may remain in the database. V13 only establishes the mechanisms and boundaries required to prevent ineligible questions from entering runtime.

---

# 25. Phase Order

V13 contains **three phases only**.

---

## Phase 13.1 — Question Package & Configuration

### Objective

Create the generic package/configuration foundation.

### Scope

- Question Package model/architecture
- Package ↔ Test Type
- Package versioning
- Package status
- Total question configuration
- Composition rule configuration
- Timer configuration
- Package eligibility metadata
- Package configuration validation foundation

### Exit Criteria

A package can be represented generically for DISC, IQ/Cognitive, EQ, and RIASEC without assessment-specific package models.

A configuration-invalid package cannot be published/runtime-eligible.

---

## Phase 13.2 — Composition Validation & Question Selection

### Objective

Connect packages to eligible questions and build deterministic, auditable selection.

### Scope

- Eligible question pool
- Taxonomy/dimension validation
- Composition validation
- Question availability validation
- Package runtime readiness
- Package selection
- Question selection
- Seeded selection where applicable
- Question order randomization
- Attempt snapshot integration
- Selection algorithm versioning

### Exit Criteria

When a user starts any supported assessment:

```text
Test Type
    ↓
Eligible Package
    ↓
Selected Package
    ↓
Composition-valid Questions
    ↓
Randomized Order
    ↓
Frozen Attempt Snapshot
```

No invalid or composition-incomplete package may enter runtime.

---

## Phase 13.3 — Timed Attempt & Resilience

### Objective

Make the new package-driven assessment runtime reliable under real-world interruptions.

### Scope

- Server-authoritative timer
- `startedAt`
- `expiresAt`
- Timer snapshot
- Incremental answer persistence
- Connection loss handling
- Resume
- Browser refresh handling
- Browser close/reopen handling
- Timeout auto-finalization
- Expired attempt cleanup/finalization
- Unanswered handling
- Relevant concurrency safeguards
- E2E/regression coverage

### Exit Criteria

The assessment remains correct and recoverable under:

- Normal completion
- Browser refresh
- Browser close/reopen
- Temporary connection loss
- Reconnection
- Timeout
- Partial completion
- Unanswered questions

---

# 26. V13 Completion Gate

V13 is complete only when all three phases pass.

Required final validation:

```text
Typecheck
Production build
Database migration validation
Package configuration validation
Composition validation
Question availability validation
DISC E2E
IQ/Cognitive E2E
EQ E2E
RIASEC E2E
Randomization persistence E2E
Resume/reconnect E2E
Timeout E2E
Regression E2E
```

The exact test matrix may be expanded during implementation.

---

# 27. Non-Negotiable Architectural Rules

The following rules are locked for V13.

### Rule 1
Question Package is generic and applies to all assessment types.

### Rule 2
The number of packages per assessment type is dynamic, not hard-coded.

### Rule 3
A package must pass configuration validation before publication/runtime use.

### Rule 4
A package must also pass runtime question-availability validation.

### Rule 5
Question eligibility must use structured metadata/relationships, not ID prefixes.

### Rule 6
Composition is a delivery/measurement constraint and must be validated before runtime.

### Rule 7
Package selection and question order randomization are separate concerns.

### Rule 8
Randomization occurs once per attempt and is then frozen.

### Rule 9
`AttemptQuestion.sequence` or equivalent snapshot data is authoritative for presentation order.

### Rule 10
An active attempt must not change package, questions, sequence, timer, or relevant configuration because of a refresh, reconnect, or later package edits.

### Rule 11
The server is authoritative for assessment time.

### Rule 12
Connection loss does not automatically invalidate an active attempt.

### Rule 13
Persisted answers must survive refresh, reconnect, and resume.

### Rule 14
Timeout must finalize the attempt server-side.

### Rule 15
Unanswered does not automatically mean incorrect.

### Rule 16
Question Package does not contain scoring logic.

### Rule 17
Historical attempts must remain auditable and reproducible.

### Rule 18
V13 must extend the existing architecture rather than rewrite the established Question/Attempt/Scoring foundations unless implementation evidence proves a change is necessary.

### Rule 19
V13 must remain limited to Question Architecture and timed assessment resilience.

### Rule 20
Payment and customer access delivery are outside V13.

---

# 28. Recommended Runtime Flow

The canonical V13 runtime flow is:

```text
USER
  │
  ▼
START TEST
  │
  ▼
RESOLVE TEST TYPE / ACCESS
  │
  ▼
GET RUNTIME-ELIGIBLE PACKAGES
  │
  ▼
SELECT ONE PACKAGE
  │
  ▼
VALIDATE PACKAGE AVAILABILITY
  │
  ▼
SELECT QUESTIONS BY COMPOSITION
  │
  ▼
RANDOMIZE QUESTION ORDER
  │
  ▼
CREATE ATTEMPT SNAPSHOT
  │
  ├── package
  ├── package version
  ├── questions
  ├── sequence
  ├── timer
  ├── attempt seed
  └── configuration/scoring versions
  │
  ▼
START ASSESSMENT
  │
  ├── answer → persist
  ├── reconnect → resume
  ├── refresh → resume
  ├── close/reopen → resume
  │
  ├───────────────┐
  ▼               ▼
SUBMIT          TIMEOUT
  │               │
  └───────┬───────┘
          ▼
      FINALIZE
          ▼
        SCORE
          ▼
        RESULT
```

---

# 29. Future Extensions

The following may be considered after V13 and must not silently expand V13 scope:

- Option/choice randomization
- More advanced package balancing
- Exposure control
- Package rotation strategies
- Statistical form balancing
- Adaptive testing
- Question difficulty balancing
- Blueprint constraints beyond simple composition
- Package analytics
- Content review workflow
- Automated item-quality analysis

---

# 30. Final V13 Principle

The central principle of V13 is:

> **A Question Package defines a validated assessment form; the runtime selects one valid form, resolves a composition-valid question set, randomizes its presentation order once, freezes the resulting attempt, and executes it under a server-authoritative timer.**

This architecture must remain generic so that adding more packages does not require creating another assessment-specific engine.

# 31. Phase yang dikunci dalam dokumen:

V13.1  Question Package Configuration
V13.2  Composition Validation & Question Selection
V13.3  Timed Attempt & Resilience

V13.4  Production Assessment Blueprint
V13.5  Production Question Pool
V13.6  Mapping & Content Review
V13.7  Scoring Validation
V13.8  Package Configuration
V13.9  Publish & Production Eligibility
V13.10 Production E2E & Customer Readiness


# 32. Tabel Relevansi Data
| File / Dataset                                           | Isi                                |                Tipe Question |     Jumlah | Relevansi V13                           | Status yang saya sarankan               |
| -------------------------------------------------------- | ---------------------------------- | ---------------------------: | ---------: | --------------------------------------- | --------------------------------------- |
| `DISC_V2_SITUATIONAL_FORCED_CHOICE_PRODUCTION_BANK.json` | Bank DISC V2 production            | `SCENARIO` / Forced Choice 4 |     **24** | 🟢 **SANGAT RELEVAN**                   | Kandidat production utama               |
| `EQ_V2_SJT_PRODUCTION_BANK.json`                         | Bank EQ V2                         |           `SCENARIO` / SJT 4 |     **24** | 🟢 **SANGAT RELEVAN**                   | Kandidat production utama               |
| `COGNITIVE_V2_PRODUCTION_BANK.json`                      | Bank Cognitive V2                  |            `SINGLE_CHOICE` 4 |     **24** | 🟢 **SANGAT RELEVAN**                   | Kandidat production utama               |
| `RIASEC_V2_PREFERENCE_PRODUCTION_BANK.json`              | Bank RIASEC V2                     |      `PREFERENCE` / Likert 5 |     **60** | 🟢 **SANGAT RELEVAN**                   | Kandidat production utama               |
| `RIASEC_QB_V1_TARGET_60.csv`                             | Candidate RIASEC V1                |                     `LIKERT` |     **60** | 🟢 Relevan                              | Legacy V1 / referensi                   |
| `RIASEC_QB_V1_FULL_84_CANDIDATE.csv`                     | Candidate RIASEC V1                |                     `LIKERT` |     **84** | 🟢 Relevan                              | Candidate/review source                 |
| `RIASEC_QB_V1_RESERVE_24.csv`                            | Reserve RIASEC V1                  |                     `LIKERT` |     **24** | 🟢 Relevan                              | Reserve                                 |
| `RIASEC_V1 review/*.csv`                                 | Review RIASEC                      |                     `LIKERT` |   84 total | 🟡 Supporting                           | Audit/review, bukan production langsung |
| `RIASEC_V1 production/*.csv`                             | Production candidate/manifest      |                     `LIKERT` |    60 + 24 | 🟡 Supporting                           | V1 production history                   |
| `ReadyScore_BankSoal_0201-2000.csv`                      | Legacy general question bank       |            Positive/Negative | **~1.800** | 🔴 **TIDAK untuk DISC/EQ/IQ/RIASEC**    | Jangan dipakai sebagai source V13       |
| `ReadyScore_QuestionBank_Test_200_Additional.csv`        | General readiness questions        |                   `LIKERT_5` |    **200** | 🔴 Tidak cocok untuk 4 instrumen V13    | Jangan dipakai                          |
| `ReadyScore_BankSoal_Part_01.csv`                        | Legacy partial bank                |            Positive/Negative |     **25** | 🔴 Tidak cocok                          | Jangan dipakai                          |
| `question-bank.json`                                     | Legacy consolidated bank           | Likert / Positive / Negative |  **1.825** | 🔴 Tidak untuk 4 instrumen V13          | Legacy boundary                         |
| `admin-question-bank.json`                               | Imported version dari 1.825 legacy | Likert / Positive / Negative |  **1.825** | 🔴 Tidak untuk 4 instrumen V13          | Legacy                                  |
| `AppRS-Sample-Question-Banks-100x4.zip`                  | Sample 100 soal × 4 instrumen      |            DISC/EQ/IQ/RIASEC |    **400** | 🟡 **SANGAT BERGUNA sebagai referensi** | Jangan langsung anggap production       |
