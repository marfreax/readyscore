# ReadyScore V10.7 — Access & Plans Redesign

## Core definition
> Access & Plans = tempat user memahami apa yang dimiliki dan bagaimana mendapatkan akses tambahan.

## UX contract
The customer should understand, in this order:
1. Current Access — what is active now.
2. Included Capabilities — which assessments/results/profile capabilities are available.
3. Assessment Access — per-assessment state and action.
4. Upgrade / Get More — existing commercial plans and upgrade options.
5. Purchase Boundary — checkout remains Scalev; UI does not grant entitlement.

## Existing logic boundaries
The page consumes existing commercial and entitlement services. It must not implement entitlement rules, pricing rules, checkout fulfillment, payment verification, or access grants.

### Existing sources of truth
- `getCommercialCatalog()`
- `getActiveProductsForUser()`
- `listUserEntitlements()`
- `getUpgradeQuote()`
- `getReassessmentEligibility()`
- `getScalevCheckoutConfiguration()`

## Presentation rules
- Current plan is visually distinct.
- Available capabilities are explicit.
- Locked assessment access is honest and never represented as unlocked.
- Upgrade CTA is customer-centric (`Get access`, `Upgrade`) while preserving the existing Scalev route.
- Existing catalog prices are displayed as provided; no new pricing calculation is introduced.
- Single Test remains a selected assessment purchase, not a new commercial tier.
- Add-ons remain optional extensions and do not change the main tier.

## Out of scope
- database/schema migration
- entitlement engine changes
- commercial package definitions
- pricing/business-rule changes
- Scalev checkout contract changes
- payment/fulfillment changes
- assessment runtime changes
- scoring/measurement/result semantics
- new persistence or analytics

## Accessibility
- semantic sections and headings
- meaningful button/link labels
- status conveyed with text, not color alone
- responsive grid layouts using existing design system
- existing customer shell/mobile navigation preserved

## Definition of Done
- V10.7 contract gate passes
- typecheck passes
- production build passes
- `/access` renders the required hierarchy
- checkout remains external to entitlement fulfillment
- existing routes remain intact
- no prohibited mutation occurs
- actual runtime evidence is captured
