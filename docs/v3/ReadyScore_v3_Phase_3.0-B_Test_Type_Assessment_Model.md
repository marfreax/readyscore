# ReadyScore v3 — Phase 3.0-B
# Test Type & Assessment Model

**Product:** ReadyScore  
**Phase:** 3.0-B  
**Version:** 1.0  
**Status:** DESIGN / ARCHITECTURE BASELINE  
**Depends on:** Phase 3.0-A — Current v2 Architecture & Scoring Audit  
**Primary source:** RS-2.0 existing source and v3 Master Roadmap  
**Purpose:** Lock the conceptual model for multiple assessment instruments before database/schema implementation.

---

# 1. PURPOSE

Phase 3.0-B defines the conceptual boundary between:

```text
PRODUCT
TEST TYPE
ASSESSMENT
QUESTION BANK
SELECTION MODEL
SCORING MODEL
RESULT MODEL
PROFILE
```

The goal is to evolve the existing ReadyScore v2 architecture from a **single assessment instrument** into a **multi-instrument assessment platform** without discarding the strong v2 runtime, versioning, snapshot, and question-bank foundations.

This phase is architecture/design work.

It does **not** implement the new database schema yet.

---

# 2. V2 BASELINE

The v2 source establishes the following model:

```text
Question Bank
      ↓
Assessment Configuration
      ↓
Assessment Attempt
      ↓
Attempt Question
      ↓
Answer
      ↓
Scoring
      ↓
Assessment Result
```

The v2 product uses:

```text
FREE_V1
20 questions

PREMIUM_V1
100 questions
```

Both are configurations of the same assessment instrument.

The v2 architecture also has:

```text
Question
QuestionVersion
AssessmentAttempt
AttemptQuestion
Answer
AssessmentResult
```

plus version references such as:

```text
assessmentConfigurationVersion
questionBankVersion
taxonomyVersion
scoringVersion
selectionAlgorithmVersion
```

These are retained as important v3 foundations.

---

# 3. V3 ARCHITECTURAL SHIFT

V2 effectively models:

```text
ONE ASSESSMENT
    ↓
ONE QUESTION BANK
    ↓
ONE SCORING MODEL
    ↓
ONE RESULT MODEL
```

V3 must model:

```text
MULTIPLE TEST TYPES
        ↓
TEST-SPECIFIC ASSESSMENT SYSTEMS
        ↓
TEST-SPECIFIC QUESTION BANK
        ↓
TEST-SPECIFIC SCORING MODEL
        ↓
TEST-SPECIFIC RESULT MODEL
```

The platform runtime remains shared.

The measurement model becomes instrument-specific.

---

# 4. CORE DEFINITIONS

## 4.1 Product

A **Product** is the commercial offering purchased or accessed by a user.

Examples:

```text
ReadyScore Basic
ReadyScore Medium
ReadyScore Advance
```

A Product is not itself a psychological/educational measurement instrument.

---

## 4.2 Product Tier

A **Product Tier** defines the commercial level of access.

Initial commercial concept:

```text
FREE TRIAL
BASIC
MEDIUM
ADVANCE
```

Baseline pricing concept:

| Tier | Price |
|---|---:|
| Free Trial | Rp0 |
| Basic | Rp99.000 |
| Medium | Rp199.000 |
| Advance | Rp299.000 |

Prices remain commercial planning values until separately locked.

Product Tier determines entitlement.

It does not define the measurement mathematics.

---

# 5. TEST TYPE

A **Test Type** identifies the assessment instrument being administered.

Initial candidate Test Types:

```text
COGNITIVE
EQ
AQ
DISC
RIASEC
STRENGTH
LEARNING
```

The list is extensible.

Adding a Test Type must not require creating a separate application.

---

# 6. TEST TYPE IS NOT PRODUCT TIER

This distinction is mandatory.

Incorrect:

```text
AssessmentType
├── FREE
├── BASIC
├── MEDIUM
└── ADVANCE
```

Correct conceptual model:

```text
PRODUCT TIER
    ↓
ENTITLEMENTS
    ↓
TEST ACCESS
```

Example:

```text
RIASEC
```

is a Test Type.

```text
MEDIUM
```

is a Product Tier.

They are different dimensions.

---

# 7. ASSESSMENT

An **Assessment** is an executable instance/configuration of a Test Type.

Conceptually:

```text
TEST TYPE
    ↓
ASSESSMENT CONFIGURATION
    ↓
ASSESSMENT ATTEMPT
```

Example:

```text
Test Type:
RIASEC

Assessment Configuration:
RIASEC_STANDARD_V1

Assessment Attempt:
AT-2026-000123
```

The Assessment Configuration defines how that Test Type is administered.

---

# 8. ASSESSMENT CONFIGURATION

Assessment Configuration controls runtime behavior without changing the underlying Test Type.

Minimum conceptual responsibilities:

```text
question count
selection model
question bank
taxonomy version
scoring model
result model
completion rule
eligibility rule
```

Example:

```text
RIASEC_STANDARD_V1
```

could reference:

```text
Question Bank:
RIASEC_QB_V1

Selection:
SELECTION_RIASEC_V1

Scoring:
RIASEC_SCORE_V1

Result:
RIASEC_RESULT_V1
```

---

# 9. QUESTION BANK

A Question Bank is a logical collection of questions eligible for a particular measurement context.

The v2 principle remains valid:

> Question Bank and Assessment Configuration are different concepts.

V3 extends this into:

```text
PHYSICAL QUESTION REPOSITORY
          │
          ├── Cognitive logical bank
          ├── EQ logical bank
          ├── AQ logical bank
          ├── DISC logical bank
          ├── RIASEC logical bank
          ├── Strength logical bank
          └── Learning logical bank
```

One physical repository is preferred where practical.

Separate database tables for every Test Type are not required.

The measurement context must, however, be explicit and auditable.

---

# 10. QUESTION OWNERSHIP

A question must have an explicit measurement context.

Conceptually:

```text
Question
   ↓
Test Type / Instrument
   ↓
Taxonomy Mapping
```

A question cannot be assumed to be reusable across different tests merely because its wording appears relevant.

Example:

```text
A DISC question
```

must not automatically become:

```text
an EQ question
```

without explicit measurement validation and mapping.

---

# 11. SELECTION MODEL

Selection is part of the assessment instrument.

V2 already defines:

```text
Assessment Configuration
    ↓
Eligibility Filter
    ↓
Taxonomy Quota
    ↓
Question Selection
    ↓
Deterministic Shuffle
    ↓
Assessment Snapshot
```

V3 retains this concept.

However, selection rules become Test Type-specific where required.

Example:

```text
DISC
→ forced-choice balancing

RIASEC
→ interest-dimension balancing

COGNITIVE
→ difficulty + ability-domain balancing

LIKERT PERSONALITY TEST
→ dimension/indicator balancing
```

The selection engine therefore becomes a shared runtime with test-specific configuration/strategy.

---

# 12. SCORING MODEL

A Scoring Model defines how responses become measurement results.

This is one of the most important v3 abstractions.

Examples:

```text
COGNITIVE_SCORE_V1
EQ_SCORE_V1
AQ_SCORE_V1
DISC_SCORE_V1
RIASEC_SCORE_V1
STRENGTH_SCORE_V1
```

The current:

```text
SCORING_V1
```

is treated as one existing scoring implementation.

It is not the universal ReadyScore scoring model.

---

# 13. RESPONSE MODEL

V2 currently uses:

```text
LIKERT_5
```

V3 must not assume all Test Types use the same answer mechanism.

Potential response models:

```text
LIKERT_5
LIKERT_7
SINGLE_CHOICE
MULTIPLE_CHOICE
FORCED_CHOICE
CORRECT_INCORRECT
RANKING
```

This does not mean all of these must be implemented immediately.

It means the architecture must not prevent them.

---

# 14. TEST-SPECIFIC SCORING

Different instruments can have fundamentally different mathematics.

## Cognitive

```text
Correct / Incorrect
        ↓
Raw Correct
        ↓
Ability Dimensions
        ↓
Cognitive Profile
```

## DISC

```text
Responses
        ↓
D / I / S / C scores
        ↓
Dominant Profile
```

## RIASEC

```text
Responses
        ↓
R / I / A / S / E / C
        ↓
Interest Profile
```

## EQ

```text
Responses
        ↓
EQ Dimensions
        ↓
Emotional Profile
```

Therefore the scoring contract must support multiple implementations.

---

# 15. COMMON SCORING CONTRACT

Although scoring algorithms differ, the platform should define a common execution boundary.

Conceptually:

```text
ScoringRequest
    ├── testType
    ├── scoringVersion
    ├── assessment metadata
    ├── selected questions
    └── answers

        ↓

ScoringModel

        ↓

ScoringResult
```

The common contract should guarantee:

```text
deterministic execution
version traceability
validation
quality/coverage metadata where applicable
result persistence compatibility
```

The internal mathematical model remains Test Type-specific.

---

# 16. RESULT MODEL

An Assessment Result has two conceptual layers.

## Common Result Envelope

```text
attemptId
testType
assessmentType/configuration
assessmentConfigurationVersion
questionBankVersion
taxonomyVersion
scoringVersion
completedAt
status
quality
coverage
```

## Test-Specific Result Payload

Example:

```text
DISC:
D
I
S
C
primary
secondary
profile
```

or:

```text
RIASEC:
R
I
A
S
E
C
topCode
profile
```

or:

```text
COGNITIVE:
logical
numerical
verbal
spatial
abilityProfile
```

The common envelope is shared.

The payload is instrument-specific.

---

# 17. RESULT IS NOT PROFILE

This distinction is mandatory.

A:

```text
DISC Result
```

is not the same thing as:

```text
Personal Profile
```

A:

```text
RIASEC Result
```

is not the same thing as:

```text
Study Direction
```

The layers are:

```text
TEST RESULT
      ↓
CROSS-TEST PROFILE
      ↓
DIRECTION / RECOMMENDATION
```

---

# 18. CROSS-TEST PROFILE

The Cross-Test Profile is a synthesis layer.

Example:

```text
Cognitive Result
EQ Result
AQ Result
DISC Result
RIASEC Result
Strength Result
Learning Result
        ↓
CROSS-TEST PROFILE
```

It must not simply do:

```text
average all scores
```

because the underlying scales and constructs may not be mathematically comparable.

Instead it must operate on explicitly defined normalized dimensions, relationships, rules, and evidence.

This layer belongs to a later phase.

---

# 19. STUDY DIRECTION

Study Direction is downstream from measurement.

Conceptually:

```text
Cross-Test Profile
        ↓
Study Direction
```

Example output:

```text
Technology & Computing
Business & Management
Engineering
Health & Life Sciences
Creative & Communication
Social Sciences
```

The system should communicate these as directional recommendations, not absolute determinations.

---

# 20. MAJOR FIT

Major Fit is another downstream layer:

```text
Cross-Test Profile
        ↓
Study Direction
        ↓
Major Fit
```

Potential output:

```text
Computer Science
Information Systems
Industrial Engineering
Psychology
Business
Communication
Architecture
```

The actual recommendation model is outside Phase 3.0-B.

---

# 21. CAREER EXPLORATION

Career exploration is downstream:

```text
Personal Profile
      ↓
Study Direction
      ↓
Major Fit
      ↓
Career Exploration
```

It should not be generated directly from a single raw test score.

---

# 22. PRODUCT ENTITLEMENT BOUNDARY

Commercial access is represented separately:

```text
USER
 ↓
PRODUCT PURCHASE / SUBSCRIPTION
 ↓
PRODUCT TIER
 ↓
ENTITLEMENT
 ↓
AVAILABLE TESTS
 ↓
AVAILABLE RESULTS / INSIGHTS
```

Example conceptual entitlement:

```text
TEST_ACCESS: RIASEC
TEST_ACCESS: DISC
PROFILE_ACCESS: CROSS_TEST
REPORT_ACCESS: ADVANCED
DIRECTION_ACCESS: STUDY
MAJOR_FIT_ACCESS: TRUE
CAREER_ACCESS: TRUE
```

This is preferred over scattered:

```text
if plan === "ADVANCE"
```

checks throughout the application.

---

# 23. DASHBOARD RELATIONSHIP

The dashboard is composed from entitlement.

```text
USER
 ↓
ENTITLEMENT
 ↓
DASHBOARD COMPOSITION
```

Therefore:

### Free Trial

```text
Trial Assessment
Basic Result
Upgrade Opportunities
```

### Basic

```text
Available Tests
Completed Results
Basic Profile
```

### Medium

```text
Multiple Test Results
Cross-Test Profile
Profile Insights
```

### Advance

```text
Full Profile
Study Direction
Major Fit
Career Exploration
Advanced Reports
```

The exact commercial mapping is a later product-locking step.

---

# 24. V2 → V3 MAPPING

| V2 | V3 |
|---|---|
| `AssessmentType = free/premium` | Product Tier + Assessment Configuration |
| `AssessmentConfiguration` | Retained, generalized |
| `Question` | Retained |
| `QuestionVersion` | Retained |
| `QuestionMapping` | Retained/generalized |
| `AssessmentAttempt` | Retained |
| `AttemptQuestion` | Retained |
| `Answer` | Generalized to response model |
| `AssessmentResult` | Common envelope + test-specific payload |
| `SCORING_V1` | One scoring implementation |
| `SELECTION_V1` | Shared runtime + test-specific configuration/strategy |
| 8-domain taxonomy | Test-specific taxonomy |
| Free/Premium | Commercial entitlement |
| Overall ReadyScore | Test-specific result semantics |

---

# 25. TAXONOMY MODEL

V2 uses:

```text
Domain
 ↓
Subdomain
 ↓
Indicator
 ↓
Question
```

V3 retains this hierarchy where it is appropriate.

However, the semantic meaning of the hierarchy belongs to the Test Type.

Example:

```text
RIASEC
    ↓
Interest Dimension
    ↓
Interest Indicator
    ↓
Question
```

versus:

```text
DISC
    ↓
Behavior Dimension
    ↓
Behavior Indicator
    ↓
Question
```

Therefore the database can remain structurally generic while the measurement semantics are Test Type-specific.

---

# 26. COMPLETION / SUFFICIENCY MODEL

V2 has rules such as:

```text
6 / 8 domains = COMPLETE
```

This must not become a universal v3 rule.

Instead:

```text
Test Type
    ↓
Sufficiency Model
```

Example:

```text
DISC
→ minimum dimension evidence

RIASEC
→ sufficient responses across interest dimensions

Cognitive
→ sufficient valid scored items per ability dimension
```

The exact rules are defined by the corresponding measurement model.

---

# 27. SCORE BANDS

V2 uses interpretation bands:

```text
0–39.99  Perlu Pengembangan
40–59.99 Cukup
60–74.99 Baik
75–89.99 Sangat Baik
90–100   Unggul
```

These must NOT automatically be applied to every Test Type.

A DISC profile, RIASEC profile, and cognitive ability result have different semantics.

Therefore:

```text
Test Type
 ↓
Interpretation Model
 ↓
Bands / Labels / Profile Semantics
```

---

# 28. VERSIONING

Every executable assessment must preserve the versions that determine its behavior.

Minimum:

```text
assessmentConfigurationVersion
questionBankVersion
taxonomyVersion
scoringVersion
selectionAlgorithmVersion
```

V3 adds the conceptual requirement that the Test Type / Instrument identity is also immutable for the attempt.

A completed result must remain interpretable after future versions are published.

---

# 29. SNAPSHOT PRINCIPLE

The v2 immutable attempt snapshot is retained.

Conceptually:

```text
Assessment Attempt
    ↓
Test Type Version
    ↓
Assessment Configuration Version
    ↓
Question Bank Version
    ↓
Selection Version
    ↓
Scoring Version
```

A later Question Bank change must not alter an existing attempt.

---

# 30. WHAT V3 MUST NOT DO

V3 must not:

- create one giant universal scoring formula;
- force every test into Likert 1–5;
- force every test into 0–100;
- force every test into one `overallScore`;
- force every test into the current 8-domain taxonomy;
- use Product Tier as Test Type;
- average unrelated test scores into one fake score;
- infer a major directly from one raw assessment;
- rewrite v2 snapshot/versioning without necessity;
- duplicate the entire runtime for every test.

---

# 31. RECOMMENDED INTERNAL ABSTRACTION

Conceptually:

```text
AssessmentInstrument
    ├── TestType
    ├── AssessmentConfiguration
    ├── QuestionBank
    ├── SelectionModel
    ├── ScoringModel
    ├── ResultModel
    └── InterpretationModel
```

Example:

```text
RIASEC_INSTRUMENT_V1
    ├── TestType: RIASEC
    ├── Configuration: RIASEC_STANDARD_V1
    ├── QuestionBank: RIASEC_QB_V1
    ├── Selection: RIASEC_SELECTION_V1
    ├── Scoring: RIASEC_SCORE_V1
    ├── Result: RIASEC_RESULT_V1
    └── Interpretation: RIASEC_INTERPRETATION_V1
```

This is a conceptual model first.

Database representation will be decided after Phase 3.0-B.

---

# 32. INITIAL TEST CATALOG

The following is the **candidate catalog**, not yet a scientific validation claim.

| Test Type | Primary Purpose | Candidate Result |
|---|---|---|
| Cognitive / IQ | Cognitive ability | Ability profile |
| EQ | Emotional capability dimensions | EQ profile |
| AQ | Adversity / response to challenge | AQ profile |
| DISC | Behavioral style | D/I/S/C profile |
| RIASEC | Vocational interest | R/I/A/S/E/C profile |
| Strength | Strength dimensions | Strength profile |
| Learning | Learning-related profile | Learning profile |

The actual constructs, item design, scoring, interpretation, and validity requirements must be defined before each instrument becomes production-ready.

---

# 33. RELATIONSHIP MODEL

The intended relationship is:

```text
PRODUCT
  │
  └── PRODUCT TIER
          │
          └── ENTITLEMENT
                  │
                  └── TEST TYPE
                          │
                          └── ASSESSMENT CONFIGURATION
                                  │
                                  ├── QUESTION BANK
                                  ├── SELECTION MODEL
                                  ├── SCORING MODEL
                                  ├── RESULT MODEL
                                  └── INTERPRETATION MODEL
                                          │
                                          ▼
                                  ASSESSMENT RESULT
                                          │
                                          ▼
                                  CROSS-TEST PROFILE
                                          │
                                          ▼
                                  DIRECTION ENGINE
```

---

# 34. DATABASE DIRECTION — NOT YET IMPLEMENTATION

The conceptual model suggests future entities such as:

```text
TestType
AssessmentInstrument
AssessmentConfiguration
AssessmentConfigurationVersion
QuestionBank / QuestionBankVersion
ScoringModel
ResultModel
InterpretationModel
Product
ProductTier
Entitlement
```

Existing entities such as:

```text
Question
QuestionVersion
AssessmentAttempt
AttemptQuestion
Answer
AssessmentResult
```

should be evaluated for extension before replacement.

No migration should be written as part of this phase.

---

# 35. PHASE 3.0-B DECISIONS

The following are proposed as architecture locks after review:

### LOCK 01
Test Type and Product Tier are separate concepts.

### LOCK 02
An Assessment is an executable configuration of a Test Type.

### LOCK 03
Question Bank is separate from Assessment Configuration.

### LOCK 04
Selection Model is part of the assessment instrument contract.

### LOCK 05
Scoring Model is Test Type-specific.

### LOCK 06
Result Model is Test Type-specific.

### LOCK 07
Interpretation Model is Test Type-specific.

### LOCK 08
Cross-Test Profile is a synthesis layer, not a scoring layer.

### LOCK 09
Study Direction / Major Fit / Career Exploration are downstream decision-support layers.

### LOCK 10
Commercial access is controlled through entitlement.

### LOCK 11
Dashboard composition is entitlement-aware.

### LOCK 12
V2 versioning and attempt snapshot principles are retained.

---

# 36. OPEN ITEMS BEFORE IMPLEMENTATION

The following must remain explicitly open:

```text
1. Final Test Type catalog
2. Scientific/measurement definition of each construct
3. Exact taxonomy for each Test Type
4. Response model per Test Type
5. Selection strategy per Test Type
6. Scoring formula per Test Type
7. Sufficiency rules per Test Type
8. Result schema per Test Type
9. Interpretation rules per Test Type
10. Commercial tier-to-test mapping
11. Cross-Test Profile methodology
12. Study Direction methodology
13. Major Fit methodology
14. Career Exploration methodology
```

These are not to be guessed during implementation.

---

# 37. EXIT CRITERIA

Phase 3.0-B is PASS when the team agrees that:

```text
Test Type
Assessment
Product
Product Tier
Entitlement
Question Bank
Selection Model
Scoring Model
Result Model
Interpretation Model
Cross-Test Profile
Direction Engine
```

are distinct concepts with explicit boundaries.

Additionally:

- [ ] V2 foundations identified for reuse.
- [ ] V2 assumptions identified for generalization.
- [ ] Test-specific scoring accepted as a first-class concept.
- [ ] Test-specific result accepted as a first-class concept.
- [ ] Product Tier separated from Test Type.
- [ ] Entitlement identified as commercial access boundary.
- [ ] Dashboard identified as entitlement-aware.
- [ ] Cross-Test Profile separated from raw result.
- [ ] Study/Major/Career separated from raw scoring.
- [ ] No database migration implemented prematurely.

---

# 38. NEXT PHASE

After Phase 3.0-B is approved:

```text
PHASE 3.0-C
Test-Specific Assessment Contract
```

The next phase should define the actual contract of an instrument:

```text
Test Type
    ↓
Construct
    ↓
Dimensions
    ↓
Question / Response Model
    ↓
Selection
    ↓
Scoring
    ↓
Result
    ↓
Interpretation
```

Only after that should we decide the exact v3 database/schema changes.

---

# END OF PHASE 3.0-B
