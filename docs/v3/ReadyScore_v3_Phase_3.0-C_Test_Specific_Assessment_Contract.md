# ReadyScore v3 — Phase 3.0-C
# Test-Specific Assessment Contract

**Product:** ReadyScore  
**Phase:** 3.0-C  
**Version:** 1.0  
**Status:** DESIGN / CONTRACT BASELINE  
**Depends on:** Phase 3.0-A and Phase 3.0-B  
**Purpose:** Define the formal contract that every ReadyScore assessment instrument must satisfy before implementation.

---

# 1. PURPOSE

Phase 3.0-C turns the conceptual model from Phase 3.0-B into an explicit **Test-Specific Assessment Contract**.

The contract answers:

> "What must be defined before ReadyScore can execute, score, interpret, and persist a particular Test Type?"

The contract is deliberately generic enough to support:

```text
COGNITIVE
EQ
AQ
DISC
RIASEC
STRENGTH
LEARNING
```

without forcing all of them into one scoring formula, response format, taxonomy, or result shape.

---

# 2. CORE PRINCIPLE

Every Test Type must be represented by an assessment instrument contract:

```text
TEST TYPE
    ↓
CONSTRUCT
    ↓
DIMENSIONS
    ↓
RESPONSE MODEL
    ↓
QUESTION MODEL
    ↓
SELECTION MODEL
    ↓
SCORING MODEL
    ↓
SUFFICIENCY MODEL
    ↓
RESULT MODEL
    ↓
INTERPRETATION MODEL
```

This contract is the boundary between:

```text
MEASUREMENT DEFINITION
```

and:

```text
PLATFORM RUNTIME
```

The runtime should execute the contract.

The runtime must not invent the measurement rules.

---

# 3. INSTRUMENT IDENTITY

Every assessment instrument requires an explicit identity.

Minimum conceptual fields:

```text
instrumentId
instrumentCode
instrumentName
testType
version
status
description
purpose
```

Example:

```text
instrumentCode:
RIASEC_STANDARD

testType:
RIASEC

version:
V1
```

The identity must be versionable.

A new measurement definition must not silently mutate an existing production instrument.

---

# 4. TEST TYPE

`TestType` is the stable category of the instrument.

Examples:

```text
COGNITIVE
EQ
AQ
DISC
RIASEC
STRENGTH
LEARNING
```

`TestType` answers:

> "What kind of measurement is this?"

It does not answer:

> "Which version/configuration was administered?"

That responsibility belongs to the Assessment Configuration / Instrument Version.

---

# 5. CONSTRUCT

Every instrument must define what it claims to measure.

Minimum conceptual definition:

```text
constructCode
constructName
constructDefinition
measurementPurpose
population
interpretationBoundary
```

Example:

```text
Test Type:
RIASEC

Construct:
Vocational / occupational interest profile
```

The exact scientific definition must be supplied by the instrument specification.

ReadyScore must not silently invent construct definitions during coding.

---

# 6. CONSTRUCT BOUNDARY

A construct must explicitly define:

```text
WHAT IS MEASURED
WHAT IS NOT MEASURED
```

For example, an interest assessment should not automatically be interpreted as:

```text
ability
intelligence
academic achievement
personality
```

Likewise:

```text
DISC
```

should not automatically be interpreted as:

```text
intelligence
career suitability
academic ability
clinical diagnosis
```

The assessment contract must preserve these boundaries.

---

# 7. DIMENSION MODEL

Every Test Type must define its dimensions.

Conceptually:

```text
CONSTRUCT
    ↓
DIMENSION 1
DIMENSION 2
DIMENSION 3
...
```

Examples:

### DISC

```text
D
I
S
C
```

### RIASEC

```text
R
I
A
S
E
C
```

### Cognitive

Potentially:

```text
Logical
Numerical
Verbal
Spatial
```

The actual dimensions are not locked by this phase unless separately validated.

---

# 8. DIMENSION CONTRACT

Every dimension should define:

```text
dimensionCode
dimensionName
definition
description
order
measurementRole
```

Optional:

```text
parentDimension
weight
minimumEvidence
interpretationRule
```

The important principle is:

> Dimension semantics belong to the Test Type, not to the generic scoring engine.

---

# 9. QUESTION MODEL

A question belongs to a measurement context.

Minimum conceptual question contract:

```text
questionId
questionVersion
instrumentId
dimensionId
text
responseModel
reverseScore
weight
status
```

Additional fields may include:

```text
subdimension
indicator
difficulty
source
mappingStatus
```

The existing v2 Question / QuestionVersion model should be reused where possible.

---

# 10. QUESTION VERSION

Question text and measurement metadata are versioned.

Conceptually:

```text
Question
    ↓
QuestionVersion
```

A version may change:

```text
text
dimension mapping
reverseScore
weight
difficulty
scoring metadata
status
```

A completed attempt must retain the exact QuestionVersion used.

---

# 11. RESPONSE MODEL CONTRACT

The instrument must explicitly declare how the respondent answers.

Supported architecture should allow:

```text
LIKERT_5
LIKERT_7
SINGLE_CHOICE
MULTIPLE_CHOICE
FORCED_CHOICE
CORRECT_INCORRECT
RANKING
```

This is an extensibility requirement.

It does not mean all response models must be implemented in Phase 3.

---

# 12. RESPONSE VALIDATION

The instrument contract defines valid responses.

Examples:

### Likert 5

```text
1
2
3
4
5
```

### Correct / Incorrect

```text
CORRECT
INCORRECT
```

### Single Choice

```text
optionId
```

The runtime validates according to the Test Type's response model.

A generic:

```text
Number(value)
```

validation must not be assumed for every future instrument.

---

# 13. SELECTION MODEL CONTRACT

The instrument defines how questions are selected.

Minimum:

```text
selectionModelCode
selectionVersion
targetQuestionCount
eligibilityRules
balancingRules
randomizationRules
```

Potential balancing dimensions:

```text
domain
subdomain
indicator
difficulty
dimension
question orientation
question diversity
```

Selection must produce a deterministic attempt snapshot.

---

# 14. DETERMINISTIC SELECTION

The v2 principle is retained.

Conceptually:

```text
Attempt Seed
     ↓
Selection Model
     ↓
Selected Questions
     ↓
Sequence
     ↓
AttemptQuestion Snapshot
```

The same attempt configuration + seed + bank version should be reproducible.

A future selection algorithm version must not change the interpretation of historical attempts.

---

# 15. SCORING MODEL CONTRACT

Every instrument must explicitly identify its scoring model.

Minimum:

```text
scoringModelCode
scoringVersion
responseTransformation
aggregationMethod
normalizationMethod
sufficiencyRule
```

Optional:

```text
dimensionWeights
reverseScoringRules
itemWeights
subdimensionRules
profileDerivationRules
```

The scoring implementation must be deterministic.

---

# 16. SCORING IS NOT NECESSARILY 0–100

The contract must permit result semantics such as:

```text
raw score
scaled score
percentile
standard score
dimension vector
profile code
rank
band
```

A 0–100 score may be used where appropriate.

It is not a universal requirement.

---

# 17. NORMALIZATION

Normalization is defined by the Test Type / Scoring Model.

Examples:

```text
Likert 1–5
→ 0–100

Correct answers
→ percentage

Standardized ability
→ standardized score

RIASEC
→ dimension profile
```

The runtime must not assume:

```text
score = normalized 0–100
```

for every instrument.

---

# 18. SUFFICIENCY MODEL

Every instrument must define when the result is sufficiently supported.

Minimum conceptual fields:

```text
minimumAnswered
minimumEvidencePerDimension
minimumCoverage
completionRule
```

The v2 rule:

```text
6 of 8 domains
```

is treated as a **test-specific rule**, not a platform rule.

---

# 19. COMPLETION STATUS

The common runtime should support:

```text
IN_PROGRESS
COMPLETED
PARTIAL
ABANDONED
INVALID
```

But the instrument determines whether a completed response set is:

```text
scoreable
interpretable
reportable
```

These are distinct concepts.

---

# 20. QUALITY MODEL

A result should carry quality metadata where the instrument supports it.

Potential fields:

```text
answeredCount
validResponseCount
coverage
dimensionCoverage
insufficientDimensions
qualityFlags
```

Additional psychometric quality checks may later include:

```text
response consistency
attention checks
response time anomalies
invalid pattern detection
```

These are future capabilities, not mandatory Phase 3.0 implementation.

---

# 21. RESULT MODEL CONTRACT

Every instrument must define what its result means.

Minimum:

```text
resultModelCode
resultVersion
primaryOutputs
secondaryOutputs
qualityOutputs
interpretationOutputs
```

Example:

```text
DISC_RESULT_V1

Primary:
D/I/S/C vector

Derived:
Primary style
Secondary style
Profile label
```

---

# 22. RESULT ENVELOPE

The platform should maintain a common envelope.

Conceptually:

```text
AssessmentResult
├── id
├── attemptId
├── testType
├── instrumentId
├── instrumentVersion
├── assessmentConfigurationVersion
├── questionBankVersion
├── taxonomyVersion
├── selectionAlgorithmVersion
├── scoringVersion
├── status
├── quality
├── completedAt
└── payload
```

The `payload` is Test Type-specific.

---

# 23. RESULT PAYLOAD

Example:

```text
DISC
payload:
{
  D: ...,
  I: ...,
  S: ...,
  C: ...,
  primary: ...,
  secondary: ...
}
```

Example:

```text
RIASEC
payload:
{
  R: ...,
  I: ...,
  A: ...,
  S: ...,
  E: ...,
  C: ...,
  topCode: ...
}
```

Example:

```text
COGNITIVE
payload:
{
  logical: ...,
  numerical: ...,
  verbal: ...,
  spatial: ...,
  abilityProfile: ...
}
```

No generic `overallScore` should be required unless the instrument explicitly defines it.

---

# 24. INTERPRETATION MODEL

The result model describes the data.

The interpretation model explains the meaning.

These are separate contracts.

```text
RESULT
   ↓
INTERPRETATION
```

The interpretation model may define:

```text
bands
labels
descriptions
strengths
developmentAreas
profileMeaning
```

The interpretation model must reference the appropriate instrument version.

---

# 25. INTERPRETATION BOUNDARY

Interpretation must not exceed the construct.

For example:

```text
RIASEC
→ interest pattern
```

does not automatically mean:

```text
"you will succeed in this career"
```

Likewise:

```text
DISC
→ behavioral style
```

does not automatically mean:

```text
"you are suitable for this profession"
```

Those conclusions belong to later synthesis models.

---

# 26. CROSS-TEST PROFILE CONTRACT

Cross-Test Profile is not part of an individual Test Type contract.

It consumes completed results:

```text
Result A
Result B
Result C
...
    ↓
Cross-Test Profile
```

It should only consume results whose semantics and version are explicitly supported.

The profile engine must know:

```text
which dimensions
which versions
which transformations
which relationships
```

are allowed to participate.

---

# 27. DIRECTION ENGINE CONTRACT

The direction engine is downstream:

```text
Cross-Test Profile
       ↓
Study Direction
       ↓
Major Fit
       ↓
Career Exploration
```

A raw assessment must not directly determine a major.

The direction engine should provide:

```text
evidence
confidence
matching dimensions
supporting results
limitations
```

when implemented.

---

# 28. COMMERCIAL CONTRACT

Commercial access is separate from the assessment contract.

Conceptually:

```text
Product Tier
     ↓
Entitlement
     ↓
Test Type Access
     ↓
Assessment Configuration Access
     ↓
Result / Report Access
```

A test can therefore exist independently of whether a particular user has purchased access.

---

# 29. DASHBOARD CONTRACT

Dashboard should consume:

```text
user entitlements
assessment availability
assessment progress
completed results
profile availability
report availability
```

It must not hard-code product tiers into every component.

Preferred:

```text
Entitlement Service
        ↓
Dashboard View Model
        ↓
UI
```

---

# 30. COMPLETE INSTRUMENT CONTRACT

A production-ready Test Type should be expressible conceptually as:

```text
AssessmentInstrument
│
├── Identity
│   ├── instrumentCode
│   ├── testType
│   └── version
│
├── Construct
│   ├── definition
│   ├── purpose
│   └── boundaries
│
├── Dimensions
│
├── Question Model
│
├── Response Model
│
├── Selection Model
│
├── Scoring Model
│
├── Sufficiency Model
│
├── Result Model
│
└── Interpretation Model
```

If one of these is undefined, the instrument is not ready for production implementation.

---

# 31. EXAMPLE — DISC CONTRACT

Conceptual example only.

```text
TEST TYPE
DISC

CONSTRUCT
Behavioral style

DIMENSIONS
D / I / S / C

RESPONSE MODEL
Instrument-defined response format

QUESTION BANK
DISC_QB_V1

SELECTION
DISC_SELECTION_V1

SCORING
DISC_SCORE_V1

SUFFICIENCY
Minimum valid evidence across D/I/S/C

RESULT
D/I/S/C vector
Primary style
Secondary style

INTERPRETATION
DISC profile descriptions
```

No scientific claim is made here about the exact scoring formula.

That must come from the validated instrument specification.

---

# 32. EXAMPLE — RIASEC CONTRACT

Conceptual example only.

```text
TEST TYPE
RIASEC

CONSTRUCT
Vocational interest

DIMENSIONS
R / I / A / S / E / C

RESPONSE MODEL
Instrument-defined response format

QUESTION BANK
RIASEC_QB_V1

SELECTION
RIASEC_SELECTION_V1

SCORING
RIASEC_SCORE_V1

SUFFICIENCY
Adequate evidence across interest dimensions

RESULT
Six-dimension interest vector
Top profile code

INTERPRETATION
Interest profile
```

Again, exact instrument methodology must be validated before production.

---

# 33. EXAMPLE — COGNITIVE CONTRACT

Conceptual example only.

```text
TEST TYPE
COGNITIVE

CONSTRUCT
Cognitive ability

DIMENSIONS
Logical
Numerical
Verbal
Spatial

RESPONSE MODEL
Potentially correct/incorrect or single-choice

QUESTION BANK
COGNITIVE_QB_V1

SELECTION
Difficulty + dimension balancing

SCORING
COGNITIVE_SCORE_V1

SUFFICIENCY
Minimum valid evidence per ability dimension

RESULT
Ability profile

INTERPRETATION
Ability-level interpretation
```

This does not yet define a scientifically validated IQ test.

---

# 34. V2 COMPATIBILITY

The v2 runtime concepts should map as follows:

```text
v2 Question
        → v3 Question

v2 QuestionVersion
        → v3 QuestionVersion

v2 AssessmentConfiguration
        → v3 AssessmentConfiguration

v2 AssessmentAttempt
        → v3 AssessmentAttempt

v2 AttemptQuestion
        → v3 AttemptQuestion

v2 Answer
        → v3 Response / Answer

v2 AssessmentResult
        → v3 AssessmentResult Envelope + Payload

v2 SCORING_V1
        → v3 ScoringModel implementation
```

The goal is evolutionary compatibility.

---

# 35. CONTRACT VALIDATION

Before an instrument can be activated, the platform should be able to validate:

```text
Identity present
Construct defined
Dimensions defined
Question Bank linked
Response Model defined
Selection Model defined
Scoring Model defined
Sufficiency Model defined
Result Model defined
Interpretation Model defined
Versions present
```

Conceptually:

```text
validateInstrument(instrument)
        ↓
PASS / FAIL
```

A failed contract must prevent production activation.

---

# 36. ACTIVATION STATES

An instrument should have lifecycle states:

```text
DRAFT
VALIDATING
READY
ACTIVE
DEPRECATED
ARCHIVED
```

Only:

```text
ACTIVE
```

is eligible for normal user-facing execution.

This follows the governance principles already established in v2.

---

# 37. VERSION IMMUTABILITY

Once an instrument version becomes production-active:

```text
INSTRUMENT_V1
```

its measurement contract must be immutable.

Changes create:

```text
INSTRUMENT_V2
```

rather than silently mutating V1.

This applies to:

```text
construct
dimensions
question mappings
selection
scoring
sufficiency
result
interpretation
```

where those changes affect measurement semantics.

---

# 38. AUDITABILITY

A result must be traceable to:

```text
Test Type
Instrument Version
Assessment Configuration Version
Question Bank Version
Question Versions
Selection Algorithm Version
Scoring Version
```

This is mandatory for reproducibility.

---

# 39. ERROR BOUNDARIES

The runtime should distinguish at least:

```text
INVALID_RESPONSE
INSUFFICIENT_EVIDENCE
SCORING_FAILED
RESULT_GENERATION_FAILED
INTERPRETATION_UNAVAILABLE
INSTRUMENT_NOT_ACTIVE
CONFIGURATION_INVALID
```

A scoring error must not silently produce a result.

---

# 40. WHAT THIS CONTRACT DOES NOT DEFINE

Phase 3.0-C intentionally does not lock:

```text
exact IQ methodology
exact EQ methodology
exact AQ methodology
exact DISC methodology
exact RIASEC methodology
exact Strength methodology
exact Learning methodology
```

It defines the platform contract those instruments must satisfy.

The actual measurement science must be handled in the relevant Test Type specification phase.

---

# 41. PHASE 3.0-C ACCEPTANCE CRITERIA

Phase 3.0-C passes when:

- [ ] Every Test Type has an explicit instrument identity.
- [ ] Construct is explicitly defined.
- [ ] Construct boundaries are explicit.
- [ ] Dimensions are explicit.
- [ ] Question model is explicit.
- [ ] Response model is explicit.
- [ ] Selection model is explicit.
- [ ] Scoring model is explicit.
- [ ] Sufficiency model is explicit.
- [ ] Result model is explicit.
- [ ] Interpretation model is explicit.
- [ ] Versioning is explicit.
- [ ] Snapshot/reproducibility requirements are preserved.
- [ ] Cross-Test Profile is separated from Test Result.
- [ ] Product entitlement is separated from measurement.
- [ ] No scientific methodology is invented by the runtime.

---

# 42. PHASE 3.0-C OUTPUT

The primary output of this phase is the following contract:

```text
                 ASSESSMENT INSTRUMENT
                         │
        ┌────────────────┼────────────────┐
        ↓                ↓                ↓
    IDENTITY         CONSTRUCT        DIMENSIONS
        │                │                │
        └────────────────┼────────────────┘
                         ↓
                  QUESTION MODEL
                         ↓
                  RESPONSE MODEL
                         ↓
                 SELECTION MODEL
                         ↓
                  SCORING MODEL
                         ↓
                SUFFICIENCY MODEL
                         ↓
                    RESULT MODEL
                         ↓
                INTERPRETATION MODEL
```

This becomes the standard that all future ReadyScore tests must follow.

---

# 43. NEXT PHASE

After approval:

```text
PHASE 3.0-D
Test Type Measurement Specification
```

The next phase should stop talking abstractly about "a test" and define the first concrete measurement specifications.

Recommended order:

```text
3.0-D.1 Cognitive
3.0-D.2 EQ
3.0-D.3 AQ
3.0-D.4 DISC
3.0-D.5 RIASEC
3.0-D.6 Strength
3.0-D.7 Learning
```

Only after those specifications are sufficiently defined should we implement the generalized v3 schema/runtime.

---

# END OF PHASE 3.0-C
