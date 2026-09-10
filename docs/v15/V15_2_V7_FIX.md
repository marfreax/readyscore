# ReadyScore V15.2 — V7 Report Runtime Fix

## What was actually wrong
V6 only fixed a TypeScript syntax error. The customer PDF could still render an older persisted `V15Report` payload because the persistence fingerprint still used `V15_REPORT_TEMPLATE_V2`.

The uploaded PDF confirmed that stale payload behavior: technical profile IDs, the old 100% evidence-coverage wording, the old sentence join, and an extra blank physical page were still present.

## Fixes
- Bump report template to `V15_REPORT_TEMPLATE_V3` so regenerated customer reports cannot reuse the V2 payload.
- Remove duplicate recommendation lead-in (`matchSignal` + `whyItFits`) from customer-facing recommendation pages.
- Normalize customer-facing punctuation in profile sections.
- Hide the mobile navigation wrapper during print.
- Remove the fixed print `min-height` that could force an otherwise empty spill page.
- Preserve V15.1 interpretation, major matching, and action-plan versions.

## Validation target
- Fresh report payload regenerated under V3.
- No technical IDs in customer-facing report pages.
- No misleading 100% evidence-coverage label.
- No `sentence. perlu` fragment join.
- 29 report pages rendered as 29 physical print pages.
