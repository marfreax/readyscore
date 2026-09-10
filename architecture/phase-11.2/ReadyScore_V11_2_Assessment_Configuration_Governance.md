# ReadyScore V11.2 — Assessment Configuration Governance

Status: IMPLEMENTED
Date: 2026-09-05

## Objective
Turn Assessment Configuration into a controlled, inspectable configuration system without rewriting historical attempts.

## Scope
- configuration version inspection
- question-group linkage
- selection constraints
- coverage validation
- readiness/health
- activation protection
- archive/replacement protection
- impact preview

## Safety Contract
1. New configuration versions are created as DRAFT.
2. Historical attempts retain their persisted configuration/version snapshot.
3. Activation is blocked when required readiness checks fail.
4. Activation is transactional.
5. Active versions cannot be archived.
6. Readiness derives from canonical published/eligible QuestionVersion data.
7. No Prisma migration is introduced in V11.2; existing `metadata` stores governance linkage/constraints.
8. V11.2 does not change scoring algorithms, result semantics, entitlements, or historical results.
