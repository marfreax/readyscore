# ReadyScore v3 — PHASE 3.0-D.1-F.2
# Assessment Configuration Refactor

**Status:** DESIGN / IMPLEMENTATION SPECIFICATION  
**Parent:** 3.0-D.1-F.1 — Test Type Foundation  
**Basis:** ReadyScore v2 source audit (`RS-v2.zip`)  
**Purpose:** Refactor assessment configuration so Test Type becomes a first-class measurement identity while preserving the current v2 runtime and historical assessment data.

---

# 1. OBJECTIVE

F.2 introduces the v3 assessment configuration boundary.

The target architecture is:

```text
TEST TYPE
    ↓
ASSESSMENT CONFIGURATION
    ↓
QUESTION BANK VERSION
    ↓
SCORING VERSION
    ↓
RESULT
```

Commercial access remains separate:

```text
COMMERCIAL TIER
    ↓
ENTITLEMENT
    ↓
ASSESSMENT CONFIGURATION
```

The critical invariant remains:

```text
TEST TYPE ≠ COMMERCIAL TIER
```

---

# 2. CURRENT V2 BASELINE

The current ReadyScore v2 source already contains a useful assessment configuration model.

The existing assessment attempt carries version/provenance information including:

```text
assessmentConfigurationId
assessmentConfigurationVersion
questionBankVersion
taxonomyVersion
scoringVersion
selectionAlgorithmVersion
selectionSnapshot
```

The current runtime also uses an immutable attempt/question snapshot concept.

This is important because v3 does **not** need to replace the assessment lifecycle.

Instead:

```text
V2 assessment infrastructure
        ↓
V3 test-specific configuration
```

---

# 3. REFACTOR PRINCIPLE

Use:

```text
EXTEND
→ BACKFILL
→ ADAPT
→ VERIFY
→ DEPRECATE
```

Do not:

```text
DROP
→ REBUILD
```

The existing v2 assessment flow must continue to function during the transition.

---

# 4. TARGET CONFIGURATION IDENTITY

An assessment configuration represents a concrete versioned delivery of one test.

Conceptual:

```ts
type AssessmentConfiguration = {
  id: string;

  testType: TestType;

  configurationVersion: string;

  questionBankVersion: string;

  scoringVersion: string;

  selectionAlgorithmVersion: string;

  status: "DRAFT" | "ACTIVE" | "RETIRED";

  configurationPayload?: unknown;
};
```

The exact persistence shape is an implementation decision after inspection of the existing Prisma model.

---

# 5. CONFIGURATION IS NOT A PRODUCT

This distinction is mandatory.

An assessment configuration answers:

> How is this test delivered and scored?

A commercial product answers:

> What did the customer purchase and what may they access?

Therefore:

```text
RIASEC_CONFIG_V1
```

can be available to multiple tiers.

Example:

```text
BASIC  → RIASEC_CONFIG_V1
MEDIUM → RIASEC_CONFIG_V1
ADVANCE → RIASEC_CONFIG_V1
```

The measurement configuration remains the same unless a deliberately different instrument is defined.

---

# 6. CONFIGURATION AND ENTITLEMENT

Conceptual:

```text
Product
   ↓
Entitlement
   ↓
Assessment Configuration
```

Example:

```text
MEDIUM
  ├── RIASEC_CONFIG_V1
  └── DISC_CONFIG_V1
```

The user can access those configurations because of entitlement.

The scorer only receives:

```text
testType
configuration
questions
answers
versions
```

It does not need to know how the user paid.

---

# 7. CONFIGURATION VERSION

Each materially different configuration must have a version.

Example:

```text
RIASEC_CONFIG_V1
```

A configuration version changes when a material delivery rule changes, such as:

```text
question selection rules
required response rules
question bank reference
scoring reference
configuration parameters
```

A simple UI copy change should not require a new scoring version.

---

# 8. QUESTION BANK VERSION

Configuration must explicitly reference:

```text
questionBankVersion
```

Example:

```text
RIASEC_QB_V1
```

The configuration should never dynamically select whatever questions happen to be current.

---

# 9. SCORING VERSION

Configuration must explicitly reference:

```text
scoringVersion
```

Example:

```text
RIASEC_SCORE_V1
```

This ensures:

```text
same answers
+
same question bank
+
same scoring version
=
same result
```

---

# 10. SELECTION ALGORITHM VERSION

If question selection is algorithmic, preserve:

```text
selectionAlgorithmVersion
```

Example:

```text
SELECTION_V1
```

This is separate from scoring.

Why?

Because:

```text
Question selection
≠
Question scoring
```

---

# 11. TAXONOMY VERSION

The existing v2 runtime has:

```text
taxonomyVersion
```

Do not immediately remove it.

For v3:

```text
taxonomyVersion
```

should remain available for legacy configurations.

RIASEC may instead use test-specific measurement metadata such as:

```text
instrumentVersion
```

or:

```text
measurementModelVersion
```

The exact final naming should be decided during implementation after reviewing all existing consumers.

---

# 12. RIASEC CONFIGURATION EXAMPLE

Conceptual:

```json
{
  "id": "riasec-config-v1",
  "testType": "RIASEC",
  "configurationVersion": "RIASEC_CONFIG_V1",
  "questionBankVersion": "RIASEC_QB_V1",
  "scoringVersion": "RIASEC_SCORE_V1",
  "selectionAlgorithmVersion": "SELECTION_V1",
  "status": "ACTIVE"
}
```

---

# 13. FUTURE DISC CONFIGURATION

The same architecture must support:

```json
{
  "testType": "DISC",
  "configurationVersion": "DISC_CONFIG_V1",
  "questionBankVersion": "DISC_QB_V1",
  "scoringVersion": "DISC_SCORE_V1"
}
```

The structure is reusable.

The measurement logic is not.

---

# 14. ASSESSMENT ATTEMPT

The attempt should ultimately reference:

```text
assessmentConfigurationId
```

and retain immutable configuration provenance.

Conceptually:

```text
AssessmentAttempt
├── testType
├── assessmentConfigurationId
├── assessmentConfigurationVersion
├── questionBankVersion
├── scoringVersion
├── selectionAlgorithmVersion
└── selectionSnapshot
```

Whether `testType` is persisted redundantly or derived from configuration is an implementation decision.

Recommended:

```text
configuration = source of truth
testType = explicit immutable snapshot
```

if query performance and historical clarity justify it.

---

# 15. WHY SNAPSHOT TEST TYPE

Suppose:

```text
configuration ID = 123
```

was originally:

```text
RIASEC
```

and the configuration record is later retired.

Historical attempt records must still unambiguously say:

```text
testType = RIASEC
```

Therefore the attempt snapshot should preserve the measurement identity.

---

# 16. ATTEMPT IMMUTABILITY

After an assessment starts:

```text
testType
configuration version
question bank version
scoring version
selected questions
```

must not change.

The user may:

```text
answer
change answer
abandon
resume
submit
```

but may not silently move the attempt to another test type/configuration.

---

# 17. START-ASSESSMENT FLOW

Target flow:

```text
User requests assessment
        ↓
Resolve entitlement
        ↓
Resolve test type
        ↓
Resolve active configuration
        ↓
Snapshot configuration
        ↓
Select questions
        ↓
Create attempt
        ↓
Persist immutable provenance
```

Commercial authorization occurs before attempt creation.

---

# 18. START-ASSESSMENT INPUT

Conceptual:

```ts
type StartAssessmentInput = {
  testType: TestType;
};
```

A future API may allow:

```ts
assessmentConfigurationId
```

for explicit administrative selection.

But normal user-facing flows should request:

```text
testType
```

and let the server resolve the active eligible configuration.

---

# 19. DO NOT TRUST CLIENT CONFIGURATION

The client must not be allowed to dictate:

```text
questionBankVersion
scoringVersion
configurationVersion
```

for a normal user assessment.

The server must resolve those values.

This prevents users from selecting an unintended scoring configuration.

---

# 20. ENTITLEMENT CHECK

The server should evaluate:

```text
Does this user have access to this test/configuration?
```

before:

```text
creating the attempt
```

Conceptual:

```ts
canAccess(user, testType, configuration)
```

Commercial tier is evaluated here.

Not in the scorer.

---

# 21. CONFIGURATION RESOLUTION

Conceptual service:

```ts
resolveAssessmentConfiguration({
  testType,
  user,
});
```

returns:

```text
active configuration
+
version references
+
delivery rules
```

This creates a clean boundary between:

```text
commercial access
```

and:

```text
assessment execution
```

---

# 22. RESULT PROVENANCE

The final result must be traceable:

```text
Attempt
 ↓
Configuration
 ↓
Question Bank
 ↓
Answers
 ↓
Scoring
 ↓
Interpretation
 ↓
Mapping
```

Example:

```text
testType = RIASEC
configuration = RIASEC_CONFIG_V1
questionBank = RIASEC_QB_V1
scoring = RIASEC_SCORE_V1
interpretation = RIASEC_INTERPRETATION_V1
studyMapping = RIASEC_STUDY_MAPPING_V1
```

---

# 23. EXISTING V2 COMPATIBILITY

Existing v2 records may continue to contain:

```text
FREE
PREMIUM
```

or other legacy assessment semantics.

Do not reinterpret historical data without an explicit migration rule.

For example:

```text
legacy PREMIUM
```

must not automatically become:

```text
RIASEC ADVANCE
```

unless there is an actual business mapping.

---

# 24. LEGACY ADAPTER

During transition, a compatibility adapter may translate old runtime concepts:

```text
Legacy AssessmentType
        ↓
Legacy configuration path
```

while new v3 flows use:

```text
TestType
        ↓
AssessmentConfiguration
```

This keeps the migration incremental.

---

# 25. GENERIC ASSESSMENT RUNTIME

The existing runtime should continue owning generic lifecycle operations:

```text
start
answer
resume
submit
abandon
retrieve result
history
```

The test-specific layer owns:

```text
measurement
scoring
interpretation
```

This is an important separation.

---

# 26. GENERIC RUNTIME MUST NOT KNOW RIASEC RULES

Avoid:

```text
if RIASEC:
  calculate R/I/A/S/E/C
```

inside generic runtime code.

Instead:

```text
generic runtime
    ↓
test-type scoring strategy
    ↓
RiasecScorer
```

---

# 27. ASSESSMENT CONFIGURATION PAYLOAD

Configuration-specific non-relational rules may be stored as a controlled payload.

Example:

```json
{
  "responseScale": "LIKERT_5",
  "targetItemCount": 60,
  "minimumDimensionCoverage": 80,
  "topCodeLength": 3
}
```

However:

> Measurement-critical values must not become arbitrary mutable JSON.

If a value changes scoring semantics, it must be versioned and represented in the scoring contract.

---

# 28. CONFIGURATION VS SCORING RULE

Use this distinction:

```text
CONFIGURATION
How the assessment is delivered.

SCORING
How answers become measurement values.
```

Example:

```text
targetItemCount = 60
```

is configuration/delivery.

```text
reverseScore = 6 - response
```

is scoring logic.

---

# 29. CONFIGURATION VS INTERPRETATION

Likewise:

```text
topCodeLength = 3
```

may belong to scoring/result configuration.

But:

```text
"Anda cenderung menikmati..."
```

belongs to interpretation.

Interpretation text should be versioned separately.

---

# 30. PROPOSED SERVICE BOUNDARIES

Target application services:

```text
AssessmentConfigurationService
        ↓
EntitlementService
        ↓
AssessmentRuntimeService
        ↓
TestScoringService
        ↓
InterpretationService
        ↓
StudyMappingService
```

These may be implemented incrementally.

Do not create empty abstractions without a real consumer.

---

# 31. FIRST IMPLEMENTATION SCOPE

F.2 should initially modify only what is necessary to support:

```text
testType
+
configuration resolution
+
attempt snapshot
```

Do not yet implement:

```text
DISC
IQ
EQ
AQ
```

---

# 32. RIASEC IMPLEMENTATION TARGET

After F.2:

```text
POST /api/assessment/start

{
  "testType": "RIASEC"
}
```

should conceptually resolve:

```text
RIASEC_CONFIG_V1
```

and create an attempt containing the correct immutable configuration provenance.

The actual endpoint contract may differ according to the existing API architecture.

---

# 33. DATABASE MIGRATION STRATEGY

Before modifying Prisma:

1. Inspect current models.
2. Identify all `AssessmentType` consumers.
3. Identify all `AssessmentConfiguration` consumers.
4. Identify all `AssessmentAttempt` writes.
5. Identify all result writes.
6. Add the minimum required fields.
7. Generate migration.
8. Review migration SQL.
9. Apply to development DB.
10. Verify historical records.
11. Run typecheck.
12. Run build.
13. Run runtime smoke tests.

---

# 34. MIGRATION SAFETY

Never perform:

```text
prisma migrate reset
```

against a database containing the validated v2 state unless explicitly intended.

The existing backup discipline should continue.

---

# 35. BACKFILL

If a new `testType` field is added to an existing table, only backfill values that are semantically certain.

Example:

```text
known legacy assessment configuration
→ known test type
```

If a legacy record cannot be safely classified:

```text
do not guess
```

Use:

```text
LEGACY
```

or nullable state only if the architecture explicitly supports it.

---

# 36. HISTORICAL DATA PRINCIPLE

Historical v2 data is evidence.

Do not rewrite it merely to make the v3 schema look clean.

A clean v3 architecture is less valuable than:

```text
correct historical results
```

---

# 37. API BACKWARD COMPATIBILITY

Existing API consumers must continue to function.

If an existing endpoint currently expects:

```text
assessmentType
```

do not remove it until:

```text
all consumers migrated
+
tests pass
+
deprecation is intentional
```

---

# 38. FIELD NAMING

Recommended conceptual naming:

```text
testType
commercialTier
assessmentConfigurationId
assessmentConfigurationVersion
questionBankVersion
scoringVersion
```

Avoid ambiguous names such as:

```text
type
category
planType
assessmentType
```

for new v3 measurement identity.

---

# 39. SOURCE OF TRUTH

Recommended:

```text
AssessmentConfiguration.testType
```

is the canonical configuration identity.

At attempt creation:

```text
AssessmentAttempt.testType
```

may be stored as immutable snapshot metadata.

At result creation:

```text
AssessmentResult.testType
```

may also be stored for direct retrieval and audit.

This introduces controlled denormalization for historical provenance.

---

# 40. INVARIANTS

The implementation must enforce:

### INVARIANT 1

```text
configuration.testType is immutable for a configuration version
```

### INVARIANT 2

```text
attempt.testType cannot change after start
```

### INVARIANT 3

```text
attempt.scoringVersion cannot change after start
```

### INVARIANT 4

```text
result.testType matches attempt.testType
```

### INVARIANT 5

```text
result.scoringVersion matches the scorer used
```

### INVARIANT 6

```text
commercialTier never changes scoring mathematics
```

---

# 41. FAILURE CASES

The runtime must reject:

```text
unknown testType
inactive configuration
configuration without scoring version
configuration without question bank
unauthorized test access
attempt/configuration mismatch
result/test mismatch
```

Errors should be explicit and deterministic.

---

# 42. VERIFICATION MATRIX

F.2 implementation must verify:

| Scenario | Expected |
|---|---|
| Existing v2 assessment | Still works |
| Start RIASEC | Resolves RIASEC config |
| Start unauthorized test | Rejected |
| Inactive RIASEC config | Rejected |
| Unknown test type | Rejected |
| Answer existing attempt | Works |
| Submit existing attempt | Works |
| Result retrieval | Works |
| Historical v2 result | Still readable |
| RIASEC attempt provenance | Complete |
| Commercial tier change | Does not alter scoring |

---

# 43. TEST TYPE / TIER EXAMPLES

Valid:

```text
RIASEC + FREE
RIASEC + BASIC
RIASEC + MEDIUM
RIASEC + ADVANCE
```

Invalid conceptual model:

```text
AssessmentType = "MEDIUM"
```

because MEDIUM is not a measurement instrument.

---

# 44. FUTURE MULTI-TEST ATTEMPTS

A user may eventually own:

```text
RIASEC result
DISC result
IQ result
EQ result
```

Each result remains independently versioned.

The future integrated profile can consume them:

```text
RIASEC result
+
DISC result
+
Cognitive result
+
...
```

The integrated profile must not mutate the underlying test results.

---

# 45. COMMERCIAL TIER DOES NOT DEFINE TEST TYPE

A user buying:

```text
ADVANCE
```

does not automatically mean:

```text
testType = "RIASEC"
```

The entitlement catalog determines which tests are included.

---

# 46. F.2 NON-GOALS

This phase does not implement:

```text
RIASEC scorer
RIASEC question bank
RIASEC interpretation
DISC
IQ
EQ
AQ
commercial pricing
payment gateway
subscription billing
cross-test profile
```

Those belong to other phases.

---

# 47. IMPLEMENTATION ORDER

Recommended source changes:

```text
1. TestType constants/types
        ↓
2. AssessmentConfiguration model extension
        ↓
3. Attempt snapshot extension
        ↓
4. Configuration resolver
        ↓
5. Start assessment integration
        ↓
6. Compatibility adapter
        ↓
7. Tests
        ↓
8. Migration verification
```

---

# 48. EXIT CRITERIA

F.2 is complete when:

- [ ] Assessment configuration has explicit test identity.
- [ ] Test type is independent from commercial tier.
- [ ] Configuration references question-bank version.
- [ ] Configuration references scoring version.
- [ ] Attempt preserves immutable configuration/test provenance.
- [ ] Existing v2 assessment flow still works.
- [ ] RIASEC can resolve an active configuration.
- [ ] Unauthorized configurations are rejected.
- [ ] Historical v2 records remain readable.
- [ ] Typecheck passes.
- [ ] Build passes.
- [ ] Database migration is reviewed.
- [ ] Smoke tests pass.

---

# 49. NEXT PHASE

After F.2:

```text
PHASE 3.0-D.1-F.3
RIASEC Question Bank Integration
```

That phase will connect:

```text
RIASEC_CONFIG_V1
        ↓
RIASEC_QB_V1
        ↓
60 target items
+
24 reserve items
```

before implementing the production RIASEC scorer.

---

# END OF PHASE 3.0-D.1-F.2
