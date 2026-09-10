# ReadyScore V11.5 — Users & Access Operations

Status: DEVELOPMENT IMPLEMENTATION BASELINE

## Objective

Move Users & Access from a passive directory toward safe, explicit administration without deleting or rewriting historical customer data.

## Operational contract

- User status is persistent and non-destructive: `ACTIVE` / `INACTIVE`.
- INACTIVE blocks authentication/session access; it does not delete attempts, answers, results, purchases, entitlements, or institution relationships.
- Role changes are limited to `USER` / `ADMIN` and affect authorization only.
- Every mutation requires an authenticated active Admin, server-side validation, explicit confirmation, and an audit event.
- Self-deactivation is blocked.
- The last active Admin is protected from deactivation/demotion.
- No entitlement, purchase, assessment, result, or historical record is mutated by user access operations.
- User access operations use the existing `AdminContentAuditEvent` as the audit store with `entityType=USER`.

## Customer boundary

Authentication, authorization, entitlement, assessment configuration, and Question Bank remain separate concerns. INACTIVE is an access boundary, not a destructive data operation.

## Migration

V11.5 introduces one additive migration because persistent user status cannot be represented safely by the existing User model. Existing rows default to `ACTIVE`. No historical records are rewritten.

## Regression targets

- Admin authorization on every mutation.
- Confirmation cannot be bypassed through the API.
- Non-admin direct API calls are rejected.
- Status/role changes are audited.
- Last active Admin remains protected.
- Self-deactivation remains protected.
- Historical attempts/results/entitlements remain untouched.
- Login/session access respects INACTIVE status.
