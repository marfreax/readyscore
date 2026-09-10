# ReadyScore V12.2 — Reset Password Flow
## Architecture Contract

**Status:** IMPLEMENTATION ARTIFACT — V12.2
**Baseline:** V12.1 Password Recovery Foundation — PASS

V12.2 consumes the V12.1 PasswordResetToken foundation and adds the credential mutation flow.

## Scope
- `POST /api/auth/reset-password`
- `/reset-password`
- token lookup by SHA-256 representation
- expiry and single-use enforcement
- new-password validation
- atomic PostgreSQL token consumption + password mutation
- invalidation of remaining pending reset tokens
- synchronization with the existing local authentication store
- no automatic login after reset

## Safety Boundary
Password reset changes only the user's password credential. It does not change UserStatus, role, entitlement, assessment attempts, results, configuration, scoring, or historical assessment state.

## Token Contract
A token must exist, be unused, and not be expired. The compare-and-consume update is performed inside the same database transaction as the password mutation. Reuse is rejected.

## Session Contract
V12.2 does not call `startSession()`. Successful reset returns the user to the login flow rather than silently authenticating the account.

## Data Model
No new Prisma model or migration is introduced in V12.2. The `PasswordResetToken` model created in V12.1 is reused.
