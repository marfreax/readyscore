# V7 L19F Authentication Login Fix

## Scope
Fix login for PostgreSQL-backed users whose identity is not yet present in the local auth-state store.

## Root Cause
`loginUser()` validated a DB-only account successfully but returned a public user without hydrating the exact verified identity into `data/auth-state.json`. `startSession()` then creates a session in the local store, whose `getSession()` could not resolve that user.

## Fix
- Added `upsertUserRecord()` to the auth store.
- On successful PostgreSQL fallback authentication, hydrate the exact DB user record into the auth store before the login route starts the session.
- Preserve DB user id, email, role, password hash, and timestamps.
- No authentication policy change.
- No entitlement, commercial, assessment, measurement, scoring, result, reassessment, or profiling semantic change.
- No database migration.

## Regression
Added `pnpm e2e:auth-db-login` to validate DB-backed authentication and auth-store hydration for a supplied test account.
