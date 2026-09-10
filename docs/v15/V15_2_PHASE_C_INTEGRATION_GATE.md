# ReadyScore V15.2 — Phase C Integration & Gate

## Scope
Integrate the reset presentation layer into the real V15 customer report runtime without changing V15.1 measurement, matching, entitlement, or action-plan semantics.

## Integration guarantees
- Customer report API remains `/api/reports/personalized`.
- Existing V15 report ownership and entitlement checks remain unchanged.
- Four completed core assessments remain required.
- Report persistence remains `V15Report`.
- Template version is bumped to `V15_REPORT_TEMPLATE_V6` so previously persisted V15.2 payloads cannot be reused.
- Presentation version is bumped to `V15_REPORT_PRESENTATION_V2`.
- The new source fingerprint includes the template version and therefore regenerates stale report payloads automatically.
- Exactly 29 report pages are required.
- Customer-facing content is scanned for technical IDs, misleading 100% coverage language, fragment joins, and duplicate punctuation defects.

## Gate command

```bash
pnpm v15.2:phase-c
```

This runs:
1. V15.1 core gate
2. V15.1 entitlement gate
3. V15.2 customer report experience contract
4. V15.2 content-quality gate
5. Phase C authenticated HTTP/DB integration gate
6. Phase C real customer runtime E2E

## V15.1 freeze
No scoring, interpretation, major matching, or action-plan version is changed by Phase C.
