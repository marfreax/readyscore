# PHASE 3.0-D.1-F.7 — RIASEC Result Contract

## Purpose

Establish a test-specific, versioned RIASEC result contract before wiring
RIASEC into the legacy persistence/API layer.

## Architecture

```text
RIASEC_SCORE_V1
      |
      v
RiasecResult
      |
      v
RiasecPersistableResult
      |
      +-- provenance
      +-- measurement
```

## Why this exists

The current v2 `AssessmentResult` is a generic legacy contract. F.6 proved
that it does not expose RIASEC-specific analytical fields.

Therefore F.7 does NOT guess or mutate that contract.

Instead it establishes:

```text
RIASEC_RESULT_V1
```

with explicit provenance and measurement payload.

## No database changes

This phase does not modify Prisma, repositories, runtime-service, or API
routes.

Those integrations must be performed only after the v3 result persistence
strategy is explicitly defined.

## Next

PHASE 3.0-D.1-F.8 — RIASEC Result Persistence Boundary

That phase should inspect the actual Prisma result schema and existing
repository methods, then add the minimum persistence changes required for
`RIASEC_RESULT_V1`.
