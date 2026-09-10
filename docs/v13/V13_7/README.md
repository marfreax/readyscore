# V13.7 — Scoring Validation

Status: **IMPLEMENTATION COMPLETE WITH UPSTREAM CONTENT BLOCKERS — NOT PASS / NOT FROZEN**

V13.7 verifies the actual V2 scoring contracts against the frozen V13.4 production targets and makes only the scoring/import changes required to support the production forms.

## Production targets

- RIASEC: 60 items, 10 per R/I/A/S/E/C, `RIASEC_SCORE_V2`
- DISC: 80 items, 20 per TARGET_D/I/S/C, `DISC_SCORE_V2`
- EQ: 50 items, 13/13/12/12, `EQ_SCORE_V2`
- Cognitive: 40 items, 10 per VERBAL/NUMERICAL/LOGICAL/ABSTRACT, `COGNITIVE_SCORE_V2`

20 minutes / 1,200 seconds remains a runtime timer contract, not a scoring rule.

## Implementation

1. DISC V2 accepts 24-item legacy and 80-item production forms.
2. EQ V2 accepts 24-item legacy and 50-item production forms with the V13.4 composition.
3. Cognitive V2 accepts 24-item legacy and 40-item production forms with the V13.4 composition.
4. Timeout scoring uses answered-item denominators where applicable; unanswered questions are not converted into synthetic incorrect answers.
5. The Question Bank CSV importer accepts the V2 EQ ordinal scoring contract: four-value permutation `scoringKey`, no `correctOption`.
6. Existing legacy compatibility paths are retained where they do not conflict with V2 production semantics.

## What is deliberately NOT claimed

V13.7 does not claim the production assessment is ready. V13.5 still lacks the required unique EQ and Cognitive content, and V13.6 therefore remains blocked.

A complete production scoring E2E must be run only after the approved production pools exist. No duplicate, reclassification, legacy padding, or fabricated answer key is introduced to force a PASS.

## Gate

`pnpm v13:7:gate`

Expected status with the current supplied source set: **FAIL / NOT FROZEN**.
