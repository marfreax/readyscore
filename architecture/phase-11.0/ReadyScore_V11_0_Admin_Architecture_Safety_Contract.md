# ReadyScore V11.0 — Admin Architecture & Safety Contract

**Status:** LOCKED FOR DEVELOPMENT
**Version:** 1.0
**Date:** 2026-09-05
**Baseline:** ReadyScore V10.11.3 / V11 Development Specification
**Scope:** Admin architecture, lifecycle governance, safety boundaries, and customer-impact contract

## 1. Objective

V11.0 establishes the canonical operational contract before feature expansion. It does not redesign measurement, scoring, result semantics, entitlement, or customer UX.

The governing rule is:

> **Admin controls future operational state; it does not rewrite historical customer reality.**

## 2. Question Group Contract

Question Group is the assessment/instrument partition of the unified Question Bank:

- DISC
- RIASEC
- IQ & Cognitive
- EQ

Question Group is not domain, subdomain, indicator, scoring dimension, taxonomy, or status.

Taxonomy remains inside the relevant group.

## 3. Canonical Object Relationship

```text
QUESTION GROUP
      ↓
QUESTION
      ↓
QUESTION VERSION
      ↓
ASSESSMENT CONFIGURATION VERSION
      ↓
SELECTION
      ↓
ATTEMPT
      ↓
RESULT
```

A Question is a stable logical identity. Question Version is the assessment-facing immutable content/version boundary.

## 4. Lifecycle Contract

The controlled lifecycle is:

```text
CREATE → VALIDATE → REVIEW → APPROVE → VERSION → PUBLISH → ACTIVATE
```

After activation, customer use occurs against the active version/configuration boundary. Historical content remains reconstructable.

Not every object must expose every state, but no operation may bypass the required safety boundary.

## 5. Historical Safety

The following are mandatory:

1. Existing historical Question Versions are never overwritten.
2. Correction of used content creates a new Question Version.
3. New configuration versions do not rewrite existing attempts.
4. Historical results are not silently recalculated.
5. Content required for historical reconstruction cannot be destructively deleted.
6. Activation of a new version affects future eligible attempts according to the configuration boundary.

## 6. Measurement Safety

Generic Admin controls must not introduce or mutate:

- scoring semantics;
- dimension interpretation;
- profile construction;
- classification logic;
- universal ReadyScore;
- raw-average synthesis;
- psychometric meaning.

A material measurement change requires an explicit instrument specification, version boundary, review, and regression evidence.

## 7. Configuration Safety

An assessment configuration may become active only when required readiness checks are satisfied. At minimum the readiness model must be able to account for:

- eligible question inventory;
- required question count;
- mapping completeness;
- required dimension/domain coverage;
- required metadata;
- selection-rule validity;
- compatible question types;
- scoring contract availability;
- result contract availability;
- historical-safety checks;
- required runtime evidence.

## 8. Review / Publishing Safety

Publishing and activation must not bypass:

- required validation;
- mapping approval;
- review/approval requirements;
- duplicate/content protections;
- version boundaries;
- historical-safety checks.

The Question Bank and Review surfaces may provide shortcuts, but the server-side lifecycle must have one canonical transition model.

## 9. Audit Contract

Every material Admin operation must be auditable with, at minimum:

- actor;
- timestamp;
- object/entity;
- object/version boundary where applicable;
- action;
- previous state where applicable;
- new state where applicable;
- relevant change metadata.

The existing `AdminContentAuditEvent` pattern remains the baseline for content/configuration auditability.

## 10. Customer Impact Contract

Every material Admin change must be classified before implementation and regression.

### New customers / future attempts

A new content or configuration version may affect future eligible attempts only after normal publication/activation rules.

### In-progress attempts

An already-created attempt must remain bound to its established content/configuration boundary.

### Historical attempts/results

Historical attempts, answers, results, and reports must remain reconstructable and semantically stable.

### Entitlement

Admin activation does not grant entitlement. Authentication, authorization, entitlement, assessment configuration, and Question Bank remain separate boundaries.

### Customer terminology

Internal implementation identifiers and engineering metadata must not leak into customer-facing experiences.

## 11. Security Contract

Every Admin mutation must:

- require server-side Admin authorization;
- validate on the server;
- protect direct API invocation;
- use transactional behavior where multiple records must change together;
- handle duplicate/concurrent operations safely;
- require explicit confirmation for high-impact actions;
- preserve auditability.

## 12. Database Contract

V11.0 is architecture/safety contract work.

**No Prisma schema mutation is required by V11.0.**

No migration may be introduced merely for UI convenience. A future migration is allowed only when the approved operational contract cannot be represented safely by the existing model.

## 13. V11.0 Gate

V11.0 PASS requires:

- architecture contract present;
- Question Group contract present;
- lifecycle contract present;
- historical safety contract present;
- measurement safety contract present;
- configuration safety contract present;
- audit contract present;
- customer-impact contract present;
- security contract present;
- no V11.0 Prisma migration;
- package gate wired;
- static contract gate PASS.

V11.0 does not claim completion of V11.1 Question Bank Operations, V11.2 Assessment Configuration Governance, V11.3 Review & Publishing Governance, V11.4 Dashboard, or V11.5 Users & Access Operations.
