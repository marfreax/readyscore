# V13.10 FIX9 — EQ Admin Scoring Contract Alignment

## Problem observed
EQ replacement questions were imported with the production EQ V2 scoring contract:
- `SINGLE_CHOICE_4`
- four distinct ordinal values in `scoringKey`
- no `correctOption`

Admin lifecycle validation still treated every non-DISC `SINGLE_CHOICE_4` question as objective, requiring a one-value `scoringKey` and `correctOption`. This caused every EQ item to fail with two validation issues.

## Fix
The Admin content validator now recognizes the four canonical EQ V2 dimensions and validates them as ordinal-scored EQ items:
- `scoringKey.length === 4`
- values are integers 1..4
- values are distinct
- `correctOption` must be null/absent

The operations dashboard was aligned to the same EQ V2 contract, and the Admin editor no longer exposes `Correct option` for EQ.

## Measurement integrity
No EQ scoring algorithm was changed. The validator is now aligned to the existing `EQ_SCORE_V2` scoring engine. No database migration is introduced.
