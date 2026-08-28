# ReadyScore V7 L14 — Customer Application Shell & Dashboard UX

**Status:** LOCKED PHASE REFERENCE  
**Database Migration:** NO  
**Measurement Semantics:** NO MUTATION  
**Commercial Semantics:** NO MUTATION

## Scope
L14 transforms `/app` from a capability listing into the production customer workspace while preserving frozen V4/V5/V6 runtime boundaries.

## Required UX
- Application header and customer identity
- Workspace navigation
- Assessment status cards
- Entitlement-aware access state
- Recent assessment activity
- Result navigation
- Reassessment context
- Commercial access / plans
- Cross-Test Profile availability
- Responsive layout

## Protection
1. Authentication remains separate from entitlement.
2. Authentication alone must not grant paid assessment access.
3. Dashboard must not create a universal score or average unrelated assessment scores.
4. Historical result semantics remain immutable.
5. Internal measurement version identifiers are not customer-facing dashboard concepts.
6. Commercial pricing/catalog, reassessment, and Cross-Test Profiling semantics remain unchanged.

## Data
The dashboard consumes existing authentication, entitlement, commercial catalog, reassessment, upgrade, and assessment-history services. No database migration is required.

## Gate
```text
pnpm typecheck
↓
pnpm build
↓
pnpm v7:l14:gate
↓
pnpm e2e:l14
↓
frozen regression
```
