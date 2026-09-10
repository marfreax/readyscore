# ReadyScore V10.11-PATCH.2 — Report Result Visibility

## Problem

The Reports page previously called `getUserReport()`, which enforced `REPORT_ACCESS` before loading the user's existing assessment attempts. A customer could therefore have completed results visible in Results while Reports incorrectly appeared empty.

## Contract

Reports must distinguish two concepts:

1. Existing assessment results owned by the customer.
2. Premium report presentation / Parent View entitlement.

Existing result visibility must not be mistaken for report entitlement.

## Behavior

### With completed results and no REPORT_ACCESS

- Show assessment count and result count.
- Show completed result cards.
- Allow `Open result` through the existing result route.
- Show a clear limited-report notice.
- Route report upgrade actions to Access & Plans.
- Do not show `Export PDF`.
- Do not expose Parent View as available.

### With completed results and REPORT_ACCESS

- Show the same existing result cards.
- Keep Parent View available through the existing protected route.
- Keep the existing print-to-PDF action available.

### With no completed results

- Keep the existing empty-state CTA to Assessments.

## Entitlement boundary

`getParentReport()` and `getUserReport()` remain entitlement-protected. The new `getUserReportOverview()` is read-only and only assembles existing attempt/result evidence for the Reports workspace; it does not grant report access.

## Measurement safety

No scoring, interpretation, result semantics, assessment content, persistence, or entitlement rules are changed. The patch only changes which existing data is visible in the customer Reports overview and which UI actions are shown when entitlement is absent.
