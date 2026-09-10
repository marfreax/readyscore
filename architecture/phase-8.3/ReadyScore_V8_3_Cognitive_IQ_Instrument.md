# ReadyScore V8.3 — Cognitive / IQ Instrument

## Status

**V8.3 IMPLEMENTED — OBJECTIVE COGNITIVE INSTRUMENT**

Baseline:
- V8.0 Assessment Instrument Audit — PASS
- V8.1 Measurement Specification Lock — PASS
- V8.2 Question & Scoring Architecture — PASS

## Purpose

Replace the legacy Cognitive Likert response model with an objective, item-keyed reasoning instrument.

This phase intentionally does **not** claim a psychometric IQ score. The customer-facing result remains **Cognitive Reasoning Score** until a separate norming/validation program establishes support for IQ terminology.

## Instrument contract

- 24 scored items
- 4 dimensions
- 6 items per dimension
- Verbal Reasoning
- Numerical Reasoning
- Logical Reasoning
- Abstract Reasoning
- `SINGLE_CHOICE_4`
- exactly four answer choices per item
- exactly one keyed correct option
- correct = 1; incorrect = 0
- dimension score = weighted correct / weighted item total × 100
- overall score = arithmetic mean of four dimension scores
- no reverse scoring
- no universal score
- no clinical/diagnostic claim
- no IQ claim

## Version boundary

V8.3 introduces:
- `COGNITIVE_CONFIG_V2`
- `COGNITIVE_SCORE_V2`
- `COGNITIVE_INTERPRETATION_V2`
- `COGNITIVE_SELECTION_V2`
- `COGNITIVE_TAXONOMY_V2`

Historical attempts remain bound to their stored configuration/question/scoring versions.

## Data model

`QuestionVersion` now supports optional:
- `options` JSON array
- `correctOption` integer 1–4

The correct key is server-side metadata and is not returned by the customer runtime question payload.

The migration is additive and does not rewrite historical question versions. It establishes
`COGNITIVE_TAXONOMY_V2` as the active Cognitive selection boundary and retires V1 as an
active selection source; historical attempts remain bound to their stored V1 snapshot.

## Runtime

Customer Cognitive test renders the four item-specific choices. The answer API accepts 1–4 for Cognitive and continues to accept 1–5 for other instruments.

The scoring engine validates:
1. 24 questions
2. six questions per dimension
3. four options per question
4. valid hidden answer key
5. submitted option value 1–4
6. complete response set

## Question bank

The V8.3 package contains 24 production-ready objective candidates:
- 6 verbal
- 6 numerical
- 6 logical
- 6 abstract

They are provided as a versioned bank and seeded through an explicit command. The seed is intentionally separate from the migration so database content activation is deliberate.
The seed is transactional and refuses duplicate logical question identities.

## Safety

V8.3 does not:
- convert the score into IQ
- introduce norm tables
- diagnose users
- average Cognitive with EQ/DISC/RIASEC
- mutate historical attempts
- expose correct answers to customers

## Acceptance

Run typecheck/build/gates first. Then apply the additive migration and seed the Cognitive V2 bank only when the deployment owner explicitly approves activation.

V8.3 is the first instrument implementation phase; V8.4 remains blocked until Cognitive V2 content/runtime acceptance is complete.
