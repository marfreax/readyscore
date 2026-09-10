# ReadyScore V11.1 Delivery Notes

## PASS / Scope

V11.1 implements Question Bank Operations on top of the V11.0 safety contract.

Question Group is explicitly:

- DISC
- RIASEC
- IQ & Cognitive
- EQ

Question Group is not taxonomy/domain/subdomain/indicator.

## Implemented

- Question Group navigation in Admin Question Bank.
- Group-scoped search/filtering.
- Group-specific CSV templates.
- CSV preview before import.
- Import as DRAFT only.
- Group/type/response-model validation.
- Assessment-specific create/edit metadata.
- Version-safe edit flow.
- Objective 4-choice and RIASEC 5-point transport compatibility.
- Group statistics.
- Admin authorization on import/template APIs.
- Server-side validation and transactional import.
- Import audit event when an Admin actor is available.
- Customer runtime eligibility compatibility for the existing 4-choice DISC/EQ/Cognitive contracts.
- Type-safe Question Bank transport for readonly Prisma-derived scale/scoring arrays.
- Assessment-neutral mapping preservation for CSV/create/edit flows; V11.1 does not force non-RIASEC groups through the generic taxonomy registry.

## Explicitly Not Implemented

- No direct publish during import.
- No measurement redesign.
- No scoring redesign.
- No result semantics redesign.
- No entitlement mutation.
- No customer UX redesign.
- No historical result recalculation.
- No Prisma migration.

## Safety

An import failure cannot publish or replace active content. Imported content enters DRAFT and must follow the existing review/approval/publishing lifecycle.

Historical Question Versions remain immutable; edit creates a new version.

## Validation

Run from the project root using the repository's package manager (`pnpm`):

```bash
pnpm v11:1:gate
pnpm e2e:v11:1:question-bank
pnpm typecheck
pnpm build
```

The V11.1 static gate and runtime smoke are expected to remain PASS after this correction. Typecheck/build must be run in the developer environment with dependencies installed; this delivery does not include `node_modules`.
