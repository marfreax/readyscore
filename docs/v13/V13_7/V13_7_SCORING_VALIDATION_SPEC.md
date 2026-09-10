# V13.7 — Scoring Validation Specification

## Objective
Verify that the final production item counts and compositions are compatible with the actual scoring engines, including normal submit and timeout behavior, score calculation, result payload, and interpretation compatibility.

## Frozen production targets
- RIASEC: 60 / 10 each R,I,A,S,E,C / RIASEC_SCORE_V2
- DISC: 80 / 20 each TARGET_D,I,S,C / DISC_SCORE_V2
- EQ: 50 / 13,13,12,12 / EQ_SCORE_V2
- Cognitive: 40 / 10 each VERBAL, NUMERICAL, LOGICAL, ABSTRACT / COGNITIVE_SCORE_V2

## V13.7 implementation boundary
The scoring engine may be adapted to support the frozen production form sizes. Content is not fabricated to satisfy those forms. Production readiness still depends on the approved content pool.

## Acceptance
For every assessment:
Production item set → actual scoring engine → expected score structure → expected result payload → PASS.

Normal submission and timeout must both be exercised before the phase can be frozen.

## Current gate
`V13.7 FAIL / NOT FROZEN` because V13.5 source content is incomplete for EQ and Cognitive and V13.6 approval is therefore not complete.
