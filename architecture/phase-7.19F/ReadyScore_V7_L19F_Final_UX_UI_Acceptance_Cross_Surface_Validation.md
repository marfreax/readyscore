# ReadyScore V7 L19F — Final UX/UI Acceptance & Cross-Surface Validation

**Phase:** V7 L19F
**Status:** Implementation package
**Database Migration:** NO

## Objective

Perform the final product-facing acceptance pass after L19A–L19E and before L20 Full Product Regression QA.

## Acceptance Scope

Cross-surface validation covers:

- Public landing and authentication
- Customer application shell
- Access & Plans
- Profile
- Reports
- Result
- Reassessment
- Pre-Test / assessment entry surfaces for RIASEC, DISC, EQ, and Cognitive
- Admin operational surfaces
- Authentication and ownership boundaries
- Accessibility baseline
- Responsive/mobile navigation source contract
- Customer-facing language baseline

## Protected Boundaries

L19F is validation/acceptance work only. It does not reopen or modify:

- measurement semantics
- scoring semantics
- result semantics
- commercial semantics
- entitlement semantics
- reassessment semantics
- profiling semantics
- historical assessment version semantics

## Validation Model

1. Static/contract gate
2. Typecheck
3. Production build
4. Actual runtime E2E against real HTTP + PostgreSQL
5. Frozen/access-control regression evidence

L19F does not add a Prisma migration.

## Runtime Scenario

The runtime script provisions the deterministic L19E QA fixtures through the existing fixture provisioner, then validates:

- public/authentication reachability
- unauthenticated customer guard
- customer shell continuity
- customer access/result/reassessment surfaces
- four assessment entry surfaces
- accessibility markers exposed by the real rendered HTML
- admin operational surfaces
- admin unauthenticated guard
- cross-account result isolation

## Visual Acceptance Note

HTTP runtime validation verifies rendered accessibility markers and responsive navigation contracts. It is not a substitute for human visual inspection of typography, spacing, card density, button hierarchy, empty/loading/error states, and actual desktop/tablet/mobile rendering. Those remain explicit L19F acceptance items and should be inspected before L20.

## Definition

L19F is complete only after implementation, typecheck, build, contract gate, actual runtime E2E, and required acceptance evidence pass.

## L19F Checkpoint

Implementation: PASS when package scope is present and no protected semantics are changed.
Typecheck: required external runtime validation.
Build: required external runtime validation.
Contract Gate: `pnpm v7:l19f:gate`.
Database Migration: **NO**.
Actual Runtime E2E: `pnpm e2e:l19f`.
Frozen Regression: L19F validates access/ownership boundaries and does not modify frozen engines.
Measurement Semantics: **NO MUTATION**.
Commercial Semantics: **NO MUTATION**.
