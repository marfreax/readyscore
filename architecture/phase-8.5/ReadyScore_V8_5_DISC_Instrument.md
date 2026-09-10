# ReadyScore V8.5 — DISC Instrument

**Status:** IMPLEMENTED / CONTRACT GATE TARGET  
**Scope:** DISC measurement instrument only  
**Predecessors:** V8.0 Audit, V8.1 Measurement Specification Lock, V8.2 Question & Scoring Architecture, V8.3 Cognitive, V8.4 EQ

## 1. Decision

DISC V2 uses **situational forced-choice**.

Each item presents four plausible behavioral responses. Exactly one response is keyed to each of:

- D — Dominance
- I — Influence
- S — Steadiness
- C — Conscientiousness

The participant sees only the scenario and four responses. Internal dimension mappings and scoring keys are never exposed.

## 2. Blueprint

- 24 items
- 4 target-scenario groups
- 6 content-targeted scenarios for each D/I/S/C construct
- every item contains all four DISC response dimensions
- equal item weight = 1

The target scenario group is a content blueprint, not a scoring dimension assignment. The selected response determines the scored dimension.

## 3. Position Mapping

There is **no universal A=D, B=I, C=S, D=C rule**.

The option-to-dimension mapping is an item-specific permutation. Position changes across items so participants cannot infer the scoring rule from option position.

Internal encoding:

```text
1 = D
2 = I
3 = S
4 = C
```

`scoringKey[position - 1]` identifies the dimension selected by that option.

## 4. Scoring

DISC V2 is ipsative.

For every answered item:

```text
selected option
    ↓
item-specific scoringKey
    ↓
D / I / S / C
    ↓
dimension selected count
```

Dimension score:

```text
selected count / 24 × 100
```

The four dimension percentages therefore sum to 100.

These values describe the distribution of forced choices within the assessment. They are not independent ability scores.

## 5. Primary / Secondary

Primary pattern = highest selected count.

Secondary pattern = second-highest selected count.

Ties use deterministic D/I/S/C order only as a display tie-breaker. The underlying counts are unchanged.

## 6. Overall Score Rule

DISC V2 has **no substantive overall DISC score**.

A legacy-compatible `overallScore` field remains in the generic result envelope because the existing application result type expects it. In V2 it is a compatibility field equal to the primary profile percentage and must not be presented to customers as:

- an ability score;
- an IQ/EQ-like score;
- a universal score;
- a measure of overall personality quality.

The customer-facing semantic result is the DISC profile.

## 7. Version Boundaries

Active:

- `DISC_CONFIG_V2`
- `DISC_V2`
- `DISC_TAXONOMY_V2`
- `DISC_SCORE_V2`
- `DISC_SELECTION_V2`
- `DISC_INTERPRETATION_V2`
- `DISC_RESULT_V2`

Historical V1 remains preserved:

- `DISC_CONFIG_V1`
- `DISC_SCORE_V1`
- `DISC_SELECTION_V1`
- `DISC_TAXONOMY_V1`
- `DISC_RESULT_V1`

Historical QuestionVersions are immutable.

## 8. Claims

Allowed:

- behavioral response tendencies
- primary/secondary behavioral patterns
- potential strengths
- potential development areas

Restricted/prohibited:

- fixed personality labels
- clinical/diagnostic claims
- intelligence/aptitude claims
- deterministic career or major recommendations
- universal score across assessments

## 9. Runtime Safety

Customer runtime must expose:

- scenario text
- four option texts
- answer position

Customer runtime must not expose:

- scoringKey
- optionDimensions
- hidden dimension mapping
- internal answer semantics

The runtime accepts only values 1–4.

## 10. Question-Bank Administration

`SINGLE_CHOICE_4` is a transport/interaction type shared by objective and forced-choice instruments.

DISC V2 therefore requires a dedicated validation branch:

- four unique options;
- four-position dimension permutation;
- no `correctOption`;
- no reverse scoring.

The generic objective validation rule must not incorrectly force a right/wrong answer onto DISC.

## 11. Migration

V8.5 uses an additive data migration only:

- retire active `DISC_TAXONOMY_V1`;
- activate `DISC_TAXONOMY_V2`;
- no `QuestionVersion` schema alteration;
- no destructive table operation;
- migration is idempotent.

Question seeding is transactional and creates new logical Question identities.

## 12. Regression Contract

V8.5 must verify:

```text
24 runtime questions
        ↓
four options per item
        ↓
item-specific mapping
        ↓
24 responses
        ↓
D/I/S/C selected counts
        ↓
0–100 dimension percentages
        ↓
primary + secondary pattern
        ↓
DISC_RESULT_V2
        ↓
DISC_INTERPRETATION_V2
```

No customer-facing result may interpret the compatibility `overallScore` as a substantive DISC score.

## 13. Relationship to V8.6

V8.6 may now proceed to RIASEC Instrument only after V8.5 gate and runtime regression pass.
