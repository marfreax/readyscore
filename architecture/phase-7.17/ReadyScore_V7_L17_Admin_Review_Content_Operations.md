# ReadyScore V7 — L17 Admin Review & Content Operations

**Status:** LOCKED PHASE REFERENCE  
**Scope:** Controlled operational lifecycle for assessment content.  
**Database migration:** REQUIRED  
**Measurement semantics:** NO MUTATION  
**Scoring semantics:** NO MUTATION  

## Objective

L17 introduces a controlled administrative workflow around assessment content without rewriting the measurement engine.

Canonical lifecycle:

```text
DRAFT
  ↓
REVIEW
  ↓
APPROVED
  ↓
PUBLISHED
  ↓
ACTIVE
  ↓
ARCHIVED
```

The existing runtime uses `QuestionStatus.PUBLISHED` as the production-eligible state. L17 therefore preserves that frozen runtime contract and records the operational `ACTIVATE` transition in the audit trail rather than introducing a new measurement-facing status.

## Required operations

- content validation
- metadata validation
- duplicate detection
- review submission
- approval
- publish protection
- activation operation
- archive protection
- version comparison
- immutable audit trail

## Safety rules

1. Historical assessment-facing question versions are never overwritten.
2. A new content correction creates a new `QuestionVersion`.
3. Mapping approval is required before content approval/publishing.
4. Incomplete metadata blocks validation/publishing.
5. Duplicate content blocks validation.
6. Published/production content cannot be archived through the L17 destructive path; replacement is required first.
7. Every material L17 operation writes an immutable `AdminContentAuditEvent`.
8. L17 must not introduce a universal score or alter measurement/scoring semantics.
9. Authentication, authorization, and entitlement remain separate concerns.
10. Actual runtime E2E evidence is required for PASS.

## Canonical surface

`/admin/review`

## API

`/api/admin/review`

GET:
- review queue
- review statistics
- audit trail
- item inspection

POST actions:
- `VALIDATE`
- `SUBMIT_REVIEW`
- `APPROVE`
- `PUBLISH`
- `ACTIVATE`
- `ARCHIVE`

## Database change

L17 adds `AdminContentAuditEvent` only. No existing measurement, result, entitlement, scoring, or assessment-attempt schema is changed.

## Gate

```text
typecheck
  +
build
  +
v7:l17:gate
  +
e2e:l17
```

A failed gate means L17 is not complete.
