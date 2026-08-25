# ReadyScore v3 — PHASE 3.0-D.1-C
# RIASEC Scoring Specification

**Product:** ReadyScore  
**Phase:** 3.0-D.1-C  
**Version:** 1.0  
**Status:** SCORING DESIGN BASELINE  
**Parent:** 3.0-D.1 — RIASEC Measurement Specification  
**Previous Gate:** 3.0-D.1-B — RIASEC Item Blueprint  
**Purpose:** Define the complete RIASEC scoring contract before implementation of the RIASEC scoring engine.

---

# 1. PURPOSE

This phase converts the approved RIASEC measurement and item blueprint into a deterministic scoring specification.

The scoring pipeline is:

```text
RESPONSE
    ↓
VALIDATION
    ↓
ITEM SCORE
    ↓
DIMENSION SCORE
    ↓
NORMALIZATION
    ↓
PROFILE RANKING
    ↓
TOP CODE
    ↓
COVERAGE / SUFFICIENCY
    ↓
QUALITY
    ↓
RIASEC RESULT PAYLOAD
```

The purpose is to ensure that the scoring engine is:

```text
deterministic
versioned
reproducible
auditable
test-specific
independent from v2's eight-domain assumptions
```

---

# 2. SCORING FAMILY

RIASEC belongs to:

```text
INTEREST / PREFERENCE
```

Therefore the scoring engine must calculate:

```text
relative interest evidence
```

It must not calculate:

```text
IQ
ability
competence
career certainty
major certainty
```

---

# 3. RIASEC DIMENSIONS

The scoring dimensions are fixed:

```text
R — Realistic
I — Investigative
A — Artistic
S — Social
E — Enterprising
C — Conventional
```

There are exactly:

```text
6
```

scored dimensions.

---

# 4. SCORING VERSION

Initial version:

```text
RIASEC_SCORE_V1
```

The version must be persisted with the assessment result.

A future scoring-rule change creates:

```text
RIASEC_SCORE_V2
```

Historical results must remain reproducible under their original scoring version.

---

# 5. INPUT CONTRACT

The scoring engine receives:

```text
questions
answers
assessmentType
instrumentVersion
questionBankVersion
scoringVersion
attemptId
```

At the scoring layer, each question must provide at least:

```text
id
dimension
weight
reverseScore
```

The response must provide:

```text
questionId
value
```

---

# 6. RESPONSE SCALE

The initial response model is:

```text
LIKERT_5
```

Allowed values:

```text
1
2
3
4
5
```

Semantic labels:

```text
1 = Sangat Tidak Tertarik
2 = Tidak Tertarik
3 = Netral
4 = Tertarik
5 = Sangat Tertarik
```

The labels belong to the UI.

The scoring engine operates on the numeric values.

---

# 7. RESPONSE VALIDATION

A response is valid when:

```text
value is an integer
AND
1 <= value <= 5
AND
questionId exists in the selected attempt
```

Invalid values must not silently become valid scores.

Examples:

```text
0        → invalid
6        → invalid
3.5      → invalid
"abc"    → invalid
null     → missing
```

---

# 8. ITEM SCORE

For a normal item:

```text
itemScore = response
```

For a reverse-keyed item:

```text
itemScore = 6 - response
```

Mapping:

```text
Response     Normal     Reverse
1            1          5
2            2          4
3            3          3
4            4          2
5            5          1
```

---

# 9. REVERSE-KEYING RULE

Reverse scoring is controlled by:

```text
reverseScore: boolean
```

It must be stored in the question/version record.

The engine must not infer reverse scoring from the text.

Example:

```text
reverseScore = true
```

means:

```text
scoredValue = 6 - response
```

---

# 10. ITEM WEIGHT

Initial default:

```text
weight = 1
```

The initial RIASEC scoring model should use equal weighting unless a validated future methodology explicitly requires different weights.

Therefore:

```text
R item = weight 1
I item = weight 1
A item = weight 1
S item = weight 1
E item = weight 1
C item = weight 1
```

A weight other than 1 must be explicit and versioned.

---

# 11. DIMENSION AGGREGATION

For each dimension:

```text
R
I
A
S
E
C
```

calculate:

```text
weightedMean =
Σ(itemScore × weight)
/
Σ(weight)
```

Only valid answered items are included.

Example:

```text
I responses:

4
5
3
4
5
```

Equal weighting:

```text
rawMean = (4 + 5 + 3 + 4 + 5) / 5
        = 4.2
```

---

# 12. WHY MEAN RATHER THAN SUM

Using the mean has a major advantage:

```text
dimension score
```

remains comparable even if future versions have different item counts.

For example:

```text
V1 → 10 items
V2 → 12 items
```

A mean still remains on:

```text
1–5
```

while a raw sum would change its range.

---

# 13. RAW DIMENSION SCORE

Each dimension has:

```text
rawMean
```

with theoretical range:

```text
1.00 → 5.00
```

Example:

```text
R = 3.80
I = 4.20
A = 3.10
S = 2.90
E = 3.70
C = 3.40
```

The raw mean should be retained internally.

---

# 14. NORMALIZED DIMENSION SCORE

The product-facing score may be normalized to:

```text
0 → 100
```

Formula:

```text
normalizedScore =
((rawMean - 1) / 4) × 100
```

Therefore:

```text
1.00 → 0
2.00 → 25
3.00 → 50
4.00 → 75
5.00 → 100
```

Round to:

```text
2 decimal places
```

Example:

```text
rawMean = 4.2

((4.2 - 1) / 4) × 100
= 80
```

---

# 15. IMPORTANT NORMALIZATION RULE

A 0–100 score is:

```text
PRESENTATION / NORMALIZATION SCALE
```

It is not automatically:

```text
percentile
population norm
probability
success rate
```

Therefore the UI must not display:

```text
"You are in the top 80%."
```

unless a separate norming study supports that claim.

---

# 16. SIX DIMENSION SCORES

The result must preserve:

```text
R.score
I.score
A.score
S.score
E.score
C.score
```

Example:

```text
R = 70
I = 82
A = 61
S = 55
E = 76
C = 63
```

These six values form the core RIASEC profile.

---

# 17. RANKING

Dimensions are sorted by:

```text
normalizedScore DESC
```

Example:

```text
I = 82
E = 76
R = 70
C = 63
A = 61
S = 55
```

Ranks:

```text
I = 1
E = 2
R = 3
C = 4
A = 5
S = 6
```

The full ranking should be persisted or deterministically reconstructable.

---

# 18. TIE-BREAKING

Ties must be deterministic.

Initial rule:

```text
1. Higher rawMean
2. Higher valid item count
3. Stable dimension precedence
```

Stable dimension precedence:

```text
R
I
A
S
E
C
```

This is only a deterministic tie-break.

It must not be interpreted as saying one RIASEC dimension is intrinsically more important than another.

---

# 19. TOP CODE

The initial product summary is:

```text
TOP 3 DIMENSIONS
```

Example:

```text
I
E
R
```

becomes:

```text
IER
```

The code is:

```text
topCode
```

The top code is derived from the ranking.

---

# 20. TOP CODE IS NOT THE FULL RESULT

Never store only:

```text
IER
```

The result must retain:

```text
R
I
A
S
E
C
```

scores and ranks.

The top code is a compact presentation layer.

---

# 21. TOP CODE TIE POLICY

If the third position is tied:

```text
topCode
```

still uses the deterministic ranking rule.

Example:

```text
I = 82
E = 78
R = 75
A = 75
S = 62
C = 59
```

If the stable tie-break selects:

```text
R
```

then:

```text
topCode = IER
```

The result may optionally expose:

```text
tieDetected = true
```

for transparency.

---

# 22. DIMENSION COVERAGE

Coverage measures whether sufficient valid responses exist for each dimension.

For each dimension:

```text
dimensionAnsweredCount
dimensionItemCount
```

Then:

```text
dimensionCoverage =
dimensionAnsweredCount / dimensionItemCount × 100
```

Example:

```text
I:
10 items
9 valid answers

coverage = 90%
```

---

# 23. COMPLETE DIMENSION

For the initial 10-item target:

```text
minimumDimensionAnswers = 8
```

Therefore:

```text
8/10 = 80%
```

is the initial minimum dimension coverage candidate.

This threshold is a product-scoring rule and should be revisited during validation.

---

# 24. OVERALL SUFFICIENCY

A RIASEC result is:

```text
SUFFICIENT
```

when:

```text
overall answered requirement is met
AND
all six dimensions meet minimum dimension coverage
```

Initial proposed rule:

```text
each dimension >= 8 valid responses
```

For a 60-item assessment:

```text
minimum valid responses = 48
```

because:

```text
6 × 8 = 48
```

---

# 25. WHY ALL SIX DIMENSIONS

A RIASEC profile is incomplete if one dimension has insufficient evidence.

For example:

```text
R = 10/10
I = 10/10
A = 10/10
S = 10/10
E = 10/10
C = 3/10
```

The system should not treat this as a fully measured six-dimensional profile.

The missing C evidence could distort:

```text
ranking
topCode
profile interpretation
```

---

# 26. RESULT STATES

Initial result states:

```text
COMPLETE
PARTIAL
INSUFFICIENT
```

### COMPLETE

```text
all six dimensions meet sufficiency
```

### PARTIAL

```text
some valid scoring evidence exists
but complete criteria are not met
```

### INSUFFICIENT

```text
not enough valid evidence to produce a meaningful profile
```

The exact transition rules are defined below.

---

# 27. PARTIAL RESULT

A partial result may contain:

```text
available dimension scores
coverage
quality flags
```

But it must be clearly labeled:

```text
PARTIAL
```

and must not be presented as a fully measured RIASEC profile.

---

# 28. INSUFFICIENT RESULT

If there is too little evidence to produce useful scores:

```text
status = INSUFFICIENT
```

The UI should prioritize:

```text
Please complete more questions
```

rather than presenting speculative interpretation.

---

# 29. OVERALL ANSWERED COUNT

Count only:

```text
valid responses
```

Do not count:

```text
missing
invalid
unrecognized
```

as answered.

---

# 30. DUPLICATE ANSWERS

If multiple answers for the same question are received, the scoring layer must not silently double-count them.

Recommended runtime invariant:

```text
one questionId
→ one effective answer
```

The assessment persistence layer should normally already enforce this.

The scoring engine should defensively resolve duplicates according to the attempt snapshot.

---

# 31. UNSELECTED QUESTIONS

Answers to questions not present in the immutable assessment snapshot must not contribute to scoring.

This protects:

```text
assessment reproducibility
```

---

# 32. QUESTION VERSION INTEGRITY

Every score must be based on:

```text
question version
```

captured by the attempt.

The scoring engine must not query a newer question definition during result calculation.

---

# 33. SCORE REPRODUCIBILITY

Given identical:

```text
questions
answers
question versions
scoring version
```

the scoring engine must always produce the same:

```text
dimension scores
ranks
topCode
coverage
status
```

No uncontrolled randomness is permitted inside scoring.

---

# 34. QUALITY METRICS

The initial result quality object should include:

```text
totalItems
answeredItems
validItems
invalidItems
dimensionCoverage
minimumDimensionCoverage
sufficient
flags
```

Example:

```text
quality = {
  totalItems: 60,
  answeredItems: 58,
  validItems: 58,
  invalidItems: 0,
  dimensionCoverage: {...},
  minimumDimensionCoverage: 80,
  sufficient: true,
  flags: []
}
```

---

# 35. QUALITY FLAGS

Initial candidate flags:

```text
INCOMPLETE
INSUFFICIENT_DIMENSION_COVERAGE
INVALID_RESPONSE
MISSING_DIMENSION
PARTIAL_RESULT
```

Do not introduce advanced psychometric flags without evidence.

---

# 36. RESPONSE PATTERN METRICS

The scoring engine may calculate descriptive metrics such as:

```text
answeredCount
missingCount
invalidCount
dimensionCoverage
```

It should not yet label patterns as:

```text
faking
careless responding
social desirability
random responding
```

unless a validated detection method exists.

---

# 37. PROFILE DIFFERENTIATION

A future metric may quantify how separated the dimensions are.

Initial implementation should **not make this a required scoring output**.

Reason:

```text
score separation
≠
psychological certainty
```

The raw six-dimensional profile is sufficient for V1.

A future version may introduce:

```text
profileDifferentiation
```

after interpretation validation.

---

# 38. NO OVERALL RIASEC SCORE

RIASEC V1 should NOT calculate:

```text
overallScore
```

across all six dimensions.

Why?

Because the purpose is to determine:

```text
pattern of interests
```

not:

```text
how much RIASEC a person has
```

An overall mean would obscure the relative profile.

This is an explicit architectural difference from the current v2 scoring engine.

---

# 39. NO "PASS / FAIL"

RIASEC is not an achievement exam.

Therefore:

```text
PASS
FAIL
```

must not be part of the RIASEC result.

The meaningful states are:

```text
COMPLETE
PARTIAL
INSUFFICIENT
```

---

# 40. SCORE INTERPRETATION BOUNDARY

A normalized score such as:

```text
I = 82
```

means:

> The respondent's measured Investigative interest score is relatively high on the instrument's 0–100 presentation scale.

It does not automatically mean:

```text
82% investigative
82nd percentile
82% chance of succeeding
```

---

# 41. RESULT DATA MODEL

Conceptual payload:

```ts
type RiasecDimensionCode =
  | "R"
  | "I"
  | "A"
  | "S"
  | "E"
  | "C";

type RiasecDimensionResult = {
  code: RiasecDimensionCode;
  rawMean: number | null;
  score: number | null;
  answeredCount: number;
  itemCount: number;
  coveragePercent: number;
  rank: number | null;
};

type RiasecScoringResult = {
  scoringVersion: "RIASEC_SCORE_V1";

  status:
    | "COMPLETE"
    | "PARTIAL"
    | "INSUFFICIENT";

  dimensions: RiasecDimensionResult[];

  topCode: string | null;

  quality: {
    totalItems: number;
    answeredItems: number;
    validItems: number;
    invalidItems: number;
    minimumDimensionCoverage: number;
    sufficient: boolean;
    flags: string[];
  };
};
```

This is the conceptual scoring contract.

---

# 42. EXAMPLE

Suppose the selected assessment contains:

```text
10 items per dimension
60 total
```

and the valid answers produce:

```text
R = 3.8
I = 4.2
A = 3.1
S = 2.9
E = 3.7
C = 3.4
```

Normalized:

```text
R = 70.00
I = 80.00
A = 52.50
S = 47.50
E = 67.50
C = 60.00
```

Ranking:

```text
1. I = 80.00
2. R = 70.00
3. E = 67.50
4. C = 60.00
5. A = 52.50
6. S = 47.50
```

Top code:

```text
IRE
```

assuming the ranking is:

```text
I → R → E
```

---

# 43. PARTIAL EXAMPLE

Suppose:

```text
R = 10/10
I = 10/10
A = 10/10
S = 10/10
E = 10/10
C = 4/10
```

Then:

```text
C coverage = 40%
```

which is below:

```text
80%
```

Therefore:

```text
status = PARTIAL
```

Even though five dimensions are well measured.

---

# 44. INSUFFICIENT EXAMPLE

Suppose only:

```text
20 valid answers
```

exist across 60 items.

This cannot satisfy:

```text
6 × 8 = 48
```

minimum valid responses.

Therefore:

```text
status = INSUFFICIENT
```

---

# 45. SCORING ALGORITHM

Conceptual pseudocode:

```text
validate input
        ↓
filter answers to selected questions
        ↓
validate response values
        ↓
apply reverse scoring
        ↓
group by RIASEC dimension
        ↓
calculate weighted mean
        ↓
normalize 0–100
        ↓
calculate dimension coverage
        ↓
evaluate sufficiency
        ↓
rank six dimensions
        ↓
generate topCode if sufficient enough
        ↓
generate quality flags
        ↓
return immutable scoring payload
```

---

# 46. PSEUDOCODE

```ts
for each question:
  answer = answers[question.id]

  if answer is missing:
    continue

  if answer is invalid:
    invalidCount += 1
    continue

  score = question.reverseScore
    ? 6 - answer.value
    : answer.value

  dimension = question.dimension
  weight = question.weight ?? 1

  buckets[dimension].weightedScore += score * weight
  buckets[dimension].weight += weight
  buckets[dimension].answeredCount += 1
```

Then:

```ts
for each dimension:
  rawMean =
    weightedScore / weight

  normalized =
    ((rawMean - 1) / 4) * 100
```

Then:

```ts
coverage =
  answeredCount / itemCount * 100
```

Then:

```text
if every dimension >= 80%
    COMPLETE
else if meaningful evidence exists
    PARTIAL
else
    INSUFFICIENT
```

---

# 47. ROUNDING

Internal calculation should retain sufficient precision.

Presentation values:

```text
score → 2 decimals
coverage → 2 decimals
rawMean → 2 decimals
```

Avoid repeated rounding during intermediate calculations.

Preferred:

```text
raw values
→ aggregate
→ normalize
→ round once for output
```

---

# 48. FLOATING-POINT CONTROL

The implementation should avoid assumptions such as:

```text
4.2 + 3.1 === 7.3
```

at binary floating-point precision.

Use:

```text
Number(...)
toFixed(2)
```

at the output boundary where appropriate.

Do not round every item score.

---

# 49. WEIGHT VALIDATION

If weight is:

```text
undefined
null
NaN
Infinity
0
negative
```

the engine must apply the documented fallback or reject the item according to the question-bank governance.

Initial recommendation:

```text
missing/invalid weight → 1
```

because V1 is equal-weighted.

---

# 50. DIMENSION VALIDATION

A scoring question with:

```text
dimension ∉ {R,I,A,S,E,C}
```

must not contribute to the RIASEC result.

This should be treated as a question-bank integrity error rather than silently mapped to another dimension.

---

# 51. ITEM COUNT INTEGRITY

The scoring engine should derive:

```text
itemCount
```

from the immutable selected question set.

It should not assume:

```text
60
```

inside the scoring engine.

Why?

Because pilot and future versions may have different item counts.

The sufficiency rule may still be version-specific.

---

# 52. VERSIONED SUFFICIENCY

The 80% dimension coverage rule belongs to:

```text
RIASEC_SCORE_V1
```

It must not become a universal application constant.

Future version:

```text
RIASEC_SCORE_V2
```

may use a different validated threshold.

---

# 53. VERSIONED TOP-CODE

The top-code rule also belongs to the scoring version.

Example:

```text
RIASEC_SCORE_V1
→ top 3
```

Future:

```text
RIASEC_SCORE_V2
→ potentially different validated rule
```

Historical results remain unchanged.

---

# 54. SCORE PERSISTENCE

The persisted result should include enough metadata to reconstruct its provenance:

```text
attemptId
testType
instrumentVersion
questionBankVersion
scoringVersion
```

The result should never depend on the current question bank to interpret a historical score.

---

# 55. SCORING ENGINE SEPARATION

Recommended architecture:

```text
lib/assessment/
│
├── scoring-engine.ts
│
├── scoring/
│   ├── riasec/
│   │   ├── scorer.ts
│   │   ├── types.ts
│   │   ├── constants.ts
│   │   └── validators.ts
│   │
│   ├── disc/
│   ├── cognitive/
│   └── ...
```

The current generic scoring engine should not be overloaded with:

```text
if testType === RIASEC
if testType === DISC
if testType === IQ
...
```

forever.

A test-specific strategy is preferable.

---

# 56. STRATEGY MODEL

Conceptual:

```ts
interface AssessmentScorer<TInput, TResult> {
  score(input: TInput): TResult;
}
```

Then:

```text
RiasecScorer
DiscScorer
CognitiveScorer
EqScorer
...
```

This is an architectural recommendation for later implementation.

---

# 57. NO IMPLEMENTATION YET

This phase does not itself authorize:

```text
editing scoring-engine.ts
Prisma migration
question insertion
result UI changes
```

Implementation begins only after:

```text
3.0-D.1-C
```

is approved and:

```text
3.0-D.1-D
```

has defined the result/interpretation contract.

---

# 58. RELATION TO CURRENT V2 ENGINE

Current v2:

```text
8 domains
→ overall score
→ domain scores
→ subdomain
→ indicator
```

RIASEC V1:

```text
6 interest dimensions
→ six-dimensional profile
→ ranking
→ top code
```

Therefore:

> The RIASEC scorer must not simply rename the existing eight-domain scoring engine.

The underlying measurement logic is different.

---

# 59. LOCKS

### LOCK 01

Scoring version:

```text
RIASEC_SCORE_V1
```

### LOCK 02

Six dimensions:

```text
R I A S E C
```

### LOCK 03

Response scale:

```text
1–5
```

### LOCK 04

Reverse scoring:

```text
6 - response
```

when explicitly configured.

### LOCK 05

Default weight:

```text
1
```

### LOCK 06

Dimension aggregation:

```text
weighted mean
```

### LOCK 07

Normalized product score:

```text
0–100
```

### LOCK 08

No overall RIASEC score.

### LOCK 09

Full six-dimensional profile is retained.

### LOCK 10

Ranking is descending score.

### LOCK 11

Top code uses top 3 dimensions in V1.

### LOCK 12

Dimension coverage target:

```text
80%
```

### LOCK 13

Initial complete-profile requirement:

```text
all six dimensions >= 80% coverage
```

### LOCK 14

Result states:

```text
COMPLETE
PARTIAL
INSUFFICIENT
```

### LOCK 15

Historical scores are reproducible through versioned scoring.

### LOCK 16

The RIASEC scorer is independent from the v2 eight-domain semantic model.

---

# 60. OPEN DECISIONS

The following should remain explicitly open until validation:

```text
1. Whether 80% is the final empirically supported sufficiency threshold
2. Whether 60 items is the final production item count
3. Whether top 3 is the final code representation
4. Whether profile differentiation should enter V1
5. Whether any item weights should differ from 1
6. Final validation statistics
7. Norm/reference strategy
8. Interpretation bands, if any
```

---

# 61. EXIT CRITERIA

Phase 3.0-D.1-C is complete when:

- [ ] Response validation is defined.
- [ ] Reverse scoring is defined.
- [ ] Weighting is defined.
- [ ] Dimension aggregation is defined.
- [ ] Normalization is defined.
- [ ] Ranking is defined.
- [ ] Tie-breaking is defined.
- [ ] Top-code is defined.
- [ ] Dimension coverage is defined.
- [ ] Sufficiency is defined.
- [ ] Result states are defined.
- [ ] Quality metrics are defined.
- [ ] Versioning is defined.
- [ ] Historical reproducibility is defined.
- [ ] Separation from v2 scoring is defined.

---

# 62. NEXT PHASE

After this phase:

```text
PHASE 3.0-D.1-D
RIASEC Result & Interpretation Specification
```

That phase will define:

```text
scoring payload
    ↓
user-facing result
    ↓
dimension interpretation
    ↓
top-code interpretation
    ↓
profile narrative
    ↓
study exploration
    ↓
major exploration boundary
```

Only after the result contract is locked should the RIASEC scoring engine and result UI be implemented.

---

# END OF PHASE 3.0-D.1-C
