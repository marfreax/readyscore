# ReadyScore v3 — Phase 3.13
## B2B School / Institution Architecture V1

**Status:** IMPLEMENTED — GATE PENDING  
**Architecture Version:** `V3_B2B_INSTITUTION_3.13`  
**Contract Version:** `INSTITUTION_V1`

> This specification is reconciled against `RS-V3-SOURCE-OF-TRUTH` v1.0.0 and the Phase 3.1 commercial implementation baseline.

---

## 1. Scope

Phase 3.13 introduces the **institutional product layer** required by the canonical roadmap.

The phase establishes:

```text
USER
  ↓
INSTITUTION MEMBERSHIP
  ↓
INSTITUTION CONTEXT
  ↓
INSTITUTION ENTITLEMENT
  ↓
RESOURCE ACCESS
```

It does **not** replace:

```text
USER
PRODUCT
PRODUCT TIER
USER ENTITLEMENT
TEST TYPE
ASSESSMENT CONFIGURATION
```

Institutional context is additive.

---

## 2. Locked Boundaries

### 2.1 Measurement remains untouched

Phase 3.13 does not redefine:

- Test Type
- Question Bank
- Selection
- Scoring
- Result Contract
- Interpretation
- Cross-Test Profile
- Study Direction
- Major Fit
- Career Exploration

The frozen RIASEC runtime remains the minimum regression baseline.

### 2.2 Commercial identity remains separate

Institutional access must not be implemented as:

```text
if user.tier === "SCHOOL"
```

or:

```text
if user.institution === true
```

Access remains resource-based.

### 2.3 Institution is not a Test Type

```text
INSTITUTION
    ≠
TEST TYPE
```

An institution may provide access to a test, profile, report, direction feature, major-fit feature, or career exploration feature, but it does not become the owner of the measurement semantics.

---

## 3. Institutional Domain Model

### 3.1 Institution

Canonical identity:

```text
Institution
├── id
├── code
├── name
├── status
├── description
├── metadata
└── timestamps
```

Status:

```text
DRAFT
ACTIVE
SUSPENDED
RETIRED
```

### 3.2 Membership

A User can belong to multiple institutions.

```text
InstitutionMembership
├── institutionId
├── userId
├── role
├── status
├── startsAt
└── endsAt
```

Roles:

```text
OWNER
ADMIN
COUNSELOR
TEACHER
STUDENT
PARENT
```

Membership is authorization context.

Membership alone does not create measurement claims or test access.

### 3.3 Institution Entitlement

Institutional access is explicit:

```text
InstitutionEntitlement
├── institutionId
├── type
├── resourceType
├── resourceKey
├── status
├── source
├── startsAt
├── endsAt
└── metadata
```

The resource model is intentionally the same conceptual boundary as Phase 3.1:

```text
EntitlementType
+
EntitlementResourceType
+
resourceKey
```

No product-tier check is introduced.

---

## 4. Effective Institutional Access

The canonical rule is:

```text
USER
  ↓
ACTIVE MEMBERSHIP
  ↓
ACTIVE INSTITUTION
  ↓
ACTIVE INSTITUTION ENTITLEMENT
  ↓
RESOURCE
```

Therefore:

```text
hasInstitutionEntitlement(userId, institutionId, entitlement)
```

returns true only when all of the following are true:

1. user has an active membership;
2. membership is within its active time window;
3. institution is ACTIVE;
4. institution entitlement exists;
5. entitlement is ACTIVE;
6. entitlement is within its active time window.

---

## 5. Relationship to Phase 3.1

Phase 3.1 defines the canonical commercial boundary:

```text
PRODUCT
PRODUCT TIER
ENTITLEMENT
      ≠
TEST TYPE
```

Phase 3.13 extends the access sources without collapsing them:

```text
USER PRODUCT ENTITLEMENT ─────┐
                              ├── RESOURCE ACCESS
INSTITUTION ENTITLEMENT ──────┘
```

The institutional layer therefore does not modify the locked B2C matrix.

The Phase 3.1 product/tier matrix remains authoritative.

---

## 6. No Automatic Payment Flow

Phase 3.13 does not implement:

```text
Checkout
Subscription
Billing
Invoice
Payment Gateway
Purchase Webhook
Auto-grant from Payment
Refund
Renewal
Cancellation
```

Institutional entitlement provisioning is a manual/service-level primitive.

This deliberately keeps payment implementation outside the measurement and institutional architecture.

---

## 7. Runtime Contract

### Institution list

```http
GET /api/institutions
```

Returns active institutions for the authenticated user.

### Institution workspace

```http
GET /api/institutions?institutionId=<id>
```

Returns the user's authorized institution context and active institutional entitlements.

Unauthenticated:

```text
401 UNAUTHENTICATED
```

Non-member / inactive membership:

```text
403 INSTITUTION_ACCESS_DENIED
```

The API is read-only in Phase 3.13.

---

## 8. User Experience

New workspace:

```text
/institution
```

Institution detail:

```text
/institution/[institutionId]
```

The UX exposes:

- institution identity;
- current membership role;
- active institution entitlements;
- institution boundary explanation.

It does not create a second assessment experience.

Assessment routes remain governed by the existing assessment runtime.

---

## 9. Database Boundary

New models:

```text
Institution
InstitutionMembership
InstitutionEntitlement
```

New enums:

```text
InstitutionStatus
InstitutionMembershipStatus
InstitutionMemberRole
InstitutionEntitlementStatus
```

No existing assessment lifecycle table is modified by this phase.

Migration:

```text
20260826113000_v3_13_b2b_school_institution
```

---

## 10. Manual Provisioning Primitive

The runtime service exposes:

```text
grantInstitutionEntitlement(...)
```

This is intentionally analogous to the manual entitlement primitives already present in the commercial layer.

It does not call:

```text
payment
checkout
subscription
billing
```

---

## 11. Versioning

Phase 3.13 introduces:

```text
V3_B2B_INSTITUTION_3.13
INSTITUTION_V1
```

Institution architecture versioning is separate from:

```text
Question Bank Version
Taxonomy Version
Assessment Configuration Version
Selection Algorithm Version
Scoring Version
Result Contract Version
```

No measurement version is silently changed by this phase.

---

## 12. Gate

Canonical command:

```bash
pnpm db:migrate:deploy
pnpm b2b:institution:gate
```

Alias:

```bash
pnpm b2b:gate
```

Expected:

```text
Institution model              : PASS
Membership model               : PASS
Institution entitlement model  : PASS
Resource-based access          : PASS
User / institution separation  : PASS
No product-tier coupling       : PASS
No measurement mutation        : PASS
Payment/subscription            : NOT INCLUDED
Assessment lifecycle ownership : PASS
B2B institution gate           : PASS
```

---

## 13. Regression Protection

The phase must preserve:

```text
pnpm typecheck
pnpm build
pnpm commercial:gate
pnpm b2b:institution:gate
pnpm e2e:riasec
```

The RIASEC E2E remains a minimum protection layer rather than a reason to reopen completed measurement architecture.

---

## 14. Architectural Decision

The canonical source-of-truth explicitly describes Phase 3.13 as:

```text
PHASE 3.13
B2B School / Institution
Institutional product layer
```

The current source does not define a detailed institution schema, role matrix, institutional pricing catalog, or school workflow specification.

Therefore this implementation deliberately establishes the **minimum institutional architecture boundary** required by that statement:

```text
Institution
    ↓
Membership
    ↓
Institution Entitlement
    ↓
Resource Access
```

It does not invent:

- school pricing;
- subscription contracts;
- student billing;
- payment workflows;
- assessment ownership transfer;
- new measurement constructs;
- institution-specific scoring;
- institution-specific result semantics.

Those require explicit future specification decisions.

---

## 15. Frozen Relationship

```text
3.1
Commercial Product & Entitlement
        ↓
...
3.10
Commercial Dashboard
        ↓
3.11
Reports & Parent Experience
        ↓
3.12
B2C Conversion & Add-on Products
        ↓
3.13
B2B School / Institution
        ↓
3.14
Measurement Calibration
        ↓
3.15
Release Hardening
```

Phase 3.13 therefore extends the **access/commercial context layer** immediately before the platform enters Measurement Calibration.

---

# END
