# ReadyScore V4 — L6 Cognitive MVP

## Scope

Customer-facing Cognitive MVP using the existing assessment runtime and immutable attempt/result model.

Canonical customer-facing terminology:

- Cognitive Ability Profile
- Cognitive Reasoning Assessment

The MVP does **not** claim a formal IQ score, standardized intelligence measurement, diagnosis, or psychometric validation.

## Operational contract

- 24 questions
- 4 reasoning dimensions
- 6 questions per dimension
- Likert 1–5 response scale
- `COGNITIVE_SCORE_V1`
- `COGNITIVE_SELECTION_V1`
- `COGNITIVE_CONFIG_V1`
- `COGNITIVE_TAXONOMY_V1`
- `COGNITIVE_RESULT_V1`
- `COGNITIVE_INTERPRETATION_V1`

Dimensions:

1. Verbal Reasoning
2. Numerical Reasoning
3. Logical Reasoning
4. Abstract Reasoning

The four dimensions are an operational MVP construct for the launch product. Runtime success is not psychometric validation.

## Regression boundary

L6 must preserve:

- RIASEC 60-question runtime and result contract
- DISC 24-question runtime and result contract
- EQ 24-question runtime and result contract
- existing commercial architecture

## Validation

Relevant commands are exposed by `package.json`:

```text
pnpm typecheck
pnpm build
pnpm v4:l6:gate
pnpm e2e:cognitive
pnpm e2e:disc
pnpm e2e:eq
pnpm e2e:riasec
pnpm commercial:gate
```

Run database migration deployment before runtime validation when the migration is pending.

## Measurement governance

The 0–100 value is a presentation scale derived from the operational response scale. It must not be represented as IQ, percentile, standardized intelligence, or a universal ability percentage.
