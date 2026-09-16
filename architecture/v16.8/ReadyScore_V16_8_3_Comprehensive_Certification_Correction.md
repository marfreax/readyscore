# ReadyScore V16.8.3 — Comprehensive Certification Correction

## Basis
This correction is a full-package replacement based on the last passing **V16.8.2 Comprehensive E2E Certification** baseline.

## Corrections

### 1. E2E credential normalization
Runtime scripts now load `.env` / `.env.local` for missing process variables and normalize:
- `READYSCORE_AUTH_E2E_EMAIL/PASSWORD` → `READYSCORE_E2E_EMAIL/PASSWORD`
- explicit shell variables always take precedence
- `READYSCORE_SESSION_COOKIE` remains supported

Secrets are never printed.

### 2. Comprehensive runner server lifecycle
If `READYSCORE_BASE_URL` or `BASE_URL` is supplied, the suite uses that local server and does not own/terminate it.
If no base URL is supplied, the suite starts a fresh local `next start` server on a free localhost port after static gates and cleans it up afterward.

### 3. Honest certification semantics
The comprehensive runner now distinguishes:
- **PASS** — the runtime check actually executed and passed.
- **SKIPPED** — a required optional prerequisite was not configured.
- **INCOMPLETE** — one or more checks were skipped; production certification is not declared.
- **FAIL** — a configured check executed and failed.

### 4. Premium offer runtime assertion
The full-funnel runtime now checks the actual `/free/result/[attemptId]` result page and verifies premium-offer markers instead of treating the result route as a premium-offer check.

### 5. Regression compatibility
The V15.2 customer auth helper also accepts the normalized credential aliases when invoked directly.

## Non-goals
- No production deployment.
- No production database manipulation.
- No change to product architecture.
- No payment-provider redesign.
- No AI scope.
- No destructive use of `data/auth-state.json`.

## Certification rule
A final `PASS` requires all runtime prerequisites needed by the comprehensive suite to be present. If customer/admin credentials are intentionally absent, the suite reports `INCOMPLETE` rather than falsely reporting a production-ready `PASS`.
