# ReadyScore v3 — Phase 3.1
## Commercial Product & Entitlement Architecture

**Status:** IMPLEMENTED — GATE PENDING  
**Architecture Version:** `V3_COMMERCIAL_3.1`  
**Matrix Version:** `V3_COMMERCIAL_MATRIX_1`  
**Pricing Status:** `PLANNING_HYPOTHESIS`

---

## 1. Objective

Phase 3.1 establishes the commercial layer without changing the measurement layer.

```text
MEASUREMENT
    ├── Test Type
    ├── Question Bank
    ├── Selection
    ├── Scoring
    ├── Result
    └── Interpretation

COMMERCIAL
    ├── Product
    ├── Product Tier
    ├── Subscription / Purchase [DEFERRED]
    └── Entitlement

EXPERIENCE
    ├── Dashboard [Phase 3.10]
    ├── Assessment UX
    ├── Result UX
    └── Reports [Phase 3.11]

SYNTHESIS
    ├── Cross-Test Profile [Phase 3.6]
    ├── Study Direction [Phase 3.7]
    ├── Major Fit [Phase 3.8]
    └── Career Exploration [Phase 3.9]
```

No commercial tier is allowed to redefine a Test Type's construct, question bank, scoring, or result semantics.

---

## 2. Product Catalog

| Tier | ID | Planning Price | Purpose |
|---|---|---:|---|
| FREE | `product-free` | Rp0 | Experience the product and establish initial value |
| BASIC | `product-basic` | Rp99.000 | Core assessment experience |
| MEDIUM | `product-medium` | Rp199.000 | Multi-assessment profile |
| ADVANCE | `product-advance` | Rp299.000 | Full assessment and direction intelligence |

Prices are planning hypotheses only.

They are not payment commitments and do not implement checkout, subscription, billing, or payment processing.

---

## 3. Locked Entitlement Matrix

### FREE

```text
TEST_ACCESS
  ASSESSMENT_CONFIGURATION: free-v1

RESULT_ACCESS
  ASSESSMENT_CONFIGURATION: free-v1
```

This preserves the existing public free assessment without coupling it to a future Test Type.

### BASIC

```text
TEST_ACCESS
  TEST_TYPE: COGNITIVE
  TEST_TYPE: STRENGTH

RESULT_ACCESS
  TEST_TYPE: COGNITIVE
  TEST_TYPE: STRENGTH
```

### MEDIUM

```text
TEST_ACCESS
  COGNITIVE
  STRENGTH
  EQ
  AQ
  DISC
  RIASEC

RESULT_ACCESS
  COGNITIVE
  STRENGTH
  EQ
  AQ
  DISC
  RIASEC

PROFILE_ACCESS
  FEATURE: CROSS_TEST_PROFILE_V1
```

### ADVANCE

```text
TEST_ACCESS
  COGNITIVE
  STRENGTH
  EQ
  AQ
  DISC
  RIASEC
  LEARNING

RESULT_ACCESS
  COGNITIVE
  STRENGTH
  EQ
  AQ
  DISC
  RIASEC
  LEARNING

PROFILE_ACCESS
  CROSS_TEST_PROFILE_V1

DIRECTION_ACCESS
  STUDY_DIRECTION_V1

MAJOR_FIT_ACCESS
  MAJOR_FIT_V1

CAREER_ACCESS
  CAREER_EXPLORATION_V1

REPORT_ACCESS
  ADVANCED_REPORT_V1
```

The mapping above is the Phase 3.1 product decision derived from the roadmap's commercial examples. It is now the implementation baseline and must not be silently changed.

---

## 4. Access Model

Canonical:

```text
USER
  ↓
PURCHASE / SUBSCRIPTION [future]
  ↓
PRODUCT
  ↓
ENTITLEMENTS
  ↓
ACCESS POLICY
  ↓
RESOURCE
```

Application code must not use:

```text
if user.tier === "ADVANCE"
```

Instead:

```text
hasEntitlement(...)
```

The entitlement service is the canonical access boundary.

---

## 5. Resource Types

```text
TEST_TYPE
ASSESSMENT_CONFIGURATION
FEATURE
```

This allows:

```text
TEST_ACCESS + TEST_TYPE + RIASEC
```

to remain different from:

```text
TEST_ACCESS + ASSESSMENT_CONFIGURATION + free-v1
```

and from:

```text
PROFILE_ACCESS + FEATURE + CROSS_TEST_PROFILE_V1
```

---

## 6. Implemented Components

### Database

Existing Phase 3.1 commercial schema is preserved:

```text
Product
ProductEntitlement
UserEntitlement
```

New migration:

```text
20260826090000_v3_1_lock_commercial_entitlement_matrix
```

The migration:

- locks planning prices;
- activates the four products;
- seeds the explicit entitlement matrix;
- does not modify assessment/question/result lifecycle.

### Runtime service

`lib/commercial/entitlement-service.ts`

Provides:

```text
hasEntitlement()
hasAnyEntitlement()
hasTestAccess()
hasAssessmentConfigurationAccess()
hasFeatureAccess()
listUserEntitlements()
grantProductEntitlements()
grantEntitlement()
revokeEntitlement()
getActiveProductsForUser()
```

### Catalog API

```text
GET /api/commercial/catalog
```

Returns:

```text
architectureVersion
matrixVersion
pricingStatus
products
entitlementMatrix
```

### Validation gate

```bash
pnpm commercial:gate
```

The gate validates:

- four commercial tiers;
- product IDs;
- planning prices;
- exact entitlement matrix;
- duplicate entitlement definitions;
- separation of commercial and measurement identity;
- absence of payment implementation.

---

## 7. Explicitly Deferred

Phase 3.1 does NOT implement:

```text
Payment
Checkout
Subscription
Payment Gateway
Invoice
Purchase Webhook
Auto-grant from Payment
Refund
Renewal
Cancellation
Commercial Dashboard
```

Those belong to later phases.

---

## 8. Relationship to Future Phases

```text
3.1 Commercial Product & Entitlement
             ↓
3.2 Test Catalog & Taxonomy
             ↓
3.3 Question Bank
             ↓
3.4 Scoring
             ↓
3.5 Result & Interpretation
             ↓
3.6 Cross-Test Profile
             ↓
3.7 Study Direction
             ↓
3.8 Major Fit
             ↓
3.9 Career Exploration
             ↓
3.10 Commercial Dashboard & Entitlement UX
```

Phase 3.10 will consume the entitlement architecture created here. It must not redesign it.

---

## 9. Gate

Phase 3.1 is considered **PASS** only after:

```text
prisma migration deploy
        ↓
commercial:gate
        ↓
PASS
```

Until then:

```text
IMPLEMENTED
    ≠
GATE PASSED
```

The source-of-truth development cursor therefore remains:

```text
PHASE 3.1
```

until the environment-side gate is executed successfully.

# END
