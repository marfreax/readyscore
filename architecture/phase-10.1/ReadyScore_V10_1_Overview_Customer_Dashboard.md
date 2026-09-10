# ReadyScore V10.1 — Overview / Customer Dashboard

## 1. Purpose

V10.1 turns `/app` into the ReadyScore customer command center while preserving the V9.15 functional and measurement baseline.

## 2. Core Definition

> Overview = kondisi dan perjalanan user saat ini.

The page summarizes state and next actions. It does not duplicate the full assessment catalog, activity history, profile, pricing page, or individual result.

## 3. Required Hierarchy

1. Greeting / orientation
2. Progress summary
3. Continue action when an assessment is in progress
4. Latest result summary
5. Profile availability summary
6. Current access summary
7. Next-step action

## 4. Existing Data Sources

Reuse existing application services:
- current authenticated session
- dashboard / assessment attempt repository
- existing result records
- existing active products
- existing entitlement state

No new business logic is introduced for these states.

## 5. Status Rules

- Completed count reflects assessment types with completed evidence in the existing dashboard data.
- In-progress count comes from existing assessment attempt state.
- Available count reflects existing TEST_ACCESS entitlement and absence of a completed assessment type.
- Continue links to the existing assessment runtime route for the active assessment type.
- Latest result links to the existing `/result/[attemptId]` detail route.
- Profile availability reflects existing profile entitlement; presentation does not create entitlement.
- Current access reflects existing active products.

## 6. Content Boundaries

Overview must not become:
- a duplicate assessment catalog
- a duplicate activity history
- a duplicate profile visualization
- a pricing page
- a new scoring layer
- a new result calculation

Individual score values are not synthesized into an Overview score.

## 7. Route Preservation

Existing routes remain intact, including:
- `/app`
- `/access`
- `/assessments`
- `/assessments/[type]`
- `/assessments/[type]/pre-test`
- `/activity`
- `/profile`
- `/reports`
- `/result/[attemptId]`
- `/reassessment/[type]`

## 8. Accessibility / Responsive Requirements

- semantic heading hierarchy
- keyboard-accessible links and buttons
- visible focus states using existing design system
- responsive layouts for desktop, tablet, and mobile
- no information conveyed by color alone
- status text remains readable without visual styling

## 9. Measurement Safety

V10.1 is presentation-only.

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

## 10. Definition of Done

- Overview matches V10 master specification.
- Existing data/services are reused.
- No prohibited mutation is introduced.
- V10.1 contract gate passes.
- Typecheck passes.
- Production build passes.
- Actual runtime evidence confirms the Overview states and CTAs.
- Existing customer routes remain available.
