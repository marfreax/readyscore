# ReadyScore V7 L13 — Authentication Checkpoint

**Status:** IMPLEMENTATION PACKAGE
**Scope:** Register → Login → Session → Protected `/app` → Logout
**Database migration:** NO
**Measurement semantics:** NO MUTATION
**Commercial semantics:** NO MUTATION
**Replacement identifier:** FIXED5

## Included

- `/register`
- `/login`
- `/logout`
- `/api/auth/register`
- `/api/auth/login`
- `/api/auth/logout`
- `/api/auth/session`
- authentication service with PostgreSQL identity synchronization
- protected `/app` redirect for unauthenticated users
- public home Login/Register entry points
- L13 contract gate
- L13 actual-runtime E2E script

## Validation contract

Run from the project root:

```text
rm -rf .next
pnpm typecheck
pnpm build
pnpm v7:l13:gate
pnpm e2e:auth
```

`pnpm e2e:auth` expects the Next application to be running at `http://localhost:3000`, unless `BASE_URL` is supplied.

## Completion rule

L13 is not considered PASS from build/typecheck alone. The contract gate and actual runtime E2E must also pass.
