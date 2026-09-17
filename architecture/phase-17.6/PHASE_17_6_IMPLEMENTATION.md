# ReadyScore V17.6 — Production Hardening

## Objective
Harden the V17 WhatsApp operational layer for production without redesigning the existing V17/V16 architecture.

## Implemented
- Admin WhatsApp send rate limiting with configurable server-side limits.
- HTTP `429` + `Retry-After` response for rate-limited admin sends.
- Audit events for successful admin WhatsApp sends and conversation read actions.
- Atomic inbound message + conversation unread/last-activity persistence.
- Existing webhook external-message idempotency and monotonic provider status handling preserved.
- Existing provider error mapping preserved; no credentials are exposed.
- Existing global security headers and bounded pagination preserved.

## Environment
Optional:
- `WHATSAPP_ADMIN_SEND_RATE_LIMIT_MAX` (default `30`)
- `WHATSAPP_ADMIN_SEND_RATE_LIMIT_WINDOW_SECONDS` (default `60`)

The limiter is intentionally process-local for this phase and is bounded against unbounded key growth. A distributed limiter is outside the current V17 MVP scope.

## Gate
`pnpm v17:6:gate`

## Runtime
`pnpm e2e:v17:6:hardening`

Production remains untouched until the complete local V17 certification sequence reaches PASS.
