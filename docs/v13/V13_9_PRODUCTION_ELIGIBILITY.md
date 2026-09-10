# V13.9 — Publish & Production Eligibility

## Objective
Establish a deterministic boundary between configured packages and runtime-eligible production packages.

## Rules
- A package version must pass configuration validation before publication.
- Publication now performs the V13.9 production-eligibility check.
- Eligibility requires active taxonomy, matching Test Type, published QuestionVersions, approved mappings, non-empty content, per-node availability, and an exact unique composition assignment.
- Reserve counts are documented but are not treated as runtime-eligible content unless they are independently published and approved.
- Legacy general-readiness content is never used as fallback.
- A package that cannot satisfy its configured composition is rejected from publication with `PRODUCTION_ELIGIBILITY_NOT_READY`.

## Matrix
The Admin Question Package inspector exposes a live eligibility check per package version, including available versus required QuestionVersions for every composition node.

## Runtime boundary
The existing runtime independently resolves only PUBLISHED packages whose active taxonomy and eligible question pool can satisfy the composition. V13.9 makes the publication boundary explicit as well.

## Target production configurations
- RIASEC: 60 / 1200 seconds / R,I,A,S,E,C = 10 each
- DISC: 80 / 1200 seconds / TARGET_D/I/S/C = 20 each
- EQ: 50 / 1200 seconds / 13,13,12,12
- Cognitive: 40 / 1200 seconds / 10 each

Current content shortages remain upstream blockers for EQ and Cognitive; V13.9 does not fabricate or bypass them.
