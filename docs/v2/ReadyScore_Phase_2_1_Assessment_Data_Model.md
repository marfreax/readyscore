# ReadyScore Phase 2.1 — Assessment Data Model & Mapping

**Status:** MANDATORY FOUNDATION  
**Version:** 1.0

## Objective

ReadyScore is an Assessment Engine, not a static quiz page.

Question volume may grow from 2,000 to tens of thousands without changing assessment logic.

## Canonical relationship

```text
DOMAIN
  ↓
SUBDOMAIN
  ↓
INDICATOR
  ↓
QUESTION
  ↓
ANSWER
  ↓
SCORED ANSWER
  ↓
DOMAIN SCORE
  ↓
OVERALL READYSCORE
```

## Required question fields

A question is assessment-ready when it has:
- stable ID
- domain
- question text
- 1–5 scale
- scoring key
- positive/reverse direction
- weight > 0

Subdomain and indicator are part of the taxonomy and SHOULD be populated before a question is promoted to fully mapped production status.

## Mapping status

- `MAPPED`: domain + subdomain + indicator are populated.
- `PARTIAL`: domain/scoring information exists but subdomain/indicator is not yet populated.

**PARTIAL questions may be imported and audited, but they must not be represented as fully mapped questions.**

## Scoring

Likert 1–5 is transformed through the question's scoring key.

Positive:

```text
1→1
2→2
3→3
4→4
5→5
```

Reverse:

```text
1→5
2→4
3→3
4→2
5→1
```

The normalized 1–5 result is converted to 0–100:

```text
((average - 1) / 4) × 100
```

Weights are applied before averaging.

Question count does NOT determine domain weight.

## Assessment configuration

Assessment configuration controls:
- number of questions
- domain quota
- scale
- future difficulty rules
- future subdomain/indicator coverage

The question bank remains independent from assessment configuration.

## Current imported inventory

Current source files contain:
- 1,825 questions
- RS-0001–RS-0025
- RS-0201–RS-2000
- 175 missing IDs in RS-0026–RS-0200

The missing range is intentionally not fabricated.

## Current mapping limitation

The current CSV inventory has domain and scoring metadata, but the large 0201–2000 files have empty Subdomain and Indikator fields. Therefore those records are currently `PARTIAL`.

This is intentional: the system preserves the data without falsely claiming taxonomy mapping that has not been verified.

## Non-negotiable

Do not hard-code questions inside React components.

Do not calculate score inside UI components.

Do not infer subdomain/indicator merely from question wording without an explicit mapping decision.

Do not make question count equivalent to domain weight.
