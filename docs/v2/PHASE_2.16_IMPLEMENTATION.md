# PHASE 2.16 — User Dashboard & Profile Experience

## Objective

Provide a logged-in personal workspace backed by the existing authentication session and PostgreSQL assessment persistence.

## Delivered

- `/app` is now the authenticated user dashboard.
- `/account` is the profile management experience.
- `/account/history` reads assessment history from PostgreSQL and scopes it by the authenticated user ID.
- `/api/dashboard` exposes dashboard data for the current user only.
- Assessment start now associates logged-in attempts with the authenticated user ID.
- The existing file-based auth store is synchronized into PostgreSQL as a compatibility bridge.
- Profile updates synchronize the changed user into PostgreSQL.
- Anonymous `/trial` remains available.
- No payment, subscription, organization, notification, or analytics scope is introduced.

## Acceptance

1. Logged-in user reaches `/app` and sees their own dashboard.
2. Dashboard data is read from PostgreSQL.
3. Assessment attempts started while logged in receive `AssessmentAttempt.userId`.
4. History only returns attempts belonging to the current user.
5. Profile updates persist and refresh correctly.
6. Existing assessment/result routes remain untouched in behavior.
7. `pnpm typecheck` and `pnpm build` pass.
