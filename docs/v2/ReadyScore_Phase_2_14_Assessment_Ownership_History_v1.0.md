# PHASE 2.14 — Assessment Ownership & History v1.0

## Objective

Bind assessment attempts to the authenticated user and provide an account-level assessment history.

## Included

- Attempt ownership record with `userId`.
- Runtime attempt binding contract.
- Ownership-checked attempt lookup.
- User assessment history API.
- User assessment history detail API.
- Account History UI.
- Result summary in history.
- Completed / in-progress / abandoned lifecycle representation.

## Security Rule

A user can only read an attempt when:

```text
attempt.userId === currentSession.user.id
```

No public attempt lookup is introduced.

## Persistence

The current implementation uses a JSON ownership store to establish the contract while the project remains in the foundation/runtime stage.

The production target remains PostgreSQL/ORM persistence.

## Explicit Non-Goals

- Payment/subscription.
- Assessment resume migration across devices.
- Full database migration.
- Admin history UI.
- Analytics.
- AI recommendations.

## Verification Gate

```bash
pnpm typecheck
pnpm build
```

Manual checks:

1. Login.
2. Open `/account/history`.
3. Verify unauthenticated access is rejected.
4. Verify one user's history cannot expose another user's attempt.
5. Verify completed attempts show their result summary.
