# V7 L19F — Authentication Login Bridge Fix

## Purpose
Fix a pre-L20 authentication defect discovered during manual login validation.

## Root cause
Some existing accounts are present in PostgreSQL but absent from the legacy local auth store. `loginUser()` could authenticate such an account against PostgreSQL, but `startSession()` stores the session in the local auth store and `getSession()` resolves users from that same store. Without hydration, the newly-created session could not resolve its user, producing an apparent login loop back to `/login`.

## Fix
When PostgreSQL authentication succeeds for an account missing from the local auth store, the exact database-backed user record is hydrated into the local auth store before the session is created. No measurement, scoring, result, commercial, entitlement, reassessment, profiling, or database schema semantics are changed.

## Validation
- TypeScript/build compatibility preserved.
- Existing authentication behavior preserved for local-auth users.
- DB-only login/session bridge regression added to the V7 L13 authentication runtime test.
- DATABASE MIGRATION: NO
