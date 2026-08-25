# ReadyScore v3 — PHASE 3.0-D
# Test Type Measurement Specification

**Product:** ReadyScore  
**Phase:** 3.0-D  
**Version:** 1.0  
**Status:** MEASUREMENT DESIGN BASELINE  
**Depends on:** 3.0-A, 3.0-B, 3.0-C  
**Purpose:** Define the measurement specification framework and initial construct boundaries for every planned ReadyScore Test Type before production scoring/schema implementation.

---

# 1. PURPOSE

Phase 3.0-D answers a different question from Phase 3.0-C.

Phase 3.0-C defined:

> How must an assessment instrument be structured?

Phase 3.0-D defines:

> What does each ReadyScore instrument actually intend to measure?

The target catalog is:

```text
COGNITIVE
EQ
AQ
DISC
RIASEC
STRENGTH
LEARNING
```

This phase therefore establishes:

```text
TEST TYPE
    ↓
CONSTRUCT
    ↓
MEASUREMENT DIMENSIONS
    ↓
EVIDENCE MODEL
    ↓
RESPONSE MODEL
    ↓
SCORING DIRECTION
    ↓
RESULT SEMANTICS
    ↓
INTERPRETATION BOUNDARY
```

It is deliberately **not** a claim that ReadyScore has already created scientifically validated versions of these instruments.

Before production release, each instrument requires its own evidence, item development, validation, reliability analysis, and appropriate interpretation methodology.

---

# 2. IMPORTANT MEASUREMENT PRINCIPLE

ReadyScore v3 must distinguish:

```text
PRODUCT IDEA
        ≠
MEASUREMENT CONSTRUCT
        ≠
SCORING FORMULA
        ≠
RECOMMENDATION
```

For example:

```text
"RIASEC test"
```

does not automatically define:

```text
question format
scoring formula
cut scores
major recommendation
career recommendation
```

Those must be specified independently.

---

# 3. INSTRUMENT CATALOG

Initial catalog:

| Code | Working Name | Primary Measurement Purpose | Primary Result |
|---|---|---|---|
| COGNITIVE | Cognitive / IQ-style | Cognitive ability | Ability profile |
| EQ | Emotional Intelligence | Emotional capability dimensions | EQ profile |
| AQ | Adversity / Adaptability | Response to challenge/adversity | AQ profile |
| DISC | Behavioral Style | Behavioral preference/style | D/I/S/C profile |
| RIASEC | Career Interest | Vocational interest pattern | R/I/A/S/E/C profile |
| STRENGTH | Strength Profile | Relative strength dimensions | Strength profile |
| LEARNING | Learning Profile | Learning-related tendencies | Learning profile |

The names above are **working product names**.

They must not be interpreted as certification that ReadyScore reproduces any proprietary or formally validated instrument.

---

# 4. COGNITIVE / IQ-STYLE

## 4.1 Measurement Intent

Working purpose:

> Estimate selected cognitive abilities relevant to reasoning and problem solving.

The product may present this as a cognitive assessment or IQ-style experience, but the platform must not claim a clinically or psychometrically standardized IQ score unless the underlying instrument is properly developed and validated for that claim.

---

## 4.2 Candidate Dimensions

Initial candidate dimensions:

```text
LOGICAL
NUMERICAL
VERBAL
SPATIAL
```

These are a product-design baseline.

They are not yet a final psychometric specification.

---

## 4.3 Response Model

Preferred direction:

```text
SINGLE_CHOICE
```

Potentially:

```text
CORRECT / INCORRECT
```

The respondent should generally have a demonstrably correct answer for objective cognitive items.

---

## 4.4 Evidence Model

Cognitive measurement should primarily derive evidence from:

```text
item correctness
difficulty
dimension coverage
valid responses
```

A simple Likert agreement score is not the default model for this instrument.

---

## 4.5 Scoring Direction

Conceptual:

```text
Question
    ↓
Correct / Incorrect
    ↓
Dimension Raw Score
    ↓
Scaled Dimension Result
    ↓
Cognitive Profile
```

Potential future outputs:

```text
Logical
Numerical
Verbal
Spatial
Overall Cognitive Indicator
```

An overall score must only be used if the measurement specification supports combining the dimensions.

---

## 4.6 Result Semantics

Result should primarily answer:

```text
Which cognitive dimensions show stronger evidence?
Which dimensions show comparatively lower evidence?
How consistent is the evidence?
```

It should not automatically answer:

```text
Which university major will guarantee success?
```

---

## 4.7 Interpretation Boundary

Cognitive result is evidence about the measured cognitive constructs.

It is not automatically:

```text
academic achievement
personality
interest
motivation
career suitability
clinical diagnosis
```

---

# 5. EQ — EMOTIONAL INTELLIGENCE

## 5.1 Measurement Intent

Working purpose:

> Assess selected emotional/self-management/social-emotional dimensions relevant to how a person perceives, regulates, and responds to emotional situations.

The exact EQ framework must be selected and documented before production implementation.

---

## 5.2 Candidate Dimensions

Initial candidate dimensions:

```text
SELF_AWARENESS
SELF_REGULATION
EMPATHY
SOCIAL_AWARENESS
RELATIONSHIP_MANAGEMENT
```

These are a design candidate, not a final validated construct model.

---

## 5.3 Response Model

Potential:

```text
LIKERT_5
```

or another validated response format.

The exact response model should be determined during instrument design.

---

## 5.4 Evidence Model

Potential evidence:

```text
dimension responses
reverse-keyed items where justified
consistency / quality indicators
dimension coverage
```

The model should not assume that every emotional statement maps directly to a single score.

---

## 5.5 Scoring Direction

Conceptual:

```text
Responses
    ↓
Dimension-level scoring
    ↓
EQ profile
```

Potential result:

```text
Self Awareness
Self Regulation
Empathy
Social Awareness
Relationship Management
```

---

## 5.6 Result Semantics

The result should describe:

```text
relative strengths
development opportunities
dimension pattern
```

It should avoid presenting a single number as an absolute measure of a person's emotional worth or capability.

---

# 6. AQ — ADVERSITY / ADAPTABILITY

## 6.1 Measurement Intent

Working product purpose:

> Assess tendencies in how an individual responds to challenge, setbacks, pressure, uncertainty, and recovery.

The exact AQ construct and methodology must be selected before implementation.

---

## 6.2 Candidate Dimensions

Initial candidate dimensions:

```text
RESPONSE_TO_CHALLENGE
CONTROL
OWNERSHIP
PERSISTENCE
ADAPTABILITY
RECOVERY
```

These are candidate product dimensions.

They are not yet a validated AQ model.

---

## 6.3 Response Model

Potential:

```text
LIKERT_5
```

Scenario-based items may be preferable where the measurement design supports them.

---

## 6.4 Evidence Model

Potential evidence:

```text
challenge-response items
persistence items
adaptation items
recovery items
```

Quality rules must prevent the result from becoming a simple "positive attitude score."

---

## 6.5 Scoring Direction

Conceptual:

```text
Responses
    ↓
AQ dimensions
    ↓
Adversity / adaptability profile
```

The result should preserve the distinction between:

```text
persistence
adaptability
recovery
control
```

rather than collapsing them prematurely.

---

## 6.6 Result Semantics

Potential output:

```text
Challenge Response
Adaptability
Persistence
Recovery
```

Interpretation should focus on tendencies and development areas.

---

# 7. DISC — BEHAVIORAL STYLE

## 7.1 Measurement Intent

Working purpose:

> Describe behavioral style/preferences across four DISC dimensions.

---

## 7.2 Dimensions

Working model:

```text
D — Dominance
I — Influence
S — Steadiness
C — Conscientiousness
```

These dimensions are the intended product representation for the DISC test type.

---

## 7.3 Response Model

DISC should not automatically inherit the current generic Likert engine.

Candidate models include:

```text
FORCED_CHOICE
LIKERT
```

The final response model must be selected based on the actual instrument design.

---

## 7.4 Evidence Model

The instrument should produce evidence for:

```text
D
I
S
C
```

and derive:

```text
primary style
secondary style
profile pattern
```

where supported.

---

## 7.5 Scoring Direction

Conceptual:

```text
Responses
    ↓
D/I/S/C dimension scores
    ↓
Profile derivation
```

The scoring model must explicitly define how response patterns map to dimensions.

---

## 7.6 Result Semantics

Primary output:

```text
D score
I score
S score
C score
```

Derived:

```text
Primary
Secondary
Profile Pattern
```

The result is a behavioral-style profile.

---

## 7.7 Interpretation Boundary

DISC result should not be presented as:

```text
intelligence score
personality diagnosis
clinical assessment
guaranteed career fit
```

It is a behavioral-style interpretation layer.

---

# 8. RIASEC — VOCATIONAL INTEREST

## 8.1 Measurement Intent

Working purpose:

> Identify relative vocational/occupational interest patterns.

---

## 8.2 Dimensions

Working model:

```text
R — Realistic
I — Investigative
A — Artistic
S — Social
E — Enterprising
C — Conventional
```

---

## 8.3 Response Model

Potential:

```text
LIKERT
INTEREST_RATING
FORCED_CHOICE
```

The final model must be selected deliberately.

The wording should ask about interest/preference, not ability.

---

## 8.4 Evidence Model

The core evidence is:

```text
interest response
    ↓
six interest dimensions
```

The instrument should preserve the vector:

```text
R
I
A
S
E
C
```

rather than immediately converting it to one overall percentage.

---

## 8.5 Scoring Direction

Conceptual:

```text
Responses
    ↓
R/I/A/S/E/C scores
    ↓
Relative interest profile
    ↓
Top-code / profile pattern
```

Potential derived output:

```text
RIA
ISE
SEC
...
```

The exact code-generation rule must be specified in the instrument version.

---

## 8.6 Result Semantics

RIASEC should answer:

```text
What types of activities/environments appear more interesting?
Which interest dimensions are relatively stronger?
```

It should not answer:

```text
What can the person definitely do well?
```

Interest and ability are different constructs.

---

# 9. STRENGTH PROFILE

## 9.1 Measurement Intent

Working purpose:

> Identify relative personal strengths across a defined set of strength dimensions.

The phrase "8 intelligences" may be used as a product concept only after the underlying measurement framework is explicitly defined.

---

## 9.2 Candidate Dimensions

Initial candidate product dimensions may include:

```text
LOGICAL
LINGUISTIC
INTERPERSONAL
INTRAPERSONAL
SPATIAL
NATURALISTIC
BODILY_KINESTHETIC
MUSICAL
```

These correspond to the user's proposed eight-intelligence concept.

However:

> This must not automatically be marketed as a scientifically established "IQ equivalent" or as a direct measurement of innate intelligence.

The exact construct language must be reviewed before public claims are made.

---

## 9.3 Response Model

Potential:

```text
LIKERT_5
```

or activity-preference scenarios.

---

## 9.4 Evidence Model

The system should identify:

```text
relative dimension patterns
```

rather than assuming:

```text
high score = objectively superior intelligence
```

---

## 9.5 Result Semantics

Potential:

```text
Top Strengths
Supporting Strengths
Development Areas
Strength Pattern
```

The result should emphasize relative profile.

---

# 10. LEARNING PROFILE

## 10.1 Measurement Intent

Working purpose:

> Describe learning-related preferences or tendencies that may help a learner reflect on how they engage with learning.

This test requires particularly careful construct definition because "learning style" claims vary substantially in scientific support.

ReadyScore should not claim that a learner has one fixed learning style that determines the teaching method they must receive without appropriate evidence.

---

## 10.2 Candidate Dimensions

Possible product dimensions may include:

```text
PREFERENCE_FOR_VISUAL_INPUT
PREFERENCE_FOR_VERBAL_INPUT
PREFERENCE_FOR_PRACTICAL_ACTIVITY
REFLECTION
COLLABORATIVE_LEARNING
INDEPENDENT_LEARNING
```

These are product-design candidates only.

The final construct model must be selected and validated.

---

## 10.3 Result Semantics

The result should preferably be phrased as:

```text
learning preferences / tendencies
```

rather than:

```text
fixed learning type
```

---

# 11. COMPARATIVE MEASUREMENT MATRIX

| Test | Construct | Typical Response Direction | Primary Output |
|---|---|---|---|
| Cognitive | Ability | Objective performance | Ability profile |
| EQ | Emotional dimensions | Self-report / scenario | EQ profile |
| AQ | Challenge/adaptation tendencies | Self-report / scenario | AQ profile |
| DISC | Behavioral style | Self-report / forced-choice | D/I/S/C |
| RIASEC | Vocational interest | Interest response | R/I/A/S/E/C |
| Strength | Relative strengths | Self-report / activity preference | Strength profile |
| Learning | Learning-related tendencies/preferences | Self-report | Learning profile |

---

# 12. IMPORTANT: THESE TESTS ARE NOT THE SAME KIND OF MEASUREMENT

ReadyScore v3 must recognize at least three broad measurement families:

```text
A. PERFORMANCE / ABILITY
   Cognitive

B. SELF-REPORT TRAITS / TENDENCIES
   EQ
   AQ
   DISC
   Learning
   Strength

C. INTEREST / PREFERENCE
   RIASEC
```

This distinction affects:

```text
question design
response model
scoring
normalization
interpretation
confidence
```

Therefore a single universal scoring formula is inappropriate.

---

# 13. SCORE SEMANTICS BY FAMILY

## Ability

Potentially:

```text
correctness
scaled ability
percentile
```

## Self-report

Potentially:

```text
dimension score
profile
band
relative strength
```

## Interest

Potentially:

```text
interest vector
rank
profile code
```

A score of:

```text
80
```

must never be assumed to mean the same thing across these families.

---

# 14. COMMON RESULT ENVELOPE

Despite different measurement models, the platform can share:

```text
attemptId
testType
instrumentId
instrumentVersion
assessmentConfigurationVersion
questionBankVersion
taxonomyVersion
selectionVersion
scoringVersion
status
quality
completedAt
payload
```

The `payload` remains test-specific.

---

# 15. COMMON QUALITY LAYER

All tests should be able to report, where applicable:

```text
validResponseCount
answeredCount
requiredCount
coverage
qualityFlags
sufficiency
```

But the meaning of "quality" can differ.

For example:

```text
Cognitive
→ valid scored items / dimension coverage

Self-report
→ completion / response quality / consistency

Interest
→ dimension coverage
```

---

# 16. COMMON INTERPRETATION LAYER

The UI may standardize presentation:

```text
RESULT
    ↓
WHAT THIS MEASURES
    ↓
YOUR PROFILE
    ↓
WHAT STANDS OUT
    ↓
WHAT TO DEVELOP
    ↓
WHAT THIS DOES NOT MEAN
```

This gives the product a consistent user experience without forcing the measurements into the same mathematics.

---

# 17. MEASUREMENT EVIDENCE REQUIREMENT

Before any instrument becomes production-grade, ReadyScore must document:

```text
construct definition
item rationale
dimension rationale
scoring rationale
reliability evidence
validity evidence
norm/reference methodology where applicable
interpretation boundaries
```

The exact scientific evidence requirements may differ by instrument.

---

# 18. DEVELOPMENT MATURITY LEVELS

Every Test Type should have an internal maturity status:

```text
CONCEPT
    ↓
DESIGN
    ↓
PILOT
    ↓
CALIBRATION
    ↓
VALIDATED
    ↓
PRODUCTION
```

A product can expose an assessment to users at an earlier stage only if the product claims and UX are appropriate to that maturity level.

---

# 19. RECOMMENDED V3 TEST STATUS

Example:

```text
COGNITIVE
DESIGN

EQ
CONCEPT

AQ
CONCEPT

DISC
DESIGN

RIASEC
DESIGN

STRENGTH
CONCEPT

LEARNING
CONCEPT
```

These statuses are planning placeholders, not scientific validation results.

---

# 20. TEST-SPECIFIC SPECIFICATION TEMPLATE

Every future Test Type must have a document containing:

```text
1. Test Identity
2. Measurement Purpose
3. Construct Definition
4. Construct Boundaries
5. Target Population
6. Dimensions
7. Taxonomy
8. Response Model
9. Item Design Rules
10. Question Bank Structure
11. Selection Rules
12. Scoring Model
13. Normalization
14. Sufficiency / Completion
15. Quality Model
16. Result Model
17. Interpretation Model
18. Reporting Model
19. Validation Plan
20. Known Limitations
21. Versioning
22. Release Criteria
```

This becomes the standard instrument specification template.

---

# 21. CROSS-TEST PROFILE INPUTS

Not every test should automatically feed the Cross-Test Profile.

Each instrument must declare:

```text
profileContribution
```

Potentially:

```text
COGNITIVE
→ ability evidence

RIASEC
→ interest evidence

DISC
→ behavioral-style evidence

EQ
→ emotional/social evidence

AQ
→ adversity/adaptation evidence

STRENGTH
→ relative strength evidence

LEARNING
→ learning preference evidence
```

The synthesis engine must preserve these semantic distinctions.

---

# 22. STUDY DIRECTION INPUTS

For the future study-direction engine, the strongest architecture is:

```text
ABILITY
   +
INTEREST
   +
STRENGTH
   +
BEHAVIORAL STYLE
   +
EMOTIONAL / ADAPTATION PROFILE
   +
LEARNING PREFERENCES
        ↓
CROSS-TEST PROFILE
        ↓
STUDY DIRECTION
```

However, not every dimension needs equal influence.

The weighting/decision methodology belongs to the future Direction Engine specification.

---

# 23. MAJOR FIT INPUTS

Major Fit should preferably use:

```text
interest
ability evidence
strength profile
behavioral/contextual evidence
```

rather than:

```text
one test score
```

Conceptually:

```text
Major
  ↑
  │
Evidence Match
  ↑
  ├── Cognitive
  ├── RIASEC
  ├── Strength
  ├── DISC
  ├── EQ/AQ where relevant
  └── User context
```

This makes the future recommendation engine more defensible.

---

# 24. RESULT LANGUAGE PRINCIPLE

ReadyScore should prefer:

```text
"hasil menunjukkan..."
"profil menunjukkan kecenderungan..."
"relatif lebih kuat..."
"area yang dapat dikembangkan..."
"indikasi..."
```

over absolute claims such as:

```text
"Anda pasti cocok..."
"Anda pasti pintar..."
"Anda harus mengambil..."
"Anda tidak cocok..."
```

This is especially important when the product is used for children and education decisions.

---

# 25. CHILD / STUDENT CONTEXT

Because the intended product includes:

```text
student
parent
study direction
major selection
career exploration
```

measurement results should be presented as:

```text
decision-support evidence
```

not:

```text
deterministic destiny
```

The product should encourage:

```text
assessment
+
reflection
+
discussion
+
real-world evidence
```

rather than treating one assessment as the sole basis for a major decision.

---

# 26. PHASE 3.0-D ARCHITECTURAL LOCKS

### LOCK 01
ReadyScore has multiple measurement families.

### LOCK 02
Ability, self-report, and interest assessments are treated differently.

### LOCK 03
Each Test Type owns its construct definition.

### LOCK 04
Each Test Type owns its dimension model.

### LOCK 05
Each Test Type owns its response model.

### LOCK 06
Each Test Type owns its scoring model.

### LOCK 07
Each Test Type owns its result semantics.

### LOCK 08
Each Test Type owns its interpretation boundary.

### LOCK 09
Not every result must produce a 0–100 score.

### LOCK 10
Not every result must produce an overall score.

### LOCK 11
Cross-Test Profile is a synthesis layer.

### LOCK 12
Study Direction / Major Fit / Career Exploration are downstream decision-support layers.

### LOCK 13
Scientific/psychometric claims require evidence and cannot be invented by the application layer.

---

# 27. OPEN SCIENTIFIC / PRODUCT DECISIONS

The following remain open and must be resolved before production implementation of each instrument:

```text
1. Exact construct definition
2. Exact dimension taxonomy
3. Item count
4. Item writing rules
5. Response format
6. Reverse-scoring policy
7. Weighting policy
8. Scoring algorithm
9. Normalization
10. Sufficiency threshold
11. Quality rules
12. Interpretation bands/profile rules
13. Norm/reference strategy
14. Validation method
15. Target population
16. Product claim language
```

These are intentionally not guessed in this phase.

---

# 28. RECOMMENDED IMPLEMENTATION ORDER

Do not implement all seven instruments simultaneously.

Recommended sequence:

```text
FIRST WAVE
1. RIASEC
2. DISC
3. Cognitive

SECOND WAVE
4. EQ
5. AQ

THIRD WAVE
6. Strength
7. Learning
```

Rationale:

```text
RIASEC
→ directly relevant to study/major direction

DISC
→ strong profile UX and complementary behavioral dimension

Cognitive
→ adds ability evidence

EQ/AQ
→ enrich personal profile

Strength/Learning
→ additional product depth
```

This is a product-development recommendation, not a scientific ranking.

---

# 29. RECOMMENDED FIRST PRODUCTION JOURNEY

The strongest end-to-end path is:

```text
RIASEC
    ↓
RIASEC Question Bank
    ↓
RIASEC Scoring
    ↓
RIASEC Result
    ↓
RIASEC Interpretation
    ↓
Study Interest Profile
```

Then:

```text
RIASEC
    +
Cognitive
    +
Strength
    ↓
Cross-Test Profile
    ↓
Study Direction
```

Then:

```text
Study Direction
    +
Major Database
    ↓
Major Fit
```

Then:

```text
Major Fit
    +
Career Database
    ↓
Career Exploration
```

This creates a coherent commercial story.

---

# 30. PHASE 3.0-D EXIT CRITERIA

Phase 3.0-D passes when:

- [ ] All seven candidate Test Types have explicit measurement intent.
- [ ] Each Test Type has an explicit construct boundary.
- [ ] Measurement families are distinguished.
- [ ] Candidate dimensions are documented.
- [ ] Response-model direction is documented.
- [ ] Scoring direction is documented.
- [ ] Result semantics are documented.
- [ ] Interpretation boundaries are documented.
- [ ] Cross-Test contribution is conceptually documented.
- [ ] Scientific unknowns are explicitly marked instead of guessed.
- [ ] Production maturity is tracked per instrument.
- [ ] First implementation order is selected.
- [ ] No database implementation is started from unresolved measurement assumptions.

---

# 31. NEXT PHASE

After 3.0-D, the recommended next step is:

```text
PHASE 3.1
Commercial Product & Entitlement Architecture
```

However, if the priority is to validate the measurement system first, the next practical sub-phase should be:

```text
3.0-D.1
RIASEC Measurement Specification
```

with a complete instrument definition:

```text
Construct
Dimensions
Question Design
Response Model
Scoring
Result
Interpretation
Validation Plan
```

Only after that instrument is sufficiently specified should we implement its question bank and scoring engine.

---

# END OF PHASE 3.0-D
