# PHASE 2.13 — Authentication & User Account v1.0

## Objective
Introduce account identity and session foundation without changing assessment or scoring engines.

## Included
- Register
- Email/password login
- HTTP-only session cookie
- 7-day session expiry
- Logout
- Current-user endpoint
- Profile update
- Login/register/account UI
- USER role foundation
- Password hashing with Node scrypt
- Duplicate-email protection

## Explicit Non-Goals
- PostgreSQL migration
- OAuth
- Email verification
- Password reset
- Payment/subscription
- Admin RBAC UI
- Attempt ownership migration
- Assessment history persistence

## Verification
```bash
pnpm typecheck
pnpm build
```

## Production Note
The local JSON store is a phase foundation only. Before production, move auth persistence to PostgreSQL/ORM and bind attempts/results to userId.
