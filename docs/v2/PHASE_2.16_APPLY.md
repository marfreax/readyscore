# PHASE 2.16 — Apply

This package is a full-project replacement based on the repaired Phase 2.15.3 source.

## Replace

Replace the project contents with this package. Do not edit individual files manually.

## Database

Do **not** run `prisma migrate reset`.

Phase 2.15.3 migration is already applied. Phase 2.16 does not add a Prisma migration.

## Verification

Run:

```bash
rm -rf .next
pnpm db:generate
pnpm typecheck
pnpm build
```

Then run:

```bash
pnpm dev
```

Open:

- `http://localhost:3000/login`
- `http://localhost:3000/app`
- `http://localhost:3000/account`
- `http://localhost:3000/account/history`
- `http://localhost:3000/assessment/premium`

## Runtime acceptance

1. Register a new user.
2. User is redirected to `/app`.
3. Dashboard loads the authenticated user.
4. Open Profile, change the name, save, refresh.
5. Start an assessment while logged in.
6. Confirm the attempt is associated with the logged-in user in PostgreSQL.
7. Open Assessment History and confirm only that user's attempts appear.
8. Complete an assessment and open the result.
9. Log out; `/app` must redirect to login.
