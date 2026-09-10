# V14 Active Tests

Place V14-specific test fixtures and test-only artifacts here while V14 is under active development.

Do not place active V14 tests under `docs/`; `docs/` is reserved for completed-version archives.


## V14.2
Run `pnpm v14.2:gate` for static validation. Run `pnpm e2e:v14.2:payment` for real HTTP + PostgreSQL validation; configure `MIDTRANS_SERVER_KEY` for sandbox provider E2E.


## V14.3
- `e2e-v14-3-fulfillment-access.mjs` — real HTTP + PostgreSQL + signed Midtrans settlement webhook; verifies PAID → FULFILLED → entitlement → access, duplicate fulfillment idempotency, atomic usage consumption, denial after consumption, and concurrent access race protection.
