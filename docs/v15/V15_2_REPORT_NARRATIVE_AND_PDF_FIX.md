# ReadyScore V15.2 — Report Narrative & PDF Cleanliness Fix

## Scope
Presentation/content-layer fix only. Measurement, scoring, major matching, knowledge base, entitlement, and database semantics remain unchanged.

## Changes
1. **Recommendation narrative enrichment**
   - Recommendation detail pages now explain why the field appears using the existing `whyItFits`, the strongest supporting signal labels, and the existing major description.
   - The narrative explicitly frames the result as an exploration hypothesis and points to an existing exploration action as the practical validation step.
   - No new scoring or inference is introduced.

2. **Action-plan technical label cleanup**
   - Customer-facing action plan no longer exposes source-test suffixes such as `COGNITIVE`, `DISC`, `EQ`, or `RIASEC` from the interpretation layer.

3. **PDF accessibility chrome cleanup**
   - The web accessibility skip-link remains available on screen but is hidden during print/PDF export.

4. **Persistence invalidation**
   - Report template version bumped from `V15_REPORT_TEMPLATE_V5` to `V15_REPORT_TEMPLATE_V6` so previously persisted V15.2 report payloads are regenerated with the new presentation/content output.

5. **Gate hardening**
   - Content-quality and Phase C integration scans now explicitly reject `from/dari COGNITIVE|DISC|EQ|RIASEC` leakage.
   - Phase C integration expects template V6.

## Protected semantics
- `V15_INTERPRETATION_V1` unchanged.
- `MAJOR_KB_V1` unchanged.
- `V15_MAJOR_MATCHING_V1` unchanged.
- `V15_ACTION_PLAN_V1` unchanged.
- Report remains 29 pages.
