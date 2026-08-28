# ReadyScore V4 L4 DISC MVP — Reconciliation

Status: implementation baseline for V4 L4.

## Scope

DISC customer-facing MVP only: question bank, assessment runtime, persistence, scoring, result contract, interpretation, and result UX.

## Frozen boundary

RIASEC F.10-C.2-F remains the regression baseline. L4 does not modify the RIASEC scoring engine or measurement contract.

## DISC contracts

- TestType: `DISC`
- Taxonomy: `DISC_TAXONOMY_V1`
- Configuration: `DISC_CONFIG_V1`
- Question bank: `DISC_MVP_V1` (24 questions, 6 per D/I/S/C)
- Scoring: `DISC_SCORE_V1`
- Result: `DISC_RESULT_V1`
- Interpretation: `DISC_INTERPRETATION_V1`

## Claim boundary

DISC is presented as a behavioral/personality profile. The MVP does not claim psychometric validation, aptitude/intelligence measurement, or deterministic education/career decisions.

## Database

Migration `20260827110000_v4_l4_disc_mvp` seeds deterministic Question and QuestionVersion identities with explicit timestamps, matching the existing NOT NULL database contract.

## Runtime hardening

The assessment start API explicitly targets the Node.js runtime and dynamic execution because it is Prisma-backed. The DISC HTTP E2E uses a loopback IPv4 default and retries transient start-route failures before reporting a real failure.

No `docs/` directory is created or replaced by this implementation.
