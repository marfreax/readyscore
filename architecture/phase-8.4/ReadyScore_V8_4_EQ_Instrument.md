# ReadyScore V8.4 — EQ Instrument

## Status

**V8.4 IMPLEMENTED — SITUATIONAL-JUDGMENT EQ INSTRUMENT**

Baseline:
- V8.0 Assessment Instrument Audit — PASS
- V8.1 Measurement Specification Lock — PASS
- V8.2 Question & Scoring Architecture — PASS
- V8.3 Cognitive Instrument — PASS

## Purpose

Replace the legacy EQ Likert/self-report runtime with the V8.1/V8.2-locked **SCENARIO_SINGLE_CHOICE / situational-judgment** response model.

V8.4 does not claim a standardized or clinically validated EQ score.

## Instrument contract

- 24 scored items
- 4 dimensions
- 6 items per dimension
- Emotion Awareness
- Emotion Regulation
- Empathy / Social Awareness
- Relationship / Social Response
- scenario-based single choice
- exactly four plausible response options per item
- item-specific hidden ordinal scoring key with values 1–4
- dimension score = weighted mean of keyed ordinal responses normalized from 1–4 to 0–100
- overall score = arithmetic mean of the four dimension scores
- no clinical/diagnostic claim

## Response semantics

The customer selects one response to a situation. The UI does not expose which option receives the highest or lowest internal weight.

This is intentionally different from Cognitive:
- Cognitive: objective correct/incorrect answer key
- EQ: situational response with an explicit item-specific ordinal scoring key

The four options are not globally assigned the same score by position.

## Version boundary

V8.4 introduces:
- `EQ_CONFIG_V2`
- `EQ_SCORE_V2`
- `EQ_INTERPRETATION_V2`
- `EQ_SELECTION_V2`
- `EQ_TAXONOMY_V2`
- `EQ_RESULT_V2`

Historical EQ V1 content remains immutable.

## Question bank

The V8.4 bank contains 24 scenario items:
- 6 Emotion Awareness
- 6 Emotion Regulation
- 6 Empathy / Social Awareness
- 6 Relationship / Social Response

Each item has:
- four options
- an item-specific ordinal scoring key
- one dimension mapping
- no customer-visible scoring metadata

## Scoring

For each answered item:
1. submitted option position is validated as 1–4;
2. the position indexes the item's hidden `scoringKey`;
3. the resulting ordinal value is weighted;
4. each dimension is normalized to 0–100;
5. overall EQ Score is the mean of the four dimensions.

No `correctOption` field is used for EQ.

## Interpretation

The result describes relative patterns across the four operationalized dimensions.

It must not claim:
- clinical diagnosis;
- standardized population EQ norm;
- deterministic academic/career decisions;
- psychometric validation solely from runtime execution.

## Deployment

1. Run typecheck/build and V8.0–V8.4 gates.
2. Apply the additive V8.4 migration.
3. Run the V8.4 seed once.
4. Verify 24 published EQ V2 QuestionVersions.
5. Run real HTTP EQ runtime and verify:
   - 24 questions
   - four options per question
   - answer values restricted to 1–4
   - persistence/reload
   - submit
   - keyed ordinal scoring
   - `EQ_SCORE_V2`
   - `EQ_RESULT_V2`
   - no scoring key exposed in customer payload.
