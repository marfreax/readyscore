# ReadyScore V11.3 — Review & Publishing Governance

Status: DEVELOPMENT IMPLEMENTATION
Parent: V11.2 Assessment Configuration Governance

## Objective
Consolidate lifecycle governance into one canonical review/publishing control surface while preserving the frozen runtime contract.

## Canonical lifecycle
CREATE → VALIDATE → REVIEW → APPROVE → PUBLISH → ACTIVATE → CUSTOMER USE → HISTORICAL PRESERVATION

## Required controls
- Server-side Admin authorization for every mutation.
- Validate before review; review before approval; approval before publish.
- Mapping approval is explicit and auditable.
- Publish requires approved mapping and valid content.
- Duplicate content blocks validation/publish where prohibited.
- Published content cannot be destructively archived; replacement must precede retirement.
- Historical QuestionVersion records remain immutable; edits create versions.
- High-impact publish/activate/archive actions require explicit confirmation.
- Material operations create AdminContentAuditEvent records.
- Impact preview exposes historical impact, future customer impact, scoring impact, review/regression requirements, validation and blockers before high-impact execution.
- Existing runtime represents active customer question content with PUBLISHED; ACTIVATE therefore records operational activation without changing measurement semantics.

## Out of scope
No scoring algorithm changes, result semantics changes, entitlement changes, historical recalculation, or customer UX redesign.

## Gate
Static contract, runtime governance smoke, typecheck, production build, and affected customer/historical regression evidence must pass.
