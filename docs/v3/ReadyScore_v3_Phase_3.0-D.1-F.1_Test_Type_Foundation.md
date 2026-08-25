# ReadyScore v3 — PHASE 3.0-D.1-F.1
# Test Type Foundation

**Status:** FOUNDATION DESIGN / IMPLEMENTATION GATE  
**Source:** RS-v2 current repository  
**Purpose:** Separate assessment/test identity from commercial entitlement without breaking the existing v2 assessment runtime.

---

## 1. Core Decision

ReadyScore v3 must distinguish two independent concepts:

```text
TEST TYPE
What is being measured?

COMMERCIAL TIER
What product/access level did the user purchase?
```

They must not be represented by the same enum or database field.

Target model:

```text
Test Type
├── RIASEC
├── DISC
├── IQ
├── EQ
├── AQ
└── future tests

Commercial Tier
├── FREE
├── BASIC
├── MEDIUM
└── ADVANCE
```

Therefore:

```text
RIASEC + FREE
RIASEC + BASIC
RIASEC + MEDIUM
RIASEC + ADVANCE

DISC + FREE
DISC + BASIC
DISC + MEDIUM
DISC + ADVANCE
```

are valid combinations.

---

## 2. Why This Is Required

The v2 source currently uses `AssessmentType` in the assessment flow. In v3, that concept is overloaded if it continues to represent both:

- the assessment/test being taken; and
- the commercial product level.

This would make future tests difficult to model and would eventually produce conditionals such as:

```text
if assessmentType === PREMIUM
```

where the application actually needs to know:

```text
if testType === RIASEC
```

or:

```text
if tier === ADVANCE
```

Those are different decisions.

---

## 3. V3 Canonical Terminology

Use these terms consistently:

### Test Type

The measurement instrument.

Examples:

```text
RIASEC
DISC
IQ
EQ
AQ
```

### Assessment Configuration

A configured delivery of a test.

Conceptually:

```text
Test Type
+
instrument version
+
question bank version
+
scoring version
+
configuration rules
```

### Commercial Tier

The entitlement/package level.

```text
FREE
BASIC
MEDIUM
ADVANCE
```

### Product

The commercial offer shown to the customer.

A product may bundle one or more assessment capabilities.

---

## 4. Target Relationship

```text
TEST TYPE
    ↓
ASSESSMENT CONFIGURATION
    ↓
QUESTION BANK
    ↓
SCORING
    ↓
RESULT

COMMERCIAL PRODUCT
    ↓
ENTITLEMENT
    ↓
ACCESS TO ASSESSMENT CONFIGURATION
```

This is the central v3 separation.

---

## 5. Example

A customer purchases:

```text
MEDIUM
```

This does not mean:

```text
assessmentType = MEDIUM
```

Instead:

```text
productTier = MEDIUM

entitlements:
    RIASEC
    DISC
    study exploration
```

The assessment attempt itself should know:

```text
testType = RIASEC
```

and retain the configuration/scoring versions used.

---

## 6. Existing V2 Compatibility

The existing v2 runtime must not be rewritten wholesale.

The immediate objective is:

```text
introduce v3 test identity
+
preserve current v2 behavior
```

Existing `FREE/PREMIUM` behavior should remain functional until the relevant migration phase explicitly replaces it.

Do not remove an existing field merely because the v3 model is better.

---

## 7. Migration Principle

Use:

```text
ADD
→ BACKFILL
→ ADAPT
→ VERIFY
→ DEPRECATE
→ REMOVE
```

not:

```text
DROP
→ REBUILD
```

This minimizes regression risk.

---

## 8. Recommended Canonical Enum

Conceptual application-level enum:

```ts
export const TEST_TYPES = {
  RIASEC: "RIASEC",
  DISC: "DISC",
  IQ: "IQ",
  EQ: "EQ",
  AQ: "AQ",
} as const;

export type TestType =
  (typeof TEST_TYPES)[keyof typeof TEST_TYPES];
```

The exact future enum contents may expand.

Do not implement every future test merely because it appears in the product vision.

---

## 9. Commercial Tier

Conceptual:

```ts
export const COMMERCIAL_TIERS = {
  FREE: "FREE",
  BASIC: "BASIC",
  MEDIUM: "MEDIUM",
  ADVANCE: "ADVANCE",
} as const;

export type CommercialTier =
  (typeof COMMERCIAL_TIERS)[keyof typeof COMMERCIAL_TIERS];
```

Commercial naming must remain independent from the measurement model.

---

## 10. Assessment Attempt

The conceptual v3 attempt identity becomes:

```ts
type AssessmentAttemptIdentity = {
  testType: TestType;
  assessmentConfigurationId: string;
  assessmentConfigurationVersion: string;
  questionBankVersion: string;
  scoringVersion: string;
};
```

Commercial information may also be retained as entitlement/provenance metadata, but it must not replace `testType`.

---

## 11. Assessment Result

A result should answer:

```text
What test was performed?
How was it scored?
Which version produced it?
What was the result?
```

Therefore the conceptual result metadata includes:

```text
testType
assessmentConfigurationVersion
questionBankVersion
scoringVersion
interpretationVersion
```

Commercial tier is not the measurement identity.

---

## 12. Configuration Model

Conceptual:

```text
AssessmentConfiguration
│
├── testType
├── configurationVersion
├── questionBankVersion
├── scoringVersion
├── selectionAlgorithmVersion
├── status
└── configurationPayload
```

Example:

```text
RIASEC
CONFIG_V1
RIASEC_QB_V1
RIASEC_SCORE_V1
```

---

## 13. Commercial Access Model

Conceptual:

```text
CommercialTier
        ↓
Entitlement
        ↓
AssessmentConfiguration
```

Example:

```text
BASIC
  ↓
RIASEC
  ↓
RIASEC_CONFIG_V1
```

or:

```text
MEDIUM
  ↓
RIASEC
  ↓
RIASEC_CONFIG_V1

MEDIUM
  ↓
DISC
  ↓
DISC_CONFIG_V1
```

The commercial layer decides whether the user may start the configured assessment.

---

## 14. Critical Rule

The scorer must never contain logic such as:

```text
if tier === BASIC
```

to change measurement mathematics.

Commercial tier may determine:

```text
access
result visibility
interpretation depth
study mapping visibility
cross-test features
```

It should not silently change the underlying score.

---

## 15. Test-Specific Scoring

The scoring layer should eventually resolve:

```text
testType
    ↓
scorer
```

Conceptually:

```ts
switch (testType) {
  case "RIASEC":
    return riasecScorer.score(input);

  case "DISC":
    return discScorer.score(input);

  default:
    throw new Error("Unsupported test type");
}
```

This dispatcher is acceptable at the application boundary.

Measurement logic must remain inside test-specific scorers.

---

## 16. Question Bank

Question bank ownership should become test-specific.

Conceptually:

```text
Question
  ↓
QuestionVersion
  ↓
TestType / AssessmentConfiguration
```

RIASEC questions must carry RIASEC-specific metadata:

```text
dimension
indicator
reverseScore
weight
```

DISC will have a different construct model.

Do not force DISC metadata into RIASEC fields.

---

## 17. Taxonomy Separation

The current v2 taxonomy:

```text
domain
subdomain
indicator
```

must not automatically become the universal v3 measurement model.

For RIASEC:

```text
dimension
indicator
```

is the relevant conceptual structure.

Future tests may have:

```text
DISC → factor/style dimension
IQ → cognitive domain/subtest
EQ → competency dimension
```

The architecture should support different measurement schemas.

---

## 18. Result Separation

Do not create one universal interpretation formula.

Instead:

```text
TestType
    ↓
Test-specific Result
    ↓
Test-specific Interpretation
```

Example:

```text
RIASEC
→ six-dimensional interest profile
→ top code
→ study exploration
```

while:

```text
DISC
→ behavioral style profile
→ style pattern
→ behavioral interpretation
```

These are not interchangeable.

---

## 19. Backward Compatibility Strategy

During v3 implementation:

```text
V2 assessment
    ↓
continues to work

V3 RIASEC
    ↓
uses TestType foundation
```

Do not force existing v2 records to become RIASEC records.

Historical records must remain readable.

---

## 20. Data Migration Principle

If a schema migration is required:

### Step 1

Add nullable/new fields.

### Step 2

Backfill only where the mapping is unambiguous.

### Step 3

Adapt application reads/writes.

### Step 4

Run:

```text
typecheck
build
migration verification
runtime verification
```

### Step 5

Only then consider constraints.

---

## 21. Do Not Do This Yet

This phase does **not** authorize:

```text
DROP AssessmentType
DROP existing v2 fields
rewrite all assessment APIs
rewrite all question-bank repository
rewrite generic scoring engine
create DISC tables
create IQ tables
```

Those belong to later implementation phases.

---

## 22. RIASEC First

The first concrete v3 test type is:

```text
RIASEC
```

The implementation should therefore prove:

```text
TestType
→ RIASEC configuration
→ RIASEC question bank
→ RIASEC scorer
→ RIASEC result
```

before expanding to DISC.

---

## 23. Commercial Product Vision

The v3 product model can eventually support:

```text
FREE
├── limited access
│
BASIC
├── RIASEC
│
MEDIUM
├── RIASEC
├── DISC
├── study exploration
│
ADVANCE
├── multiple assessments
├── integrated profile
└── advanced decision support
```

This is a commercial architecture concept.

The exact entitlement matrix must be finalized in the commercial/product phase.

---

## 24. Architectural Invariant

The following invariant is locked:

```text
TEST TYPE ≠ COMMERCIAL TIER
```

And:

```text
SCORING ≠ COMMERCIAL ENTITLEMENT
```

And:

```text
INTERPRETATION ≠ SCORING
```

And:

```text
STUDY MAPPING ≠ SCORING
```

These separations are foundational to ReadyScore v3.

---

## 25. Implementation Target

The first implementation should establish a minimal, low-risk foundation:

```text
TestType
CommercialTier
AssessmentConfiguration.testType
```

while preserving existing v2 fields.

The next implementation phases can then migrate the actual RIASEC flow.

---

## 26. Verification

Before declaring F.1 complete:

- [ ] Existing v2 typecheck passes.
- [ ] Existing v2 build passes.
- [ ] Existing assessment start still works.
- [ ] Existing assessment answer still works.
- [ ] Existing assessment submit still works.
- [ ] Existing result retrieval still works.
- [ ] New TestType representation compiles.
- [ ] CommercialTier is separate.
- [ ] No scorer depends on commercial tier.
- [ ] No existing historical result is invalidated.

---

## 27. Exit Criteria

F.1 is complete when:

```text
Test Type
```

can be represented independently from:

```text
Commercial Tier
```

without breaking v2.

The foundation is then ready for:

```text
3.0-D.1-F.2
Assessment Configuration Refactor
```

---

# END OF PHASE 3.0-D.1-F.1
