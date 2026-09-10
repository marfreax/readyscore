# ReadyScore V10.7 — Access & Plans Redesign

## Scope
V10.7 refines `/access` into a customer-facing Access & Plans workspace.

Required hierarchy:
1. Current Access
2. Included Capabilities
3. Assessment Access
4. Upgrade / Get More
5. Purchase Boundary

## Implementation
- Reuses existing `getCommercialCatalog()`.
- Reuses existing `getActiveProductsForUser()` and `listUserEntitlements()`.
- Reuses existing `getUpgradeQuote()`.
- Reuses existing reassessment eligibility.
- Reuses existing Scalev checkout configuration and checkout boundary.
- Current access and capability states are read from existing entitlement state.
- Plan prices are read from the existing commercial catalog/upgrade service.
- No new checkout flow is introduced.
- No entitlement is granted by UI interaction.
- Existing `/access` route is preserved.
- Existing assessment, result, report, and overview routes remain available.

## UX hierarchy
The page now leads with the customer's actual current access, then explains included capabilities, per-assessment access, available plans/upgrades, optional single-test access, and the purchase boundary.

## Safety
NO DATABASE MIGRATION
NO MEASUREMENT MUTATION
NO SCORING MUTATION
NO QUESTION-BANK MUTATION
NO RESULT-SEMANTICS MUTATION
NO ENTITLEMENT MUTATION
NO ASSESSMENT-RUNTIME MUTATION
NO UNIVERSAL SCORE
NO RAW-AVERAGE SYNTHESIS
HISTORICAL CONTENT REMAINS IMMUTABLE

## Acceptance
This delivery is an implementation candidate. Final PASS requires actual user runtime evidence for the V10.7 contract gate, typecheck, build, and relevant runtime/regression checks.
