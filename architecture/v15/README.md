# ReadyScore V15.1 — Core Engine

V15.1 consumes frozen V13/V14 contracts and adds interpretation, curated major matching, action plan, and report composition.

### Versioned contracts
- `V15_INTERPRETATION_V1`
- `MAJOR_KB_V1`
- `V15_MAJOR_MATCHING_V1`
- `V15_ACTION_PLAN_V1`
- `V15_REPORT_TEMPLATE_V1`
- `V15_REPORT_V1`

### Matching baseline
RIASEC 35% + DISC 20% + Cognitive 30% + EQ 15%. Missing dimensions are excluded from the denominator and evidence coverage is exposed. Selection is deterministic and curated; no random recommendation is permitted.

### Historical stability
A generated report is keyed by a deterministic source fingerprint. The same source attempts and rule/content versions reuse the existing persisted report. A version change produces a distinct historical report rather than silently rewriting the prior payload.


### Controlled entitlement integration
V15.1 adds `REPORT_ACCESS / ADVANCED_REPORT_V1` to the existing `product-advance` capability set without changing the V14 tier identity, price, assessment access, result semantics, payment flow, or entitlement policy boundary. The V15.1 migration backfills only currently active ADVANCE customers, preserving their original entitlement window and order provenance. New ADVANCE purchases receive the report capability through the existing ProductEntitlement → UserEntitlement fulfillment primitive. The legacy `ADVANCED_REPORT_V1` add-on remains available to accounts that do not already have the capability.

## V15.2 — Customer Report Experience

V15.2 exposes the frozen V15.1 report as a normal customer product path. `/reports` shows readiness and links to `/reports/personalized`; the personalized page renders every persisted report page and supports presentation-only PDF export. `/api/reports/personalized` is the authenticated HTTP surface for real customer validation.

Readiness requires all four core assessment types to have completed results. No score is recalculated and no assessment result is mutated. Report persistence continues to use the V15.1 deterministic source fingerprint.
