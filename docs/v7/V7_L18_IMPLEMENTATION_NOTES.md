# V7 L18 Implementation Notes

## Scope
Customer Page Completion.

## Included
- Production customer surfaces for `/app`, `/profile`, `/result/[attemptId]`, `/reassessment/[type]`, `/reports`, and `/reports/[attemptId]/parent`.
- Shared customer page shell.
- Customer navigation and responsive layout.
- Result ownership/access boundary.
- Profile/report entitlement boundaries.
- Reassessment authentication boundary.
- L18 static/contract gate.
- L18 actual runtime E2E.
- Existing result-experience runtime E2E preserved.

## Authentication decision
All customer-only page routes enforce authentication at the page boundary with a redirect to `/login?next=...`. They do not render a public fallback page with HTTP 200. This keeps L13 protected-route semantics consistent across the completed customer surface.

## Database
No L18 migration. Existing database schema and measurement/commercial semantics remain unchanged.

## Required validation
```bash
rm -rf .next
pnpm typecheck
pnpm build
pnpm v7:l18:gate
pnpm e2e:l18
```

A failed gate means L18 is not complete.

## FIXED12 — SSR reassessment marker
- Added a server-rendered accessibility marker `Assessment {type}` to the reassessment route.
- This preserves the client-side AssessmentRunner while making the customer-facing assessment identity observable in actual HTTP runtime E2E.
- No measurement, scoring, commercial, database, or authentication semantics changed.


## FIXED13 — Explicit SSR assessment marker
- The reassessment identity marker is rendered as a normal server-rendered heading rather than relying on an accessibility-only span.
- This makes `Assessment EQ` directly observable in the raw HTTP response used by the L18 runtime E2E.
- No measurement, scoring, commercial, database, or authentication semantics changed.

## FIXED14 — Deterministic fresh production runtime
- Root cause isolated: `pnpm build` does not restart an already-running `next dev` / `next start` process on port 3000. The L18 E2E could therefore test stale server code even after the source and `.next` build were replaced.
- `pnpm e2e:l18` now starts a fresh `next start` process on an automatically selected free localhost port when `BASE_URL` is not explicitly supplied.
- Both L18 customer-page E2E and existing result-experience E2E run against that same fresh production server.
- Existing `BASE_URL` behavior remains available for deliberate external-runtime testing.
- The reassessment route retains the server-rendered `Assessment {type}` marker; the test is not weakened to hide the underlying failure.
- No database migration, measurement, scoring, commercial, or authentication semantics changed.
