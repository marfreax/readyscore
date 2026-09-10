# ReadyScore V11.6.9 — Audit Detail Architecture

## Baseline
- Exact baseline: `AppRS-v11.6.8.zip`
- Scope: Audit Detail View only.
- No database migration.

## Contract
- `GET /api/admin/audit/:eventId` is the canonical read endpoint.
- Server authorization uses `requireAdminApi()`.
- Repository reads one existing `AdminContentAuditEvent` by immutable ID.
- Missing event returns HTTP 404 with `AUDIT_EVENT_NOT_FOUND`.
- Existing `/api/admin/audit` pagination contract remains unchanged.

## UI
- `/admin/audit` remains read-only.
- Selecting an audit row opens a detail dialog.
- Detail fields: Action, Actor, Entity, Entity ID, Timestamp, From State, To State, Metadata.
- Object metadata is rendered as structured key/value data; arrays/scalars remain safely readable.
- No mutation control or indirect mutation path is introduced.

## Safety
- No audit event update/delete/create operation is added.
- No historical entity is mutated.
- No customer measurement, scoring, result, entitlement, or assessment semantics are touched.
- No migration is introduced.
