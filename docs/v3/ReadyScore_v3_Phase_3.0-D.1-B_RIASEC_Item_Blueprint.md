# ReadyScore v3 — PHASE 3.0-D.1-B
# RIASEC Item Blueprint

**Product:** ReadyScore  
**Phase:** 3.0-D.1-B  
**Version:** 1.0  
**Status:** ITEM DESIGN BASELINE  
**Parent:** 3.0-D.1 — RIASEC Measurement Specification  
**Previous Gate:** 3.0-D.1-A — RIASEC Construct & Dimension Validation  
**Purpose:** Convert the approved RIASEC construct into a controlled, balanced, auditable item-bank blueprint before actual question writing.

---

# 1. PURPOSE

This phase defines **how the RIASEC question bank will be designed**.

It does not yet authorize production coding or final question publication.

The output is the blueprint that determines:

```text
DIMENSION
    ↓
INDICATOR
    ↓
ITEM OBJECTIVE
    ↓
ITEM ARCHETYPE
    ↓
CONTEXT
    ↓
RESPONSE MODEL
    ↓
QUALITY RULE
```

The purpose is to prevent the question bank from becoming a collection of arbitrary statements that happen to be labeled R, I, A, S, E, or C.

---

# 2. DESIGN PRINCIPLE

The central rule is:

> Every scored item must have a defensible relationship to one primary RIASEC interest dimension.

The question should measure:

```text
interest / attraction / preference
```

rather than:

```text
ability
achievement
personality
social status
family expectation
career prestige
```

---

# 3. QUESTION ARCHITECTURE

Each item should conceptually contain:

```text
ITEM
│
├── Identity
│   ├── itemCode
│   ├── instrument
│   └── version
│
├── Measurement
│   ├── primaryDimension
│   ├── indicator
│   ├── constructIntent
│   └── evidenceType
│
├── Content
│   ├── stem
│   ├── context
│   └── responseModel
│
└── Governance
    ├── status
    ├── reviewNotes
    └── source/reference
```

---

# 4. PRIMARY DIMENSION

Each scored item has exactly one primary scoring dimension:

```text
R
I
A
S
E
C
```

The initial scoring engine must not assign fractional scores across dimensions.

If an item appears conceptually relevant to multiple dimensions, the wording must be revised until the intended primary evidence is sufficiently clear.

---

# 5. INDICATOR MODEL

Indicators are used to ensure dimension coverage.

They are **item-design clusters**, not automatically independent psychometric subscales.

Initial working indicator blueprint:

```text
R — Realistic
├── hands_on
├── tools_equipment
├── practical_problem_solving
└── physical_environment

I — Investigative
├── curiosity
├── analysis
├── investigation
└── problem_solving

A — Artistic
├── creativity
├── expression
├── originality
└── aesthetics

S — Social
├── helping
├── teaching
├── communication
└── development

E — Enterprising
├── influence
├── leadership
├── initiative
└── persuasion

C — Conventional
├── organization
├── structure
├── information_order
└── accuracy
```

These indicators are **blueprint categories**. They should not be exposed to users as sixteen additional personality traits.

---

# 6. ITEM COUNT STRATEGY

The final number of items is intentionally not locked by this document.

Candidate balanced designs:

| Total Items | Per Dimension |
|---:|---:|
| 36 | 6 |
| 48 | 8 |
| 60 | 10 |
| 72 | 12 |

Initial recommendation:

> Use **60 items / 10 items per dimension** as the primary pilot candidate.

Reason:

```text
6 dimensions
×
10 items
=
60 scored items
```

This gives enough room to distribute evidence across indicators while keeping completion practical.

The 60-item design is a **pilot candidate**, not yet a validated final instrument.

---

# 7. INDICATOR ALLOCATION

For the 60-item candidate:

```text
10 items / dimension
```

Recommended initial allocation:

```text
R
├── hands_on                 3
├── tools_equipment          2
├── practical_problem_solving 3
└── physical_environment     2

I
├── curiosity                3
├── analysis                 3
├── investigation            2
└── problem_solving          2

A
├── creativity               3
├── expression               2
├── originality              3
└── aesthetics               2

S
├── helping                  3
├── teaching                 2
├── communication            3
└── development              2

E
├── influence                3
├── leadership               2
├── initiative               3
└── persuasion               2

C
├── organization             3
├── structure                2
├── information_order        3
└── accuracy                 2
```

Total:

```text
4 indicators × 10 items = 40 indicator assignments
```

The remaining 20 items are allocated by repeating the strongest evidence categories during item-writing and pilot review.

Important:

> Indicator counts are not final psychometric factor weights.

---

# 8. ITEM ARCHETYPES

The question bank should not rely on one sentence pattern.

Recommended archetypes:

```text
A — Activity Preference
B — Problem Context
C — Work Environment
D — Process Preference
E — Interaction Preference
F — Creation / Exploration Preference
```

---

# 9. ARCHETYPE A — ACTIVITY PREFERENCE

Purpose:

```text
Measure attraction to performing an activity.
```

Generic structure:

```text
"Saya menikmati kegiatan ..."
```

Example direction:

```text
Saya menikmati kegiatan membuat atau memperbaiki sesuatu dengan tangan.
```

Primary use:

```text
R
I
A
S
C
```

depending on activity.

---

# 10. ARCHETYPE B — PROBLEM CONTEXT

Purpose:

```text
Measure attraction to a particular type of problem.
```

Example:

```text
Saya tertarik mencari tahu penyebab ketika suatu sistem tidak bekerja sebagaimana mestinya.
```

Potential primary dimension:

```text
I
```

The item must not require the user to actually solve the problem.

---

# 11. ARCHETYPE C — WORK ENVIRONMENT

Purpose:

```text
Measure attraction to an environment.
```

Example direction:

```text
Saya tertarik berada di lingkungan yang banyak menggunakan alat dan peralatan praktis.
```

Potential primary dimension:

```text
R
```

Environment items must avoid job-title prestige.

---

# 12. ARCHETYPE D — PROCESS PREFERENCE

Purpose:

```text
Measure attraction to a way of working.
```

Example:

```text
Saya menikmati kegiatan menyusun informasi agar mudah ditemukan dan digunakan kembali.
```

Potential primary dimension:

```text
C
```

---

# 13. ARCHETYPE E — INTERACTION PREFERENCE

Purpose:

```text
Measure attraction to interpersonal activity.
```

Example:

```text
Saya menikmati membantu seseorang memahami sesuatu yang sebelumnya sulit baginya.
```

Potential primary dimension:

```text
S
```

---

# 14. ARCHETYPE F — CREATION / EXPLORATION

Purpose:

```text
Measure attraction to creating or exploring possibilities.
```

Example:

```text
Saya tertarik mencoba cara baru untuk menyampaikan sebuah ide.
```

Potential primary dimension:

```text
A
```

---

# 15. DIMENSION BLUEPRINT — R

## Realistic

### Core question objective

Measure interest in:

```text
practical
hands-on
tangible
technical
operational
physical
```

### Item distribution

```text
hands_on
tools_equipment
practical_problem_solving
physical_environment
```

### Preferred contexts

```text
building
repairing
assembling
operating
handling equipment
practical projects
field environments
```

### Avoid

```text
"I am good with machines."
"I want to become an engineer."
"Technical subjects are easy for me."
```

because these introduce:

```text
ability
career preference
academic ability
```

---

# 16. DIMENSION BLUEPRINT — I

## Investigative

### Core question objective

Measure interest in:

```text
curiosity
analysis
research
reasoning
explanation
discovery
```

### Item distribution

```text
curiosity
analysis
investigation
problem_solving
```

### Preferred contexts

```text
why something happens
researching
testing explanations
finding patterns
understanding systems
examining evidence
```

### Avoid

```text
"I am intelligent."
"I always get high math grades."
"I can solve difficult equations."
```

because these measure ability/achievement.

---

# 17. DIMENSION BLUEPRINT — A

## Artistic

### Core question objective

Measure interest in:

```text
creation
expression
originality
imagination
aesthetics
```

### Item distribution

```text
creativity
expression
originality
aesthetics
```

### Preferred contexts

```text
design
writing
visual expression
creative projects
alternative approaches
creative media
```

### Avoid

```text
"I am talented at drawing."
"I am a good artist."
"I want to be famous."
```

because these introduce ability or status.

---

# 18. DIMENSION BLUEPRINT — S

## Social

### Core question objective

Measure interest in:

```text
helping
teaching
guiding
communicating
supporting
developing people
```

### Item distribution

```text
helping
teaching
communication
development
```

### Preferred contexts

```text
explaining
mentoring
supporting
facilitating
coaching
helping groups
```

### Avoid

```text
"I have many friends."
"I am very popular."
"I am extroverted."
```

because these are not equivalent to Social interest.

---

# 19. DIMENSION BLUEPRINT — E

## Enterprising

### Core question objective

Measure interest in:

```text
influence
leadership
initiative
persuasion
goal-oriented action
```

### Item distribution

```text
influence
leadership
initiative
persuasion
```

### Preferred contexts

```text
leading
initiating
negotiating
persuading
organizing people toward a goal
presenting an idea
```

### Avoid

```text
"I am dominant."
"I am an extrovert."
"I will become an entrepreneur."
```

because these are personality/career statements.

---

# 20. DIMENSION BLUEPRINT — C

## Conventional

### Core question objective

Measure interest in:

```text
organization
structure
information order
accuracy
systematic processes
```

### Item distribution

```text
organization
structure
information_order
accuracy
```

### Preferred contexts

```text
organizing information
maintaining records
checking details
following structured procedures
building systematic processes
```

### Avoid

```text
"I am very disciplined."
"I never make mistakes."
"I always follow rules."
```

because these introduce personality or self-evaluation.

---

# 21. ITEM QUALITY RULES

Every item must pass:

```text
ONE PRIMARY CONSTRUCT
ONE PRIMARY DIMENSION
ONE CLEAR ACTIVITY / CONTEXT
ONE RESPONSE INTERPRETATION
```

Avoid:

```text
double-barreled
ambiguous
prestige-loaded
ability-loaded
career-loaded
family-expectation-loaded
```

---

# 22. DOUBLE-BARRELED EXAMPLE

Bad:

> Saya suka merancang dan memimpin proyek besar.

This can measure:

```text
A
E
```

Better:

> Saya menikmati merancang cara baru untuk menyelesaikan sebuah proyek.

or:

> Saya menikmati memimpin orang lain untuk mencapai tujuan proyek.

Now the primary signal is clearer.

---

# 23. ABILITY CONTAMINATION

Bad:

> Saya pandai menganalisis masalah teknis.

This mixes:

```text
ability
technical competence
I/R interest
```

Better:

> Saya tertarik mencari tahu penyebab masalah teknis.

The second measures interest.

---

# 24. PRESTIGE CONTAMINATION

Bad:

> Saya tertarik menjadi dokter karena profesi tersebut sangat bergengsi.

This is not useful RIASEC measurement.

Better:

> Saya tertarik membantu orang memahami dan menangani masalah kesehatan.

Even then, the final item should be reviewed for construct purity.

---

# 25. FAMILY EXPECTATION CONTAMINATION

Avoid items such as:

> Orang tua saya menginginkan saya menjadi ...

This measures social expectation, not vocational interest.

---

# 26. RESPONSE FORMAT

Initial candidate:

```text
LIKERT_5
```

Recommended semantic anchors:

```text
1 = Sangat Tidak Tertarik
2 = Tidak Tertarik
3 = Netral
4 = Tertarik
5 = Sangat Tertarik
```

Every item should be interpretable under the same question context:

```text
"Seberapa tertarik Anda pada aktivitas atau situasi berikut?"
```

---

# 27. UI QUESTION FORMAT

Recommended:

```text
Seberapa tertarik Anda pada aktivitas berikut?

"Mencari tahu mengapa suatu sistem tidak bekerja sebagaimana mestinya."

○ Sangat Tidak Tertarik
○ Tidak Tertarik
○ Netral
○ Tertarik
○ Sangat Tertarik
```

The UI should not expose:

```text
R
I
A
S
E
C
```

during the test.

This prevents users from consciously optimizing their profile.

---

# 28. QUESTION ORDER

Do not present:

```text
R R R R R R
I I I I I I
...
```

because users may infer the structure.

Preferred:

```text
balanced randomized order
```

subject to:

```text
selection constraints
```

and deterministic reproducibility.

---

# 29. SELECTION REQUIREMENT

The question-selection layer must guarantee:

```text
required item count
+
dimension balance
+
published status
+
compatible instrument version
```

The final selection should be snapshotted into the assessment attempt.

---

# 30. QUESTION VERSIONING

Recommended identity:

```text
RIASEC-R-001
RIASEC-R-002
...
RIASEC-I-001
...
RIASEC-C-010
```

Example:

```text
questionCode = RIASEC-I-003
version = V1
instrument = RIASEC
dimension = I
indicator = analysis
```

---

# 31. QUESTION STATUS

Use existing governance where compatible:

```text
DRAFT
REVIEW_REQUIRED
APPROVED
PUBLISHED
RETIRED
```

Only:

```text
PUBLISHED
```

items may enter normal user assessment selection.

---

# 32. ITEM REVIEW WORKFLOW

Every item:

```text
Draft
 ↓
Construct Review
 ↓
Dimension Review
 ↓
Language Review
 ↓
Bias / Ambiguity Review
 ↓
Pilot Candidate
 ↓
Pilot Analysis
 ↓
Approved
 ↓
Published
```

---

# 33. REVIEW CHECKLIST

Reviewer should answer:

### Construct

- Does the item measure interest?
- Does it avoid ability measurement?

### Dimension

- Is the primary dimension defensible?
- Could another dimension be equally plausible?

### Language

- Is the Indonesian natural?
- Is it understandable for the target age?

### Bias

- Does it contain prestige bias?
- Does it imply a socially desirable answer?

### Structure

- Is it double-barreled?
- Is it unnecessarily negative?
- Is the context sufficiently clear?

---

# 34. ITEM QUALITY SCORE

A future internal review score may use:

```text
constructClarity
dimensionClarity
languageClarity
ageAppropriateness
biasRisk
redundancyRisk
```

This is an editorial/QA score.

It must not be confused with psychometric item statistics.

---

# 35. PILOT DATA REQUIREMENT

After the initial candidate bank exists, pilot data should be used to evaluate:

```text
response distribution
missing response
item discrimination
dimension consistency
redundancy
unexpected response patterns
```

The exact statistical procedures belong to the validation phase.

---

# 36. QUESTION BANK TARGET

Recommended pilot bank:

```text
60 production candidates
+
reserve items
```

A reserve pool is important.

Example:

```text
10 target items
+
3–5 reserve candidates
```

per dimension.

This allows weak items to be removed without rebuilding the entire instrument.

---

# 37. RECOMMENDED RESERVE POOL

For each dimension:

```text
10 target
+
4 reserve
=
14 candidates
```

Total:

```text
14 × 6 = 84 candidate items
```

This gives:

```text
60 target
24 reserve
```

The 84-item pool is a design recommendation, not a final validated item count.

---

# 38. WHY RESERVE ITEMS MATTER

Without reserve items:

```text
Draft 60
↓
Pilot
↓
8 weak items
↓
instrument becomes unbalanced
```

With reserve items:

```text
84 candidates
↓
pilot
↓
remove weak items
↓
select strongest balanced 60
```

This creates a much safer development process.

---

# 39. ITEM RANDOMIZATION

Question order should be generated from:

```text
attempt seed
+
question selection
+
stable ordering algorithm
```

The exact algorithm belongs to the selection implementation phase.

The important requirement is:

> Historical attempts must remain reproducible.

---

# 40. NO USER-FACING DIMENSION LABEL

During the test:

```text
DO NOT SHOW:
"Ini soal Investigative."
```

The user should only see the activity/context.

Dimension labels belong in:

```text
result
admin
question bank
analytics
```

---

# 41. ITEM CONTENT EXAMPLES

The following are **blueprint examples only**, not approved production items.

### R

> Saya menikmati kegiatan merakit atau memperbaiki sesuatu.

Primary:

```text
R / hands_on
```

### I

> Saya tertarik mencari tahu penyebab ketika sesuatu tidak berjalan seperti yang diharapkan.

Primary:

```text
I / investigation
```

### A

> Saya menikmati mencari cara yang berbeda untuk mengekspresikan sebuah ide.

Primary:

```text
A / originality
```

### S

> Saya menikmati membantu seseorang memahami sesuatu yang sebelumnya sulit baginya.

Primary:

```text
S / teaching
```

### E

> Saya menikmati mengajak orang lain mendukung sebuah gagasan.

Primary:

```text
E / influence
```

### C

> Saya menikmati menyusun informasi agar mudah ditemukan dan digunakan kembali.

Primary:

```text
C / information_order
```

These examples demonstrate the blueprint logic and must still undergo review before publication.

---

# 42. DIMENSION COVERAGE MATRIX

| Dimension | Indicator | Target | Reserve |
|---|---|---:|---:|
| R | hands_on | 3 | 1 |
| R | tools_equipment | 2 | 1 |
| R | practical_problem_solving | 3 | 1 |
| R | physical_environment | 2 | 1 |
| I | curiosity | 3 | 1 |
| I | analysis | 3 | 1 |
| I | investigation | 2 | 1 |
| I | problem_solving | 2 | 1 |
| A | creativity | 3 | 1 |
| A | expression | 2 | 1 |
| A | originality | 3 | 1 |
| A | aesthetics | 2 | 1 |
| S | helping | 3 | 1 |
| S | teaching | 2 | 1 |
| S | communication | 3 | 1 |
| S | development | 2 | 1 |
| E | influence | 3 | 1 |
| E | leadership | 2 | 1 |
| E | initiative | 3 | 1 |
| E | persuasion | 2 | 1 |
| C | organization | 3 | 1 |
| C | structure | 2 | 1 |
| C | information_order | 3 | 1 |
| C | accuracy | 2 | 1 |

Target:

```text
60
```

Reserve:

```text
24
```

Total:

```text
84
```

---

# 43. BLUEPRINT DATA CONTRACT

Conceptual item record:

```ts
type RiasecItemBlueprint = {
  code: string;
  instrument: "RIASEC";
  version: string;

  dimension:
    | "R"
    | "I"
    | "A"
    | "S"
    | "E"
    | "C";

  indicator: string;

  constructIntent: string;

  archetype:
    | "ACTIVITY"
    | "PROBLEM_CONTEXT"
    | "WORK_ENVIRONMENT"
    | "PROCESS_PREFERENCE"
    | "INTERACTION"
    | "CREATION_EXPLORATION";

  targetAgeRange?: string;

  reverseScore: boolean;

  responseType: "LIKERT_5";

  status:
    | "DRAFT"
    | "REVIEW_REQUIRED"
    | "APPROVED"
    | "PUBLISHED"
    | "RETIRED";
};
```

This is a blueprint contract.

It is not yet the final Prisma schema.

---

# 44. IMPLEMENTATION BOUNDARY

This phase does NOT authorize:

```text
Prisma migration
database schema changes
new universal scoring engine
production question insertion
major mapping
career mapping
```

The next phases must first finalize scoring and interpretation.

---

# 45. LOCKS

### LOCK 01

Initial RIASEC pilot candidate:

```text
60 scored items
```

### LOCK 02

Initial reserve candidate pool:

```text
24 items
```

### LOCK 03

Total initial candidate pool:

```text
84 items
```

### LOCK 04

Each scored item has exactly one primary dimension.

### LOCK 05

Each dimension has multiple indicators.

### LOCK 06

Items primarily measure interest, not ability.

### LOCK 07

Activity/context questions are preferred over occupation labels.

### LOCK 08

The six dimensions receive balanced target representation.

### LOCK 09

The user does not see the dimension code during assessment.

### LOCK 10

Question bank is versioned.

### LOCK 11

Item status is governed.

### LOCK 12

Actual production items require review and pilot evidence.

---

# 46. OPEN DECISIONS

Still open:

```text
1. Exact final item count after pilot
2. Exact reserve count after pilot
3. Exact response wording
4. Exact randomization algorithm
5. Exact selection algorithm
6. Final sufficiency threshold
7. Final scoring algorithm
8. Final normalization
9. Final top-code rule
10. Final interpretation rules
11. Validation statistics
12. Norm/reference strategy
```

---

# 47. EXIT CRITERIA

Phase 3.0-D.1-B is complete when:

- [ ] 60-item candidate design is accepted.
- [ ] Reserve pool strategy is accepted.
- [ ] Six dimensions have balanced coverage.
- [ ] Indicator structure is accepted.
- [ ] Item archetypes are accepted.
- [ ] Item quality rules are accepted.
- [ ] Item governance is accepted.
- [ ] Item metadata contract is accepted.
- [ ] Candidate item-writing can begin.
- [ ] No production database change is required yet.

---

# 48. NEXT PHASE

After this blueprint:

```text
PHASE 3.0-D.1-C
RIASEC Scoring Specification
```

This phase will define precisely:

```text
response
   ↓
item score
   ↓
dimension score
   ↓
normalization
   ↓
ranking
   ↓
topCode
   ↓
coverage
   ↓
sufficiency
   ↓
result payload
```

Only after that should implementation of the RIASEC scoring engine begin.

---

# END OF PHASE 3.0-D.1-B
