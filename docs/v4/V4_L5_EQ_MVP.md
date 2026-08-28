# ReadyScore V4 L5 — EQ MVP

## Status
Implementation scope for V4 L5.

## Instrument boundary
The V4 operating rules define four conceptual EQ dimensions:

1. Emotion Awareness
2. Emotion Regulation
3. Empathy / Social Awareness
4. Relationship / Social Response

The implementation operationalizes these as a 24-item MVP question bank, six items per dimension. This item count and scoring implementation are an engineering MVP decision; successful runtime execution is **not** psychometric validation.

## Runtime contract

- TestType: `EQ`
- Runtime key: `EQ`
- Configuration: `EQ_CONFIG_V1`
- Taxonomy: `EQ_TAXONOMY_V1`
- Question bank: 24 published items
- Selection: 6 items per dimension
- Response scale: Likert 1–5
- Scoring: `EQ_SCORE_V1`
- Result contract: `EQ_RESULT_V1`
- Interpretation: `EQ_INTERPRETATION_V1`
- Claim boundary: emotional/behavioral profile only

## Dimensions

| Code | Customer-facing label |
|---|---|
| `EMOTION_AWARENESS` | Emotion Awareness |
| `EMOTION_REGULATION` | Emotion Regulation |
| `EMPATHY_SOCIAL_AWARENESS` | Empathy / Social Awareness |
| `RELATIONSHIP_SOCIAL_RESPONSE` | Relationship / Social Response |

## Regression protection

L5 must preserve:

- RIASEC 60-question runtime and F.10-C.2-F baseline
- DISC 24-question runtime and L4 result contract
- commercial Product/Tier != Test Type boundary
- immutable attempt/result snapshot behavior
- existing `docs/` contents

## Validation commands

Run against the local environment:

```text
pnpm db:migrate:deploy
pnpm typecheck
pnpm build
pnpm v4:l5:gate
pnpm e2e:eq
pnpm commercial:gate
pnpm e2e:disc
pnpm e2e:riasec
```

`pnpm e2e:*` commands require the application server to be running.

## Documentation placement

This document is intentionally under `V4/`. The implementation does not create or replace a `docs/` directory.
