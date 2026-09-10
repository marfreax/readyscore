# ReadyScore V11.6.1 — Audit Repository Contract

**Status:** DEVELOPMENT IMPLEMENTATION
**Baseline:** V11.5 FROZEN
**Parent phase:** V11.6 — Admin Data Workspace Foundation + Audit Trail + Pagination
**Scope:** Audit repository boundary only
**Database migration:** NONE

## Objective

Establish one canonical repository boundary for the existing `AdminContentAuditEvent` audit store without changing audit semantics or customer behavior.

## Existing source of truth

V11.5 already provides `AdminContentAuditEvent` and material admin operations already write audit events. V11.6.1 does not create a second audit store.

## Canonical entity types

The repository contract recognizes the current/planned operational audit entity types:

- `QUESTION_VERSION`
- `ASSESSMENT_CONFIGURATION_VERSION`
- `USER`

The underlying database field remains a string because audit actions/entities are intentionally extensible.

## Contract

`lib/admin-audit-repository.ts` defines:

- `AdminAuditEntityType`
- `AdminAuditListInput`
- `AdminAuditEventRecord`
- `AdminAuditRepository`
- `listAdminAuditEvents()`
- `adminAuditRepository`

The normalized record exposes:

- id
- entityType
- entityId
- action
- fromStatus
- toStatus
- actorUserId
- metadata
- createdAt

## Read behavior

V11.6.1 preserves the V11.5-compatible bounded read behavior of at most 200 events.

Ordering is deterministic:

```text
createdAt DESC, id DESC
```

Optional repository filters are contract-level inputs for the existing entity/action/actor/entity identity dimensions. Full workspace search/filter UX belongs to V11.7.

## Compatibility rule

The existing Review repository remains behavior-compatible through `getAuditTrail()`, which delegates to the canonical audit repository.

No API route or customer route is redesigned in V11.6.1.

## Explicit non-goals

- pagination implementation;
- `/admin/audit` UI;
- audit mutation/delete/edit;
- search UI;
- filter UI;
- bulk operations;
- customer UX;
- measurement/scoring/result changes;
- entitlement changes;
- historical recalculation;
- database migration.

## Acceptance

- canonical audit repository module exists;
- repository contract is typed;
- existing audit store remains the sole source of truth;
- existing Review audit access delegates through the canonical repository;
- deterministic ordering is enforced;
- current V11.5 bounded behavior is preserved;
- no Prisma migration is introduced;
- no customer semantics are changed;
- validator passes;
- typecheck passes;
- production build passes.
