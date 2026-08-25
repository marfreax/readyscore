# ReadyScore v3 — RIASEC_QB_V1 Production Question Bank Package

## Status

**CONTENT DRAFT / PILOT CANDIDATE — NOT PSYCHOMETRICALLY VALIDATED**

This package resolves the immediate source gap: the PostgreSQL Question Bank currently contains **0 RIASEC items**.

It supplies:

- 60 target items
- 24 reserve items
- 84 total candidates
- 10 target + 4 reserve per RIASEC dimension
- R/I/A/S/E/C dimension metadata
- blueprint indicator metadata
- import-compatible CSV
- RIASEC taxonomy
- validation requirements

## Instrument boundary

This bank measures **interest / preference**, not ability, intelligence, personality, competence, or certainty about a major.

The six dimensions are:

```text
R — Realistic
I — Investigative
A — Artistic
S — Social
E — Enterprising
C — Conventional
```

## Composition

| Dimension | Target | Reserve | Total |
|---|---:|---:|---:|
| R | 10 | 4 | 14 |
| I | 10 | 4 | 14 |
| A | 10 | 4 | 14 |
| S | 10 | 4 | 14 |
| E | 10 | 4 | 14 |
| C | 10 | 4 | 14 |
| **Total** | **60** | **24** | **84** |

## Item-writing rules used

- one primary RIASEC dimension per item
- preference/attraction wording
- no ability claims
- no job-title requirement
- no prestige/family-expectation wording
- no diagnostic language
- no multi-dimension scoring
- Likert 1–5
- equal weight = 1
- no reverse-keyed items in this candidate bank

The absence of reverse-keyed items is intentional. For an interest instrument, clear positive preference wording is preferable to introducing negative wording merely to force reverse scoring. Future pilot data may justify a different design.

## Indicator coverage

Each dimension uses the four indicators defined in `3.0-D.1-B`:

R:
- hands_on
- tools_equipment
- practical_problem_solving
- physical_environment

I:
- curiosity
- analysis
- investigation
- problem_solving

A:
- creativity
- expression
- originality
- aesthetics

S:
- helping
- teaching
- communication
- development

E:
- influence
- leadership
- initiative
- persuasion

C:
- organization
- structure
- information_order
- accuracy

## Important governance rule

The CSV is **not automatically production-approved**.

The import lifecycle remains:

```text
CSV
 ↓
DRAFT
 ↓
MAPPING REVIEW
 ↓
CONTENT REVIEW
 ↓
APPROVE
 ↓
PUBLISH
 ↓
RIASEC runtime
```

The actual importer currently forces imported questions to `DRAFT`. That behavior is correct and should remain.

## Why this package exists

The runtime already expects:

```text
10 R
10 I
10 A
10 S
10 E
10 C
```

but the database audit returned:

```text
R = 0
I = 0
A = 0
S = 0
E = 0
C = 0
```

Therefore runtime debugging cannot proceed until the bank exists.

## Psychometric gate

Before calling `RIASEC_QB_V1` a validated production instrument, run at minimum:

- expert content review
- cognitive review with target users
- pilot administration
- item response distribution review
- item-total / dimension consistency analysis
- redundancy review
- response-time review
- dimension discrimination review
- reliability analysis
- construct/factor review where sample size permits

This package provides the **content candidate**, not those empirical validations.
