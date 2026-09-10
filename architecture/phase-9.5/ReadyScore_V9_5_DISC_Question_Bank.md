# ReadyScore V9.5 — DISC Question Bank

**Status:** IMPLEMENTED / CONTRACT GATE TARGET
**Scope:** Customer DISC question-bank delivery only
**Predecessor:** V8.5 DISC Instrument
**Runtime baseline:** V9.3 Assessment Runtime UX

## 1. Objective

V9.5 delivers the DISC V2 production question bank to the customer assessment path without changing the measurement contract established in V8.5.

The bank uses situational forced-choice items. Each item presents one scenario and four plausible behavioral responses. The four responses map internally to D, I, S, and C through an item-specific permutation.

## 2. Protected V8.5 Contract

The following remain unchanged:

- `DISC_CONFIG_V2`
- `DISC_V2`
- `DISC_TAXONOMY_V2`
- `DISC_SCORE_V2`
- `DISC_SELECTION_V2`
- `DISC_INTERPRETATION_V2`
- `DISC_RESULT_V2`
- 24-item blueprint
- six target scenarios for each D/I/S/C target group
- ipsative forced-choice scoring
- primary and secondary pattern semantics
- no substantive overall DISC score

V9.5 is a question-bank implementation phase, not a measurement redesign phase.

## 3. Production Bank

Source:

`data/question-bank/disc/DISC_V2_SITUATIONAL_FORCED_CHOICE_PRODUCTION_BANK.json`

Required properties:

- exactly 24 items;
- six target scenarios for each of `TARGET_D`, `TARGET_I`, `TARGET_S`, and `TARGET_C`;
- exactly four unique customer-facing options per item;
- every item uses `SCENARIO` + `SINGLE_CHOICE_4`;
- every item has weight `1`;
- every item has an item-specific four-position DISC permutation;
- no item has a `correctOption` field;
- mapping metadata remains internal.

## 4. Position Mapping

The position of an option must not globally reveal its DISC dimension.

The internal representation is:

```text
position 1 → scoringKey[0]
position 2 → scoringKey[1]
position 3 → scoringKey[2]
position 4 → scoringKey[3]
```

The production bank uses multiple permutations. The current 24-item bank also keeps each DISC dimension balanced across the four option positions.

Customers see only the scenario and response texts. They do not see `scoringKey` or `optionDimensions`.

## 5. Scoring Boundary

V9.5 does not introduce a new scoring model.

The protected V8.5 model remains:

```text
selected option
    ↓
item-specific scoringKey
    ↓
D / I / S / C
    ↓
selected counts
    ↓
ipsative dimension percentages
    ↓
primary + secondary pattern
```

Dimension percentages represent the share of forced choices and sum to 100.

The generic `overallScore` compatibility field remains non-substantive and must not be presented to customers as an overall personality or ability score.

## 6. Runtime Safety

The customer runtime may expose:

- scenario text;
- four option texts;
- selected answer position.

The customer runtime must not expose:

- `scoringKey`;
- `optionDimensions`;
- internal DISC dimension mapping;
- hidden scoring semantics.

The answer transport remains restricted to positions `1` through `4`.

## 7. Administration Boundary

`SINGLE_CHOICE_4` is a shared transport type. DISC V2 remains a forced-choice instrument rather than an objective right/wrong instrument.

The admin validation branch must therefore preserve:

- four unique options;
- four-value permutation scoring key;
- no `correctOption` for DISC;
- no reverse scoring requirement.

## 8. Version Safety

No historical question version may be overwritten.

A material future DISC item change must create a new immutable `QuestionVersion` and use the appropriate configuration/question-bank version boundary.

V9.5 introduces no database migration and does not mutate historical V1 QuestionVersions.

## 9. Claims

Allowed customer semantics:

- DISC profile;
- behavioral tendencies;
- primary behavioral pattern;
- secondary behavioral pattern;
- potential strengths and development areas.

Prohibited:

- IQ or aptitude claims;
- clinical diagnosis;
- fixed or deterministic personality claims;
- deterministic career/major decisions;
- universal score;
- raw-average synthesis across unrelated assessments.

## 10. Acceptance Contract

V9.5 passes only when the gate verifies:

1. V8.13 remains the protected baseline.
2. V8.5 DISC measurement and scoring versions remain unchanged.
3. The production bank contains exactly 24 items.
4. Target coverage is 6/6/6/6.
5. Every item has four unique options.
6. Every item has a valid four-position DISC permutation.
7. Position mappings are not globally fixed and are balanced across positions.
8. No DISC item carries a `correctOption` answer key.
9. Customer runtime does not expose internal DISC mapping metadata.
10. No V9.5 database migration exists.
11. Historical QuestionVersion immutability remains protected.
12. V9.5 does not introduce universal-score or raw-average synthesis.
13. The V9.5 gate is registered while V9.0–V9.4 gates remain registered.
