# ReadyScore V12.4 — Security, Abuse Protection & Audit

## Baseline
Built directly from the V12.3 Change Password & Credential Operations PASS artifact.

## Scope
- Account-enumeration-safe forgot-password response remains generic.
- Configurable in-process recovery rate limiting by normalized identifier and request origin/IP fingerprint.
- Existing token abuse rejection remains enforced server-side.
- Persistent authentication security audit events without passwords, reset tokens, reset URLs, or credential secrets.
- Password reset/change audit semantics.
- Session behavior remains consistent with the existing authentication architecture; no implicit login is created by reset.
- UserStatus, role, entitlement, and assessment state remain outside credential mutation.

## Rate-limit configuration
- `PASSWORD_RESET_RATE_LIMIT_MAX` default `5`.
- `PASSWORD_RESET_RATE_LIMIT_WINDOW_SECONDS` default `900`.
- Values are bounded and configuration-driven.

The current deployment architecture uses process-local rate limiting. A future multi-instance deployment should replace this implementation with shared infrastructure without changing the endpoint contract.

## Audit
`AuthenticationAuditEvent` is a dedicated security audit store because the existing admin content audit requires an actor identity and is not appropriate for anonymous recovery requests. Actor/target references are nullable and secrets are never persisted.

## Migration
V12.4 adds one migration for the persistent security audit event store. No assessment, scoring, entitlement, or historical data model is changed.
