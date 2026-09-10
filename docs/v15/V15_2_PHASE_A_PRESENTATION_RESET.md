# ReadyScore V15.2 — Phase A: Reset Presentation Layer

## Objective
Replace the previous string-dump report renderer with a dedicated customer-facing presentation model and A4 report renderer, while keeping V15.1 measurement, interpretation, major matching, action-plan, entitlement, and persistence semantics intact.

## Frozen boundaries
- Assessment scoring is unchanged.
- Integrated profile semantics are unchanged.
- Major matching/ranking semantics are unchanged.
- Action-plan selection semantics are unchanged.
- Entitlement and four-assessment readiness are unchanged.
- Internal evidence identifiers remain internal and are not rendered in customer pages.

## New presentation contract
- `V15_REPORT_PRESENTATION_V1`
- `V15_REPORT_TEMPLATE_V4`
- `ReportBlock` is the customer-facing presentation model.
- `ReportPage.body` remains as a compatibility projection for existing gates; the renderer no longer uses body strings for visual layout.

## Report structure
Exactly 29 report pages:
1. Cover
2. Guide
3. Executive summary
4. Personal profile snapshot
5–8. Four profile dimensions
9. Integrated profile
10. Strengths
11. Growth
12. Learning/work environment
13. Recommendation overview
14–20. Seven recommendation details
21–22. Exploration
23. Parent guide
24–27. Four action-plan weeks
28. 30-day success indicators
29. Closing

## Customer-content rules
- No profile/attempt/signal IDs.
- No internal source-test labels such as `COGNITIVE`, `DISC`, `EQ`, or `RIASEC` in customer prose.
- No evidence coverage percentage presented as a recommendation confidence claim.
- No sentence-fragment joins.
- No duplicate punctuation.
- Recommendation pages use explicit visual hierarchy: fit → description → supporting signals → validation → careers → actions.
- Action-plan pages use objective → actions → parent role → linked choices.

## A4 renderer rules
- One report page maps to one physical A4 page.
- Cover has dedicated branded composition and ReadyScore logo.
- Content uses page-level hierarchy instead of a single generic content box.
- Toolbar and navigation are excluded from print.
- Report page dimensions are explicitly controlled in print CSS.
- No fixed minimum-height filler behavior from the previous renderer.

## Phase A acceptance
The implementation is considered structurally complete when:
- report engine emits 29 structured pages;
- customer renderer consumes `blocks`, not `body` strings;
- latest ReadyScore logo is used;
- internal evidence trails are not rendered;
- print CSS defines an explicit A4 page boundary;
- V15.1 engine versions remain frozen.
