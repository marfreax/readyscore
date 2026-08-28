# ReadyScore V5 L10 — Cross-Test Profiling

Status: Implementation baseline

## Scope

Cross-Test Profiling synthesizes available result snapshots from Cognitive, EQ, DISC, and RIASEC. It is a synthesis layer and does not modify assessment scoring or result semantics.

## Evidence hierarchy

Primary signals:
- Interest
- Cognitive Ability
- Relevant Strength Profile

Supporting signals:
- Personality / behavioral pattern
- EQ / emotional-social evidence

Contextual signals are not inferred unless they are actually available from a supported source.

## Non-negotiable boundaries

- No universal overall score.
- No arithmetic averaging across heterogeneous assessments.
- No deterministic study, major, or career claims.
- Each assessment result remains an immutable source snapshot.
- Latest completed result per test type is used for the customer-facing synthesis.
- Profiling access requires `PROFILE_ACCESS` with `FEATURE:CROSS_TEST_PROFILE_V1`.
- No L10 database migration is required because the profile is derived from existing immutable result snapshots.

## Runtime contract

- `CROSS_TEST_PROFILE_V1`
- `CROSS_TEST_PROFILE_ENGINE_V1`
- API: `/api/profile/cross-test`
- Customer page: `/profile`
