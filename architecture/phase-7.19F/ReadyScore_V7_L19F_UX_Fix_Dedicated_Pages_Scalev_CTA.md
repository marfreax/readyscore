# ReadyScore V7 L19F UX Fix — Dedicated Pages & Scalev CTA

## Objective
Refine the final customer navigation after manual UX acceptance identified two navigation items that returned to Overview anchors and an Access & Plans page without a purchase action.

## Changes
1. `Assessments` → `/assessments`.
2. `Recent activity` → `/activity`.
3. `Access & Plans` exposes explicit `Beli di Scalev` CTAs for configured product SKUs.
4. Overview remains the landing page and retains summary content.

## Commercial boundary
The CTA does not grant entitlement. It redirects through `/api/scalev/checkout` to a Scalev-hosted checkout URL configured by environment. Existing Scalev webhook verification and ReadyScore entitlement fulfillment remain the source of truth after payment.

## Supported checkout SKUs
- `RS-SINGLE-IQ-V1`
- `RS-SINGLE-EQ-V1`
- `RS-SINGLE-DISC-V1`
- `RS-SINGLE-RIASEC-V1`
- `RS-ASSESSMENT-V1`
- `RS-ALL-PROFILING-V1`

## Protected semantics
No measurement, scoring, result, entitlement, reassessment, profiling, or database schema semantics are changed.

## Database
**DATABASE MIGRATION: NO**
