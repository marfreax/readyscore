# ReadyScore v3 — PHASE 3.0-D.1-F.3
# RIASEC Question Bank Integration

**Status:** IMPLEMENTATION SPECIFICATION  
**Parent:** 3.0-D.1-F.2 — Assessment Configuration Refactor  
**Instrument:** RIASEC  
**Target Question Bank:** `RIASEC_QB_V1`  
**Target Configuration:** `RIASEC_CONFIG_V1`

---

# 1. OBJECTIVE

This phase integrates the RIASEC question bank into the ReadyScore assessment infrastructure.

The target is:

```text
RIASEC_CONFIG_V1
        ↓
RIASEC_QB_V1
        ↓
RIASEC Questions
        ↓
Assessment Attempt
        ↓
Answers
```

This phase does **not** implement the RIASEC scoring engine.

Scoring remains the next measurement-specific implementation boundary.

---

# 2. SOURCE OF TRUTH

The question-bank implementation must respect the approved RIASEC design phases:

```text
3.0-D.1-A
RIASEC Construct & Dimension Validation

3.0-D.1-B
RIASEC Item Blueprint

3.0-D.1-C
RIASEC Scoring Specification

3.0-D.1-D
RIASEC Result & Interpretation Specification

3.0-D.1-E
RIASEC Validation & Production Readiness
```

The question bank is therefore an implementation of the approved blueprint.

It must not redefine the RIASEC construct.

---

# 3. TARGET QUESTION-BANK VERSION

The first production candidate is:

```text
RIASEC_QB_V1
```

The approved candidate structure is:

```text
60 target items
24 reserve items
84 total candidates
```

Target distribution:

```text
R = 10 target + 4 reserve
I = 10 target + 4 reserve
A = 10 target + 4 reserve
S = 10 target + 4 reserve
E = 10 target + 4 reserve
C = 10 target + 4 reserve
```

Total:

```text
60 target
24 reserve
84 candidates
```

---

# 4. IMPORTANT: CANDIDATE VS PRODUCTION ITEM

The 84-item pool is not automatically equivalent to the final 60-item production instrument.

The distinction is:

```text
CANDIDATE POOL
84
  ↓
review / validation
  ↓
TARGET PRODUCTION SET
60
```

Reserve items exist to support:

```text
replacement
pilot revision
item removal
future balancing
```

---

# 5. ITEM IDENTITY

Every question must have a stable identity.

Recommended conceptual format:

```text
RIASEC-R-001
RIASEC-R-002
...
RIASEC-I-001
...
RIASEC-C-010
```

Reserve items should remain distinguishable.

Example:

```text
RIASEC-R-R01
RIASEC-I-R01
```

or an equivalent repository-specific convention.

The exact ID convention must follow the existing question-bank identity model if that model already provides stable IDs.

Do not create duplicate identities for question versions.

---

# 6. QUESTION VS QUESTION VERSION

Use the existing ReadyScore distinction:

```text
Question
    ↓
QuestionVersion
```

`Question` represents stable identity.

`QuestionVersion` represents versioned content/configuration.

Therefore:

```text
RIASEC-R-001
```

may have:

```text
QuestionVersion V1
QuestionVersion V2
```

without changing the stable question identity.

---

# 7. IMMUTABILITY

Once a question version is used by a production assessment:

```text
QuestionVersion
```

must be treated as immutable.

A wording change must create a new version rather than silently changing historical content.

---

# 8. REQUIRED QUESTION METADATA

Each RIASEC question must be traceable to:

```text
questionId
questionVersion
testType
dimension
indicator
responseScale
reverseScore
weight
status
```

Where supported by the existing schema.

---

# 9. RIASEC DIMENSIONS

The six canonical dimensions are:

```text
R — Realistic
I — Investigative
A — Artistic
S — Social
E — Enterprising
C — Conventional
```

No seventh dimension is introduced in V1.

---

# 10. DIMENSION FIELD

The canonical measurement dimension should be represented explicitly.

Conceptually:

```text
dimension = R
dimension = I
dimension = A
dimension = S
dimension = E
dimension = C
```

Do not rely on parsing the question ID to determine the dimension.

The ID is an identity.

The dimension is measurement metadata.

---

# 11. INDICATOR

Each item should reference its approved RIASEC indicator.

Conceptually:

```text
dimension
    ↓
indicator
    ↓
item
```

The exact indicator vocabulary must come from the approved RIASEC item blueprint.

Do not invent new indicators during implementation.

If the blueprint does not provide a required value, mark it:

```text
REVIEW_REQUIRED
```

rather than silently creating one.

---

# 12. ITEM INTENT

Every production candidate must have a clear measurement intent.

The item should answer:

> What aspect of vocational interest is this item intended to capture?

This is documentation metadata, not user-facing result content.

---

# 13. ITEM ARCHETYPE

The approved item blueprint may classify items by archetype.

Examples of conceptual archetypes include:

```text
activity preference
work-environment preference
problem-solving interest
people interaction preference
creative expression preference
organization/order preference
```

Only archetypes explicitly approved in the RIASEC blueprint should be used in the actual bank.

---

# 14. RESPONSE SCALE

RIASEC V1 uses:

```text
LIKERT_5
```

Labels:

```text
1 = Sangat Tidak Tertarik
2 = Tidak Tertarik
3 = Netral
4 = Tertarik
5 = Sangat Tertarik
```

The question bank must not embed a different scale for individual questions.

---

# 15. NEUTRAL IS VALID

The following are distinct:

```text
3
```

and:

```text
unanswered
```

`3` means:

```text
Netral
```

It is a valid response and must be persisted as such.

---

# 16. REVERSE SCORING

Each item must explicitly declare:

```text
reverseScore
```

where applicable.

The question bank must not require the scorer to infer reverse scoring from wording.

Example:

```text
reverseScore = true
```

means the scoring layer will apply the approved RIASEC reversal rule.

---

# 17. WEIGHT

Default:

```text
weight = 1
```

The question bank must explicitly preserve the configured weight where the schema supports it.

Do not introduce arbitrary weights during import.

If an item has no approved non-default weight:

```text
weight = 1
```

---

# 18. STATUS MODEL

Candidate items should have an explicit lifecycle.

Recommended conceptual statuses:

```text
DRAFT
REVIEW_REQUIRED
APPROVED
ACTIVE
RETIRED
RESERVE
```

The exact enum must follow the existing question-bank status model where one exists.

Do not create duplicate status systems unnecessarily.

---

# 19. TARGET VS RESERVE

The bank must distinguish:

```text
TARGET
```

from:

```text
RESERVE
```

because both belong to the candidate pool but have different production roles.

Conceptually:

```text
RIASEC_QB_V1
├── TARGET
│   └── 60
└── RESERVE
    └── 24
```

---

# 20. PRODUCTION SELECTION

The default production configuration should reference:

```text
60 target items
```

not all 84 candidates.

The reserve pool must not accidentally appear in a normal user assessment.

---

# 21. QUESTION SELECTION

The assessment configuration must determine how questions are selected.

For V1, the preferred deterministic behavior is:

```text
RIASEC_CONFIG_V1
        ↓
RIASEC_QB_V1
        ↓
approved active target items
        ↓
configured selection
```

If randomization is used, the selection algorithm must be versioned.

---

# 22. SELECTION ALGORITHM

The existing runtime already carries:

```text
selectionAlgorithmVersion
```

This should be reused.

Example:

```text
SELECTION_V1
```

Do not mix:

```text
question selection
```

with:

```text
question scoring
```

---

# 23. DIMENSION BALANCE

The production target is:

```text
10 R
10 I
10 A
10 S
10 E
10 C
```

Therefore:

```text
60 total
```

This balance must be validated before activation.

---

# 24. BALANCE VALIDATION

A bank validation script/test should report:

```text
R count
I count
A count
S count
E count
C count
```

Expected:

```text
10 / 10 / 10 / 10 / 10 / 10
```

for the target set.

Reserve counts should separately report:

```text
4 / 4 / 4 / 4 / 4 / 4
```

---

# 25. DUPLICATE DETECTION

Before activation, detect:

```text
duplicate question IDs
duplicate question text
duplicate semantic intent
duplicate dimension/indicator combinations
```

Exact text duplication must be rejected.

Semantic redundancy should be reviewed rather than automatically rejected.

---

# 26. CROSS-DIMENSION VALIDATION

Each item must have exactly one primary RIASEC dimension.

Invalid:

```text
dimension = R,I
```

unless the underlying data model explicitly supports multi-label items and the approved measurement model allows them.

RIASEC V1 should use:

```text
one item
→ one primary dimension
```

---

# 27. ITEM COUNT VALIDATION

The bank validator should fail if:

```text
target != 60
```

or:

```text
reserve != 24
```

unless the blueprint has been formally versioned/revised.

Do not silently accept a different bank composition under:

```text
RIASEC_QB_V1
```

---

# 28. VERSION VALIDATION

A production assessment must never accidentally combine:

```text
RIASEC_QB_V1
```

with:

```text
RIASEC_SCORE_V2
```

unless that combination is explicitly defined as compatible.

Recommended configuration:

```text
RIASEC_CONFIG_V1
→ RIASEC_QB_V1
→ RIASEC_SCORE_V1
```

---

# 29. CONFIGURATION COMPATIBILITY

The system should validate:

```text
configuration.testType === RIASEC
```

and:

```text
questionBank.testType === RIASEC
```

before creating an assessment.

This prevents a future error such as:

```text
DISC configuration
+
RIASEC questions
```

---

# 30. QUESTION BANK ACTIVATION

Recommended lifecycle:

```text
DRAFT
  ↓
VALIDATED
  ↓
APPROVED
  ↓
ACTIVE
```

Activation requires all mandatory checks to pass.

---

# 31. ACTIVATION GATE

The bank must not become active unless:

- [ ] 60 target items exist.
- [ ] 24 reserve candidates exist.
- [ ] All six dimensions are represented.
- [ ] Target distribution is 10 per dimension.
- [ ] Reserve distribution is 4 per dimension.
- [ ] All target items have valid metadata.
- [ ] All target items have approved versions.
- [ ] No duplicate IDs.
- [ ] No exact duplicate text.
- [ ] Response scale is consistent.
- [ ] Reverse flags are explicit.
- [ ] Weights are valid.
- [ ] Test type is RIASEC.
- [ ] Configuration compatibility passes.

---

# 32. QUESTION CONTENT

This phase defines the integration contract.

It does **not** authorize generating or rewriting the 60 production questions automatically.

The actual item content must come from the approved RIASEC item blueprint/question source.

If the source does not yet contain finalized wording:

```text
QUESTION_CONTENT_PENDING
```

must be recorded rather than fabricated.

---

# 33. SOURCE TRACEABILITY

Every imported item should have provenance:

```text
source
sourceVersion
blueprintReference
reviewStatus
```

This allows the team to answer:

> Why does this question exist in RIASEC_QB_V1?

---

# 34. IMPORT CONTRACT

Conceptual import structure:

```ts
type RiasecQuestionDefinition = {
  code: string;
  dimension: "R" | "I" | "A" | "S" | "E" | "C";
  indicator: string;
  text: string;
  reverseScore: boolean;
  weight: number;
  role: "TARGET" | "RESERVE";
  status: "APPROVED" | "RESERVE";
};
```

The exact shape must be adapted to the existing repository model.

Do not introduce duplicate persistence abstractions if `Question` / `QuestionVersion` already provide the required structure.

---

# 35. IMPORT SAFETY

The import process should be idempotent.

Running the same import twice must not create duplicate questions.

Preferred behavior:

```text
same stable code
+
same version
=
update/skip according to explicit import policy
```

not:

```text
create another question
```

---

# 36. IMPORT DRY-RUN

Before writing to production data:

```text
IMPORT --DRY-RUN
```

should report:

```text
new
existing
updated
duplicate
invalid
```

No data mutation should occur during dry-run.

---

# 37. DATABASE BACKUP

Before applying the actual question-bank import:

```text
database backup
```

must be taken.

The validated v2 backup discipline remains mandatory.

---

# 38. DATABASE VERIFICATION

After import, verify:

```sql
SELECT COUNT(...)
```

for:

```text
RIASEC target
RIASEC reserve
RIASEC total
```

and verify distribution by dimension.

---

# 39. EXPECTED COUNTS

Target:

```text
60
```

Reserve:

```text
24
```

Total candidate pool:

```text
84
```

The production assessment should use:

```text
60
```

unless configuration explicitly defines otherwise.

---

# 40. QUESTION VERSION COUNTS

If each question has one active version:

```text
60 target questions
→ 60 active target question versions
```

and:

```text
24 reserve questions
→ 24 reserve question versions
```

The actual database count may differ if historical versions already exist.

Therefore verification should distinguish:

```text
stable question count
```

from:

```text
question version count
```

---

# 41. ADMIN QUESTION BANK

The existing admin question-bank interface should eventually support filtering by:

```text
testType = RIASEC
dimension
indicator
role = TARGET / RESERVE
status
version
```

F.3 only requires the underlying data contract.

UI enhancements should be implemented only where necessary for operating the bank.

---

# 42. LEGACY QUESTION BANK

Existing v2 questions must not be silently converted into RIASEC questions.

A question is RIASEC only when:

```text
testType = RIASEC
```

is explicitly established by the approved source/configuration.

---

# 43. LEGACY DOMAIN FIELDS

The existing v2 question model may contain:

```text
domain
subdomain
indicator
```

Do not automatically assume:

```text
domain = RIASEC dimension
```

The mapping must be explicit.

For RIASEC:

```text
dimension
```

is the measurement identity.

Legacy taxonomy fields may be retained for compatibility where required.

---

# 44. RESULT COMPATIBILITY

Question-bank integration must not alter existing v2 result calculations.

RIASEC questions should be selected only when:

```text
testType = RIASEC
```

and the RIASEC configuration is active.

---

# 45. SECURITY

The user-facing assessment API must never expose internal metadata unnecessarily.

The client needs:

```text
question ID
question text
response options
display metadata
```

It does not need:

```text
correct answer
scoring formula
reverseScore
weight
internal indicator rationale
```

where those fields would expose measurement internals.

---

# 46. ANSWER PERSISTENCE

The answer should continue to reference:

```text
questionId
```

and the attempt should preserve the corresponding question snapshot.

This ensures the submitted answer remains tied to the exact question presented.

---

# 47. QUESTION ORDER

Question order should be determined by the assessment delivery layer.

The question bank itself should not assume:

```text
R first
I second
A third
...
```

unless the approved configuration explicitly requires that order.

---

# 48. PRESENTATION RANDOMIZATION

If future product requirements randomize question order:

```text
selectionAlgorithmVersion
```

must capture the relevant behavior.

Randomization must not change:

```text
dimension
scoring
weight
```

---

# 49. PRODUCTION SNAPSHOT

When an assessment starts, the selected RIASEC questions become part of:

```text
attempt.questionSnapshot
```

or the equivalent immutable structure already used by the runtime.

Changing the current question bank after start must not alter the user's active attempt.

---

# 50. RIASEC QUESTION BANK INTEGRATION FLOW

Final target:

```text
RIASEC_CONFIG_V1
        ↓
RIASEC_QB_V1
        ↓
ACTIVE TARGET ITEMS
        ↓
QUESTION SELECTION
        ↓
ATTEMPT QUESTION SNAPSHOT
        ↓
USER ANSWERS
```

Scoring begins only after this boundary.

---

# 51. AUTOMATED VALIDATION SUITE

Recommended validator tests:

```text
bank version exists
test type = RIASEC
60 target items
24 reserve items
6 dimensions
10 target / dimension
4 reserve / dimension
unique IDs
unique exact text
valid indicators
valid response scale
valid reverse flags
valid weights
no inactive target items
configuration compatibility
```

---

# 52. GOLDEN QUESTION-BANK FIXTURE

Create a deterministic fixture containing:

```text
RIASEC_QB_V1
```

with:

```text
known IDs
known dimensions
known indicators
known reverse flags
known weights
```

This fixture will later be consumed by:

```text
RIASEC scoring tests
```

---

# 53. F.3 DOES NOT LOCK PSYCHOMETRIC QUALITY

A structurally valid question bank is not automatically psychometrically validated.

Therefore:

```text
STRUCTURAL VALIDATION
```

means:

```text
the bank is internally consistent and implementable
```

not:

```text
the instrument is empirically proven valid
```

Empirical validation remains a pilot activity.

---

# 54. IMPLEMENTATION ORDER

Recommended source implementation:

```text
1. Add/confirm RIASEC test type
        ↓
2. Define RIASEC_QB_V1 metadata
        ↓
3. Prepare question definitions
        ↓
4. Build dry-run importer/seed
        ↓
5. Validate 84 candidates
        ↓
6. Activate 60 target items
        ↓
7. Link to RIASEC_CONFIG_V1
        ↓
8. Start-assessment smoke test
        ↓
9. Verify attempt snapshot
        ↓
10. Run regression suite
```

---

# 55. DO NOT IMPLEMENT SCORING YET

The following belongs to:

```text
PHASE 3.0-D.1-F.4
RIASEC Scoring Engine
```

Do not place:

```text
topCode calculation
dimension score calculation
ranking
coverage interpretation
```

inside the question-bank importer.

Question bank answers:

> What questions are available and how are they classified?

Scoring answers:

> How do responses become measurements?

---

# 56. EXIT CRITERIA

F.3 is complete when:

- [ ] `RIASEC_QB_V1` exists.
- [ ] Target/reserve distinction exists.
- [ ] 60 target candidates are represented.
- [ ] 24 reserve candidates are represented.
- [ ] Six-dimensional balance is verified.
- [ ] Every target item has stable identity.
- [ ] Every target item has a version.
- [ ] Every target item has explicit RIASEC dimension.
- [ ] Indicator mapping is traceable.
- [ ] Reverse-score metadata is explicit.
- [ ] Weight metadata is valid.
- [ ] Question selection can resolve only approved active target items.
- [ ] Attempt snapshot captures selected questions.
- [ ] Existing v2 question bank remains unaffected.
- [ ] Import is idempotent.
- [ ] Database counts are verified.
- [ ] Typecheck passes.
- [ ] Build passes.
- [ ] RIASEC assessment start smoke test passes.

---

# 57. NEXT PHASE

After F.3:

```text
PHASE 3.0-D.1-F.4
RIASEC Scoring Engine
```

The next phase will connect:

```text
RIASEC answers
        ↓
RIASEC_SCORE_V1
        ↓
six dimension scores
        ↓
ranking
        ↓
top code
        ↓
coverage / completeness
```

The scoring implementation must consume the versioned question metadata established here and must not recreate question-bank rules independently.

---

# END OF PHASE 3.0-D.1-F.3
