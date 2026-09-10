# V15.2 Phase C Authentication Fix

Phase C originally required `READYSCORE_SESSION_COOKIE` even though the application already exposes a normal `/api/auth/login` endpoint. This made the gate fail before any integration check.

The gate now accepts either:
- `READYSCORE_SESSION_COOKIE` for an existing authenticated session; or
- `READYSCORE_E2E_EMAIL` + `READYSCORE_E2E_PASSWORD` and automatically logs in over real HTTP to obtain the `readyscore_session` cookie.

No report engine, scoring, matching, entitlement, or database schema is changed by this fix.
