# ReadyScore v3 — Phase 3.12
## B2C Conversion & Add-on Products

**Status:** IMPLEMENTED — GATE PENDING  
**Architecture Version:** `V3_B2C_CONVERSION_3.12`  
**Add-on Catalog Version:** `V3_B2C_ADD_ON_CATALOG_1`  
**Pricing Status:** `PLANNING_HYPOTHESIS`

## 1. Scope

Phase 3.12 adds a narrow B2C commercial extension layer on top of the frozen Phase 3.1 Product / Tier / Entitlement architecture.

It does **not** redefine:

- Test Type
- Assessment Configuration
- Question Bank
- Selection
- Scoring
- Result semantics
- Cross-Test Profile
- Study Direction
- Major Fit
- Career Exploration
- Reports

The Phase 3.1 product/tier matrix remains authoritative.

## 2. Conversion Boundary

Canonical flow:

```text
USER
  ↓
PRODUCT / ADD-ON OFFER
  ↓
EXPLICIT ENTITLEMENT
  ↓
ACCESS POLICY
  ↓
RESOURCE
```

The conversion layer may present an offer and its planning price, but it does not create measurement semantics.

## 3. Add-on Model

Add-ons are intentionally narrow capability extensions.

Implemented catalog:

| Add-on | Access |
|---|---|
| `RIASEC_V1` | RIASEC test + result |
| `CROSS_TEST_PROFILE_V1` | Cross-Test Profile |
| `STUDY_DIRECTION_V1` | Study Direction |
| `MAJOR_FIT_V1` | Major Fit |
| `CAREER_EXPLORATION_V1` | Career Exploration |
| `ADVANCED_REPORT_V1` | Advanced Report |

Each add-on maps to explicit entitlement references.

## 4. Pricing

Prices are planning hypotheses only.

They are not payment commitments.

This phase does not implement:

```text
Checkout
Payment Gateway
Subscription
Billing
Invoice
Purchase Webhook
Refund
Renewal
Cancellation
Automatic payment-to-entitlement grant
```

A manual fulfillment primitive exists for controlled testing/operations, but it is not a purchase workflow.

## 5. Database Boundary

Additive models:

```text
AddOnProduct
    ↓
AddOnProductEntitlement
    ↓
UserAddOnEntitlement
```

Existing Phase 3.1 models remain intact:

```text
Product
ProductEntitlement
UserEntitlement
```

The two commercial paths converge only at the entitlement policy layer.

## 6. Canonical Access Rule

Access must continue to use explicit entitlement references.

```text
hasEntitlement(...)
hasAnyEntitlement(...)
```

No code may use:

```text
if user.tier === ...
```

Add-on access is therefore an extension of the canonical access boundary, not a second access-control system.

## 7. API

```text
GET /api/commercial/add-ons
```

Returns:

```text
conversionVersion
catalogVersion
pricingStatus
purchase.implemented
addOns
```

`purchase.implemented` is explicitly `false` in Phase 3.12.

## 8. UX

The dashboard exposes:

- add-on name
- capability description
- planning price
- current entitlement state
- clear disclosure that purchase flow is not yet enabled

The UX must not imply that payment has occurred.

## 9. Non-Goals

Phase 3.12 does not implement:

- payment processing
- checkout
- subscriptions
- billing
- payment webhooks
- automatic entitlement fulfillment
- refunds
- renewals
- cancellation
- deterministic measurement outcomes

## 10. Gate

Run:

```bash
pnpm typecheck
pnpm build
pnpm commercial:gate
pnpm commercial:conversion:gate
pnpm e2e:riasec
```

The frozen RIASEC E2E remains minimum regression protection.

## 11. Reconciliation Rule

If Phase 3.12 conflicts with the Master Source of Truth:

```text
STOP
↓
IDENTIFY CONFLICT
↓
CLASSIFY
↓
DOCUMENT DECISION
↓
UPDATE SOURCE OF TRUTH IF ARCHITECTURE CHANGES
↓
IMPLEMENT
↓
REGRESSION
```

No Phase 3.1 entitlement matrix entry is silently changed by this phase.

# END
