# V7 L20 — Full Product Regression QA

Status: IMPLEMENTED — AWAITING ACTUAL ENVIRONMENT EVIDENCE
Identifier: FIXED5
Database migration: NO

## Objective

L20 is a regression and release-confidence phase, not a feature-development phase. It verifies the full ReadyScore product after L19A-L19F.

## Coverage

- Public and trial surfaces
- Authentication and protected-route guards
- Customer shell and dedicated navigation destinations
- Access & Plans and commercial entry boundary
- RIASEC, DISC, EQ, Cognitive assessment entry surfaces
- Result, Report, Parent Report boundary, Profile, Reassessment
- QA-01 through QA-04 fixture matrix
- Cross-account ownership/isolation
- Admin authentication, authorization, operations, and historical safety
- Institution access boundary
- V5/V6 protected regression suites
- L19A-L19F regression suites
- Responsive/accessibility checks already established by L19F
- Frozen measurement/scoring/result semantics

## Non-goals

L20 introduces no new measurement, scoring, result, commercial, entitlement, reassessment, profiling, or schema semantics.

## Required validation chain

```text
Typecheck
  +
Build
  +
L20 Contract Gate
  +
L20 Actual Runtime E2E
  +
Frozen Regression
  +
Access-Control Regression
```

## PASS rule

L20 is PASS only after actual runtime evidence from the target PostgreSQL environment confirms all required journeys and boundaries. A build or static gate alone is not sufficient.


## Source Reconciliation — Report Detail Route

The initial L20 package incorrectly treated `app/reports/[attemptId]/page.tsx` as a required canonical source and attempted to regress `/reports/[attemptId]`. This was removed from L20 because the implemented V7 L18/L19A canonical customer surface is `/reports` plus `/reports/[attemptId]/parent`; L18 explicitly completed those routes, and L19A's implementation baseline likewise does not require a customer `/reports/[attemptId]` detail page. L20 is a regression/release-confidence phase, not a feature-development phase, so it must not introduce that missing route during regression.

The canonical result-detail surface remains `/result/[attemptId]`. Parent reporting remains `/reports/[attemptId]/parent`.

Decision: L20 validates the implemented canonical surfaces and does not add `/reports/[attemptId]`. If a standalone report-detail route is desired later, it must be handled as an explicit product-scope decision outside L20.


## Source Reconciliation — Institution Entry Surface

The first L20 runtime assertion incorrectly treated `/institution` as a redirect-only protected route. The implemented Phase 3.13 contract intentionally renders an unauthenticated institution entry surface with a login-required message, while `/institution/[institutionId]` and institution APIs enforce authorized membership context. L20 therefore validates the actual contract: unauthenticated `/institution` returns HTTP 200 with the explicit login-required boundary, and authenticated access is validated separately.

Decision: do not alter the institution page or authentication semantics during L20 regression. The fix is limited to the regression assertion.

## Source Reconciliation — Access & Plans Customer Label

The L20 runtime assertion initially expected the English navigation marker `Access & Plans` on `/access`. The implemented customer-facing page uses the approved Indonesian product label `Akses & paket` in its page title. This is a regression assertion alignment only; the `/access` implementation and commercial semantics are unchanged.

Decision: L20 validates `/access` using the implemented customer-facing marker `Akses & paket` and does not change the customer UI solely to satisfy the regression suite.


## L20 FIX2 — Access Surface Assertion Reconciliation

The L20 runtime regression must not assert a localized/customer-facing heading literal for `/access`. The frozen implementation exposes stable semantic content including `Current access`, `Capabilities`, and the Scalev purchase/fulfillment statement. FIX2 updates only the regression assertion to these stable contract markers; `/access` product implementation and commercial semantics are unchanged. No database migration.
\n\n## L20 FIX4 — Runtime Base URL / Scalev Handoff Reconciliation\n\nThe L20 harness now propagates the single runtime base URL to both the Next.js process and child regression processes via `BASE_URL` and `READYSCORE_PUBLIC_URL`. This prevents Scalev handoff URLs from falling back to `http://localhost:3000` while the L20 server is running on an isolated port, which previously caused ECONNREFUSED during the paid-customer regression. No production commercial, entitlement, payment, or handoff semantics were changed.\n