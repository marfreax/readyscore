# ReadyScore V19.5 — Commercial, Pricing & Package Alignment

Status: V19.5 implementation baseline

## Commercial baseline

ReadyScore has six core assessments:

1. Cognitive
2. EQ
3. DISC
4. RIASEC
5. Work Attitude
6. Learning Preference

## Customer-facing packages

| Package | Price | Composition |
|---|---:|---|
| Single Test | Rp99.000 | Exactly one selected core assessment |
| All Tests | Rp199.000 | All six core assessments |
| ADVANCE | Rp249.000 | All six core assessments + Cross-Test Profile |

FREE remains a legacy/free-assessment entry and is not a paid package.

Custom Access is an entitlement-derived access state (2–5 active core tests); it is not a separate customer-facing product tier.

## Entitlement boundary

Commercial catalog defines what a product offers. Actual active subject entitlement is the runtime source of truth for access.

Single Test selection is stored on the order snapshot and fulfilled from that selected assessment, not from a static BASIC product entitlement bundle.

## Subject allocation

Checkout uses the current active subject context. Parent/account payment may therefore purchase for the active child/subject; fulfillment stores the order and resulting entitlements against that subject. Switching the active subject before checkout changes the intended recipient without changing account ownership.

## Existing customer protection

V19.5 does not rewrite historical order snapshots, payment records, usage counters, results, reports, or existing customer entitlements. The commercial product catalog may be reconciled for future purchases while existing customer data remains protected.

## Reassessment

Reassessment Credit remains a separate add-on at Rp49.000 per additional attempt and remains subject-scoped.

## Scope boundary

V19.5 does not introduce Career Advisor or WhatsApp functionality.
