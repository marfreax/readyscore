# ReadyScore v3 — PHASE 3.0-D.1-D
# RIASEC Result & Interpretation Specification

**Product:** ReadyScore  
**Phase:** 3.0-D.1-D  
**Version:** 1.0  
**Status:** RESULT & INTERPRETATION DESIGN BASELINE  
**Parent:** 3.0-D.1 — RIASEC Measurement Specification  
**Previous Gate:** 3.0-D.1-C — RIASEC Scoring Specification  
**Purpose:** Define how a valid RIASEC scoring payload becomes a user-facing result, interpretation, profile narrative, and controlled study-exploration output.

---

# 1. PURPOSE

This phase defines the layer after scoring:

```text
RIASEC SCORING
      ↓
RESULT MODEL
      ↓
PROFILE INTERPRETATION
      ↓
USER-FACING NARRATIVE
      ↓
STUDY EXPLORATION
      ↓
MAJOR EXPLORATION
```

The critical architectural rule is:

> Scoring determines the measurement result. Interpretation explains the result. Recommendation uses the result as evidence.

These layers must not be collapsed into one algorithm.

---

# 2. RESULT LAYERS

ReadyScore v3 should distinguish:

```text
LAYER 1 — Measurement
What was measured?

LAYER 2 — Profile
What is the respondent's RIASEC pattern?

LAYER 3 — Interpretation
What does that pattern generally indicate?

LAYER 4 — Exploration
What study/career areas may be worth exploring?

LAYER 5 — Decision Support
What additional evidence should be considered?
```

RIASEC V1 owns Layers 1–3.

Layer 4 is allowed only as a controlled exploration feature.

Layer 5 belongs to the future cross-test architecture.

---

# 3. RESULT STATES

The result state comes from the scoring contract.

```text
COMPLETE
PARTIAL
INSUFFICIENT
```

---

# 4. COMPLETE RESULT

A complete RIASEC result means:

```text
all six dimensions
meet the V1 sufficiency requirement
```

Initial scoring rule:

```text
each dimension >= 80% coverage
```

The user may receive:

```text
full six-dimensional profile
top code
dimension interpretation
profile summary
study exploration
```

subject to product entitlement.

---

# 5. PARTIAL RESULT

A partial result means:

```text
there is meaningful scoring evidence
but the complete-profile requirement is not satisfied
```

The UI must clearly display:

```text
Hasil belum lengkap
```

or equivalent.

The system may show:

```text
available scores
coverage
what remains incomplete
```

It must avoid presenting a partial profile as definitive.

---

# 6. INSUFFICIENT RESULT

An insufficient result means:

```text
there is not enough valid evidence
```

to support meaningful RIASEC interpretation.

The UI should prioritize:

```text
completion guidance
```

rather than a personality/career narrative.

---

# 7. USER-FACING RESULT STRUCTURE

Recommended result page:

```text
RIASEC RESULT
│
├── Completion / Quality Status
│
├── Profile Summary
│
├── Top 3 Profile Code
│
├── Six-Dimension Profile
│
├── Dimension Explanations
│
├── Profile Pattern
│
├── Study Exploration
│
└── Next Step
```

The exact visual UI is a later implementation concern.

---

# 8. PROFILE SUMMARY

The first narrative should answer:

> "Pola minat utama saya seperti apa?"

Example structure:

```text
Profil minat Anda menunjukkan kecenderungan paling kuat pada
Investigative, Realistic, dan Enterprising.
```

The narrative should be generated from the actual ranking.

It must not invent characteristics unsupported by the measured profile.

---

# 9. TOP CODE

Example:

```text
IER
```

The UI may display:

```text
Profil RIASEC Anda
IER
```

with the expanded names:

```text
I — Investigative
R — Realistic
E — Enterprising
```

The code is a compact representation.

It is not a diagnosis.

---

# 10. TOP-CODE INTERPRETATION

The interpretation should describe the combination.

For:

```text
I + R + E
```

the system may describe the broad pattern as:

```text
interest in understanding problems,
working with practical systems,
and taking initiative toward outcomes.
```

This is an interpretation of the combination.

It must not claim:

```text
"you are definitely suited to engineering"
```

---

# 11. DIMENSION DESCRIPTIONS

The result should have a stable canonical description for each dimension.

## R — Realistic

Focus:

```text
hands-on
practical
tools
equipment
tangible activity
operational environments
```

Example interpretation:

> Anda cenderung menikmati aktivitas yang melibatkan praktik langsung, penggunaan alat atau peralatan, serta penyelesaian masalah yang konkret.

---

## I — Investigative

Focus:

```text
curiosity
analysis
research
reasoning
problem solving
```

Example interpretation:

> Anda cenderung menikmati aktivitas yang mendorong rasa ingin tahu, analisis, pencarian sebab, dan pemahaman terhadap bagaimana sesuatu bekerja.

---

## A — Artistic

Focus:

```text
creativity
expression
originality
aesthetics
```

Example interpretation:

> Anda cenderung menikmati aktivitas yang memberi ruang untuk menciptakan, berekspresi, mencoba pendekatan berbeda, dan menghasilkan sesuatu yang orisinal.

---

## S — Social

Focus:

```text
helping
teaching
communication
development
```

Example interpretation:

> Anda cenderung menikmati aktivitas yang melibatkan membantu, menjelaskan, mengajar, mendukung, atau membantu orang lain berkembang.

---

## E — Enterprising

Focus:

```text
influence
leadership
initiative
persuasion
```

Example interpretation:

> Anda cenderung menikmati aktivitas yang melibatkan mengambil inisiatif, memengaruhi orang lain, memimpin, bernegosiasi, atau menggerakkan sesuatu menuju tujuan.

---

## C — Conventional

Focus:

```text
organization
structure
information order
accuracy
```

Example interpretation:

> Anda cenderung menikmati aktivitas yang membutuhkan keteraturan, pengorganisasian informasi, proses yang sistematis, dan perhatian terhadap detail.

---

# 12. HIGH / MEDIUM / LOW LABELS

V1 should **not** automatically use universal labels such as:

```text
High
Medium
Low
```

based solely on arbitrary 0–100 cutoffs.

Why?

Because:

```text
82
```

is a normalized instrument score, not automatically a population percentile.

The first interpretation layer should therefore emphasize:

```text
relative ranking
```

rather than unsupported absolute categories.

---

# 13. RELATIVE PROFILE

The most important result is:

```text
relationship among the six scores
```

Example:

```text
I 80
R 74
E 70
C 62
A 55
S 49
```

The result should emphasize:

```text
I > R > E
```

rather than:

```text
I = 80 means "80% Investigative"
```

---

# 14. PROFILE PATTERN

The interpretation layer may identify:

```text
dominant dimensions
secondary dimensions
lower relative dimensions
```

Example:

```text
Dominant:
I, R, E

Secondary:
C

Lower relative:
A, S
```

However:

> Lower relative interest does not mean weakness.

This distinction must appear in the UI/content.

---

# 15. IMPORTANT LANGUAGE RULE

Avoid:

```text
Anda lemah dalam Social.
```

Prefer:

```text
Social bukan salah satu kecenderungan minat utama Anda pada assessment ini.
```

Likewise:

```text
C rendah
```

should not become:

```text
Anda tidak cocok bekerja secara terstruktur.
```

---

# 16. STRENGTH OF PROFILE

The word:

```text
strength
```

must be used carefully.

RIASEC measures:

```text
interest
```

not:

```text
capability
```

Therefore prefer:

```text
kecenderungan minat paling kuat
```

instead of:

```text
kekuatan Anda
```

unless clearly qualified.

---

# 17. PROFILE NARRATIVE ENGINE

Conceptually:

```text
scores
  ↓
ranking
  ↓
top 3
  ↓
canonical dimension descriptions
  ↓
combination narrative
```

The narrative must be deterministic.

Same result:

```text
same narrative
```

unless the interpretation version changes.

---

# 18. INTERPRETATION VERSION

Introduce:

```text
RIASEC_INTERPRETATION_V1
```

This must be stored with the result or be deterministically associated with it.

Why?

Because interpretation language may change without changing the underlying score.

Example:

```text
RIASEC_SCORE_V1
RIASEC_INTERPRETATION_V1
```

A future version could become:

```text
RIASEC_SCORE_V1
RIASEC_INTERPRETATION_V2
```

without recalculating the original score.

---

# 19. RESULT PROVENANCE

A production result should be traceable to:

```text
attemptId
testType
assessmentConfigurationVersion
questionBankVersion
scoringVersion
interpretationVersion
completedAt
```

This enables:

```text
audit
reproducibility
support
historical consistency
```

---

# 20. PROFILE DATA CONTRACT

Conceptual:

```ts
type RiasecInterpretation = {
  interpretationVersion: "RIASEC_INTERPRETATION_V1";

  profileSummary: string;

  topCode: string;

  topDimensions: Array<{
    code: "R" | "I" | "A" | "S" | "E" | "C";
    rank: number;
    score: number;
    title: string;
    description: string;
  }>;

  profilePattern: string;

  explorationNotes: string[];
};
```

This is a conceptual contract.

It does not yet prescribe the final database schema.

---

# 21. STUDY EXPLORATION

RIASEC can support:

```text
study-area exploration
```

but not deterministic major selection.

Recommended wording:

```text
"Bidang studi yang layak Anda eksplorasi"
```

rather than:

```text
"Jurusan yang harus Anda pilih"
```

---

# 22. MAJOR EXPLORATION MODEL

A future study-mapping layer may use:

```text
RIASEC profile
      ↓
study area
      ↓
major examples
```

Example:

```text
I + R
→ technology
→ engineering
→ applied science
```

This is an exploration mapping, not a final recommendation.

---

# 23. DO NOT MAP DIRECTLY FROM ONE DIMENSION

Avoid:

```text
R → Engineering
I → Science
A → Design
S → Education
E → Business
C → Accounting
```

as rigid rules.

Why?

Because real study areas contain multiple interest orientations.

Example:

```text
Engineering
= R + I
```

while:

```text
Business
= E + S + C
```

depending on the role and specialization.

---

# 24. STUDY MAPPING SHOULD BE PROFILE-BASED

The future mapping model should use:

```text
top 2
top 3
relative profile
```

rather than a single dominant dimension.

Example:

```text
I + R
```

may produce:

```text
Engineering
Technology
Applied Science
Architecture-related technical areas
```

depending on the final mapping dataset.

---

# 25. CAREER EXPLORATION

Career exploration is downstream:

```text
RIASEC
  ↓
study exploration
  ↓
career exploration
```

The RIASEC result itself should not claim:

```text
"you will succeed as X"
```

or:

```text
"you should become X"
```

---

# 26. ABILITY DISCLAIMER

This is especially important for student use.

The result should explain:

> Minat menunjukkan bidang aktivitas yang cenderung menarik bagi Anda. Minat tidak sama dengan kemampuan atau prestasi akademik.

Therefore:

```text
RIASEC
+
Cognitive
+
Strength
```

will eventually be more useful than RIASEC alone.

---

# 27. FUTURE CROSS-TEST INTERPRETATION

When multiple assessments exist:

```text
RIASEC
DISC
Cognitive
EQ
AQ
Strength
Learning
```

the future profile engine may combine evidence.

Example:

```text
RIASEC → interest
Cognitive → ability
Strength → relative strengths
DISC → behavioral style
```

This belongs to:

```text
Phase 3.0-E
```

and must not be implemented as part of RIASEC V1.

---

# 28. COMMERCIAL ENTITLEMENT

Result interpretation depth may depend on the user's subscribed product.

The measurement itself should remain internally consistent.

Example conceptual model:

```text
FREE
├── basic score visibility
└── limited explanation

BASIC
├── full six-dimensional profile
└── basic interpretation

MEDIUM
├── full profile
├── top-code interpretation
└── study exploration

ADVANCE
├── full profile
├── study exploration
├── broader cross-test insight
└── advanced decision support
```

These are product-layer examples.

The final commercial entitlement matrix belongs to the commercial/product phase, not the RIASEC scoring engine.

---

# 29. IMPORTANT COMMERCIAL RULE

Do not create:

```text
different scoring formulas
```

for:

```text
Free
Basic
Medium
Advance
```

unless explicitly intended as a future product experiment.

The safer model is:

```text
SAME MEASUREMENT
        ↓
DIFFERENT ACCESS / DEPTH
```

This protects result consistency.

---

# 30. RESULT DISPLAY ORDER

Recommended:

```text
1. Result status
2. Profile headline
3. Top code
4. Six-dimensional profile
5. Top 3 explanations
6. Profile pattern
7. Study exploration
8. Important caveat
9. Next assessment / next action
```

---

# 31. EXAMPLE USER RESULT

Example measured profile:

```text
I 80
R 74
E 70
C 62
A 55
S 49
```

User-facing result:

```text
Profil Minat Anda

IER

Kecenderungan minat Anda paling kuat berada pada
Investigative, Realistic, dan Enterprising.

Anda cenderung tertarik pada aktivitas yang melibatkan
pemahaman masalah, aktivitas praktis, serta mengambil
inisiatif untuk menghasilkan suatu tujuan.

Bidang studi yang dapat Anda eksplorasi antara lain
area yang menggabungkan analisis, penerapan praktis,
dan pemecahan masalah.
```

Then:

```text
Catatan:
Hasil ini menggambarkan pola minat, bukan ukuran kemampuan
atau jaminan bahwa suatu jurusan tertentu pasti sesuai.
```

---

# 32. PROFILE INTERPRETATION SHOULD BE COMBINATION-AWARE

The narrative engine should eventually support combinations:

```text
RI
RA
RS
RE
RC
IR
IA
...
```

and top-three combinations.

However, V1 does not need a manually written narrative for all:

```text
6P3 = 120
```

possible ordered top-three combinations.

A compositional narrative system is preferred.

---

# 33. COMPOSITIONAL NARRATIVE

Concept:

```text
dimension statement
+
dimension statement
+
combination bridge
```

Example:

```text
I:
analytical / investigative

R:
practical / hands-on

E:
initiative / influence

Bridge:
"Perpaduan ini dapat menunjukkan ketertarikan pada
aktivitas yang menggabungkan pemahaman masalah,
penerapan praktis, dan dorongan untuk menggerakkan hasil."
```

This is more maintainable than writing 120 separate profiles.

---

# 34. NARRATIVE SAFETY

The narrative must avoid deterministic statements such as:

```text
Anda pasti cocok menjadi...
Anda tidak cocok menjadi...
Anda harus memilih...
Masa depan Anda adalah...
```

Preferred:

```text
Anda dapat mengeksplorasi...
Bidang yang mungkin menarik untuk dipertimbangkan...
Hasil ini menunjukkan kecenderungan...
Untuk keputusan yang lebih lengkap, pertimbangkan...
```

---

# 35. PARTIAL RESULT INTERPRETATION

For partial results:

```text
Do:
- show measured dimensions
- show coverage
- explain incompleteness

Do not:
- generate a definitive top-code narrative
- generate strong major recommendations
- present the profile as complete
```

Initial recommendation:

```text
topCode = null
```

unless the product explicitly defines a limited provisional code.

---

# 36. INSUFFICIENT RESULT INTERPRETATION

For:

```text
INSUFFICIENT
```

show:

```text
Assessment belum memiliki cukup jawaban untuk menghasilkan
profil minat yang dapat diinterpretasikan dengan baik.
```

Then:

```text
continue assessment
```

---

# 37. SCORE VISUALIZATION

The six dimensions may be visualized using:

```text
horizontal bars
radar chart
six-card profile
```

The visualization must preserve:

```text
R I A S E C
```

without implying that a higher score is a universally better person.

---

# 38. VISUAL SEMANTICS

Avoid labels such as:

```text
BEST
WORST
WEAK
STRONG PERSON
```

Prefer:

```text
Higher relative interest
Lower relative interest
Primary interest
Secondary interest
```

---

# 39. RESULT COPY LANGUAGE

Preferred vocabulary:

```text
minat
kecenderungan
preferensi aktivitas
pola
eksplorasi
bidang yang mungkin menarik
```

Avoid:

```text
bakat
kemampuan
kepribadian
diagnosis
kepastian
```

unless another instrument actually measures the corresponding construct.

---

# 40. "BAKAT" PRODUCT POSITIONING

ReadyScore may eventually market a broader:

```text
minat + kemampuan + kekuatan
```

assessment ecosystem.

But RIASEC itself should not be described as:

```text
tes bakat
```

in the strict measurement sense.

This distinction becomes important when ReadyScore later introduces:

```text
Cognitive
Strength
```

---

# 41. RESULT API CONTRACT

Conceptually:

```text
GET /api/assessment/[attemptId]/result
```

should eventually return:

```text
metadata
measurement
interpretation
quality
exploration
```

Example:

```json
{
  "testType": "RIASEC",
  "status": "COMPLETE",
  "scoringVersion": "RIASEC_SCORE_V1",
  "interpretationVersion": "RIASEC_INTERPRETATION_V1",
  "topCode": "IER",
  "dimensions": [],
  "profileSummary": "...",
  "profilePattern": "...",
  "exploration": []
}
```

Exact API schema belongs to implementation.

---

# 42. RESULT PERSISTENCE PRINCIPLE

Persist the calculated result snapshot.

Do not regenerate historical results from:

```text
current question bank
current interpretation templates
current mapping
```

unless the user explicitly requests a re-evaluation under a new version.

Historical integrity is mandatory.

---

# 43. RE-INTERPRETATION

A future system may support:

```text
same score
+
new interpretation version
```

But this should be explicit.

Example:

```text
Score:
RIASEC_SCORE_V1

Original:
RIASEC_INTERPRETATION_V1

Reinterpreted:
RIASEC_INTERPRETATION_V2
```

The original result remains preserved.

---

# 44. STUDY EXPLORATION DATA CONTRACT

Conceptual:

```ts
type StudyExploration = {
  title: string;
  rationale: string;
  interestSignals: Array<"R" | "I" | "A" | "S" | "E" | "C">;
  areas: Array<{
    code: string;
    name: string;
    description: string;
  }>;
};
```

The mapping dataset must be versioned separately.

---

# 45. MAPPING VERSION

Introduce conceptually:

```text
RIASEC_STUDY_MAPPING_V1
```

This should not be hard-coded inside the scorer.

This allows:

```text
score stays same
mapping can improve
```

without changing the measurement.

---

# 46. THREE VERSION LAYERS

RIASEC should eventually have:

```text
Question Bank Version
        ↓
Scoring Version
        ↓
Interpretation Version
        ↓
Study Mapping Version
```

Example:

```text
RIASEC_QB_V1
RIASEC_SCORE_V1
RIASEC_INTERPRETATION_V1
RIASEC_STUDY_MAPPING_V1
```

This is a critical v3 architecture decision.

---

# 47. WHY THIS MATTERS

Suppose a future mapping changes:

```text
I + R
```

from:

```text
Technology
Engineering
```

to:

```text
Technology
Engineering
Applied Science
```

The user's score should not change.

Only:

```text
mappingVersion
```

changes.

---

# 48. RESULT PROVENANCE

Final provenance chain:

```text
Assessment Attempt
       ↓
Question Bank Snapshot
       ↓
Answers
       ↓
RIASEC_SCORE_V1
       ↓
RIASEC_INTERPRETATION_V1
       ↓
RIASEC_STUDY_MAPPING_V1
```

This creates an auditable result.

---

# 49. LOCKS

### LOCK 01

RIASEC interpretation is separate from scoring.

### LOCK 02

Interpretation version:

```text
RIASEC_INTERPRETATION_V1
```

### LOCK 03

Full six-dimensional profile remains visible/available.

### LOCK 04

Top code is a summary, not a diagnosis.

### LOCK 05

Relative ranking is more important than arbitrary absolute bands.

### LOCK 06

Lower relative interest is not weakness.

### LOCK 07

RIASEC measures interest, not ability.

### LOCK 08

Major/career suggestions are exploratory.

### LOCK 09

No deterministic "you should become X" statements.

### LOCK 10

Study mapping is separate from scoring.

### LOCK 11

Study mapping is separately versioned.

### LOCK 12

Commercial tiers control access/depth, not the underlying measurement.

### LOCK 13

Historical result snapshots are preserved.

### LOCK 14

Partial and insufficient results are not presented as complete.

---

# 50. OPEN DECISIONS

Still open:

```text
1. Exact result UI
2. Final narrative templates
3. Exact combination narrative rules
4. Study-area mapping dataset
5. Major mapping dataset
6. Career mapping dataset
7. Commercial entitlement matrix
8. Whether to show radar chart
9. Final interpretation language after user testing
10. Validation of interpretation comprehension
```

These belong to later product/implementation work.

---

# 51. EXIT CRITERIA

Phase 3.0-D.1-D is complete when:

- [ ] Result states are defined.
- [ ] User-facing result structure is defined.
- [ ] Top-code presentation is defined.
- [ ] Six-dimension interpretation is defined.
- [ ] Profile narrative principles are defined.
- [ ] Relative-profile interpretation is defined.
- [ ] Partial-result behavior is defined.
- [ ] Insufficient-result behavior is defined.
- [ ] Study-exploration boundary is defined.
- [ ] Major/career recommendation boundary is defined.
- [ ] Interpretation versioning is defined.
- [ ] Mapping versioning is defined.
- [ ] Result provenance is defined.
- [ ] Commercial entitlement boundary is defined.

---

# 52. NEXT PHASE

The next gate is:

```text
PHASE 3.0-D.1-E
RIASEC Validation & Production Readiness
```

This phase will determine whether the RIASEC instrument is sufficiently ready to move from:

```text
DESIGN
```

to:

```text
IMPLEMENTATION / PILOT
```

It will cover:

```text
construct review
item review
scoring verification
coverage tests
edge cases
pilot readiness
validation requirements
production gate
```

Only after that gate should the implementation team create the production RIASEC question bank and scoring engine.

---

# END OF PHASE 3.0-D.1-D
