# ReadyScore V5 — L9 Upgrade & Conversion

Status: implementation candidate for local validation.

## Scope

L9 implements the customer-facing upgrade boundary for the locked launch catalog:

- Single Test: Rp99.000
- All Tests: Rp199.000
- All Tests + Profiling: Rp249.000

Upgrade targets are only `MEDIUM` and `ADVANCE`. No new Product Tier is introduced.

## Conversion rule

The upgrade quote is derived from the customer's currently active Product entitlement evidence:

- BASIC → MEDIUM: +Rp100.000
- BASIC → ADVANCE: +Rp150.000
- MEDIUM → ADVANCE: +Rp50.000
- ADVANCE → no further upgrade

The quote also reports owned core-test entitlements and available reassessment credits. Reassessment credits are explicitly non-transferable to an upgrade; they remain separate commercial/access artifacts.

## Payment boundary

L9 does not fake payment completion and does not grant upgrade entitlements merely because a quote was requested.

The quote endpoint is authenticated and read-only. Payment/checkout fulfillment remains on the verified commercial/Scalev flow. Existing entitlement fulfillment remains the canonical provisioning boundary.

## Measurement protection

Upgrade logic does not modify:

- assessment attempts;
- answers;
- scoring;
- result snapshots;
- interpretation;
- measurement semantics.

## Runtime endpoint

`GET /api/commercial/upgrade-quote`

Optional query:

`?target=MEDIUM`

or:

`?target=ADVANCE`

## Validation

Expected local commands:

```text
rm -rf .next
pnpm typecheck
pnpm build
pnpm v5:l9:gate
pnpm e2e:upgrade
```

Then regression:

```text
pnpm e2e:reassessment
pnpm e2e:cognitive
pnpm e2e:eq
pnpm e2e:disc
pnpm e2e:riasec
pnpm e2e:result
```
