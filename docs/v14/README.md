# ReadyScore V14 — Active Development

This directory is the active development and testing boundary for ReadyScore V14.

## Rules

- `v14/` is active V14 development/test material until V14 is complete and frozen.
- `docs/` is historical/archive material for completed versions and must not be treated as active V14 source or test input.
- V14-specific fixtures and validation artifacts belong under `v14/` while V14 is active.
- When V14 is completed and frozen, its documentation and version-specific test artifacts may be archived under `docs/v14/`.

## Current phase

V14.4 — Commercial E2E & Launch Readiness


## V14.2
Payment Gateway Integration is implemented in this V14 workspace. Provider-specific code lives under `lib/commercial/` and Midtrans webhook integration under `app/api/commercial/webhooks/midtrans/`.

## V14.3
Fulfillment, entitlement issuance, atomic assessment access consumption, access denial, and customer delivery status are implemented under `lib/commercial/v14-3.ts` and the commercial delivery API boundary.


## V14.4 — Commercial E2E & Launch Readiness

Implementation record: `V14.4_IMPLEMENTATION_RECORD.md`

Static gate:
```bash
pnpm v14.4:gate
```

Real environment E2E:
```bash
pnpm e2e:v14.4:commercial
```
