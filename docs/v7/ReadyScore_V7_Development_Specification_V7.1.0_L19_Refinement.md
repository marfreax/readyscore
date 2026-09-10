# ReadyScore V7 --- Application Completion & Product Operations Specification

**Document:** `ReadyScore_V7_Development_Specification.md`\
**Version:** V7.1.0\
**Date:** 2026-08-28\
**Status:** **LOCKED DEVELOPMENT REFERENCE — L19 REFINEMENT TRACK ADDED**\
**Predecessor:** ReadyScore V6 --- L11 Paid Customer E2E / L12 Launch
QA\
**Replacement policy:** The next replacement package must use **FIXED5**
unless explicitly changed by decision.

------------------------------------------------------------------------

## 1. Purpose

V7 is the post-V6 development track for completing the **Application
Surface** and **Administration Surface** of ReadyScore.

V7 closes the gap between the maturity of the
assessment/commercial/profile engines and the maturity of the
customer-facing and administrative product surfaces.

Objectives:

1.  Complete authentication and access.
2.  Complete the customer application shell and dashboard.
3.  Provide unified administration for RIASEC, DISC, EQ, and Cognitive
    question banks.
4.  Provide safe assessment/instrument configuration management.
5.  Provide controlled content review and publishing.
6.  Complete customer-facing pages.
7.  Establish a consistent global UX/UI system.
8.  Execute full-product regression and launch-quality verification.

V7 is an extension of the existing architecture, not a new application
architecture.

------------------------------------------------------------------------

## 2. Source-of-Truth Hierarchy

``` text
ReadyScore V3 SOURCE OF TRUTH
        ↓
V3 Master Architecture / Reconciliation
        ↓
Relevant Version / Phase Specification
        ↓
Actual Source / Database Contract
        ↓
Frozen Runtime Baseline
        ↓
V7 Implementation
        ↓
V7 Regression Evidence
```

If sources conflict:

``` text
CONFLICT
   ↓
STOP
   ↓
IDENTIFY
   ↓
CLASSIFY
   ├── documentation conflict
   ├── implementation gap
   ├── source drift
   └── intentional architectural change
   ↓
DOCUMENT DECISION
   ↓
UPDATE AFFECTED DOCUMENTATION
   ↓
IMPLEMENT
   ↓
REGRESSION
```

**No conflict may be resolved by assumption.**

------------------------------------------------------------------------

## 3. V7 Boundary

### In Scope

``` text
V7 L13 Authentication & Access Completion
V7 L14 Customer Application Shell & Dashboard UX
V7 L15 Unified Question Bank Management
V7 L16 Assessment Administration & Instrument Configuration
V7 L17 Admin Review & Content Operations
V7 L18 Customer Page Completion
V7 L19 Global UX/UI System Hardening
V7 L19A Customer Shell & Navigation Refinement
V7 L19B Access & Plans / Entitlement UX Completion
V7 L19C Assessment Journey UX Completion
V7 L19D Admin Information Architecture Refinement
V7 L19E QA User Fixtures & Scenario Matrix
V7 L19F Final UX/UI Acceptance & Cross-Surface Validation
V7 L20 Full Product Regression QA
```

### Out of Scope

V7 must not silently reopen:

-   RIASEC measurement semantics
-   DISC measurement semantics
-   EQ measurement semantics
-   Cognitive measurement semantics
-   scoring semantics
-   result semantics
-   reassessment semantics
-   upgrade semantics
-   cross-test profiling semantics
-   paid-customer entitlement semantics
-   commercial product pricing
-   psychometric calibration

Any intentional change to these boundaries requires an explicit
architectural decision before implementation.

------------------------------------------------------------------------

## 4. Frozen Baseline

### 4.1 RIASEC Regression

``` text
Start route reachability       PASS
Question selection             PASS
60 questions                   PASS
R/I/A/S/E/C                    10/10/10/10/10/10
60 answer submissions          PASS
Persistence / reload           PASS
Submit + scoring               PASS
Result payload                 PASS
RIASEC measurement             PASS
RIASEC_RESULT_V1               PASS
Six dimensions                 PASS
Top code                       PASS
Scoring version                PASS
```

### 4.2 V6 L11 Paid Customer E2E

Protected journey:

``` text
Signed payment verification
        ↓
Identity
        ↓
Entitlement
        ↓
Assessment
        ↓
Scoring
        ↓
Result
        ↓
Reassessment
        ↓
Upgrade
        ↓
Cross-Test Profiling
```

Protected scenarios:

``` text
A — Single Test
B — All Tests
C — All Tests + Profile
D — Reassessment Credit
E — Upgrade 99 → 249
```

### 4.3 V6 L12 Launch QA

Protected launch boundary:

``` text
Public/customer route reachability
Commercial catalog API
Test catalog API
Unauthenticated entitlement guard
Unauthenticated profile guard
Release hardening
Commercial boundary
Institution boundary
Measurement/recommendation boundary
Mutation safety
```

V7 must preserve these baselines.

------------------------------------------------------------------------

## 5. Core Architectural Principles

### 5.1 Measurement Is Frozen

Application UX adapts to the measurement architecture. The measurement
architecture must not be reshaped merely to simplify UI implementation.

### 5.2 Product and Measurement Remain Separate

``` text
PRODUCT
PRODUCT TIER
ENTITLEMENT
        ≠
TEST TYPE
ASSESSMENT CONFIGURATION
        ≠
MEASUREMENT
```

### 5.3 Question Identity Is Version-Safe

Never collapse:

``` text
Question.id
Question.code
QuestionVersion.id
```

Canonical model:

``` text
Question
    =
stable logical identity

QuestionVersion
    =
immutable assessment-facing version
```

### 5.4 Historical Assessment Content Is Immutable

An assessment-facing question version must not be silently overwritten
after being used by an assessment. A correction creates a new version.

### 5.5 No Universal Score

V7 must never introduce a generic universal score merely to simplify
dashboard/profile UI.

### 5.6 No Raw-Average Synthesis

Do not calculate a customer-facing overall score by averaging unrelated
test scores.

------------------------------------------------------------------------

## 6. Canonical V7 Development Order

``` text
V7 L13
AUTHENTICATION & ACCESS COMPLETION
        ↓
V7 L14
CUSTOMER APPLICATION SHELL & DASHBOARD UX
        ↓
V7 L15
UNIFIED QUESTION BANK MANAGEMENT
        ↓
V7 L16
ASSESSMENT ADMINISTRATION & INSTRUMENT CONFIGURATION
        ↓
V7 L17
ADMIN REVIEW & CONTENT OPERATIONS
        ↓
V7 L18
CUSTOMER PAGE COMPLETION
        ↓
V7 L19
GLOBAL UX/UI SYSTEM HARDENING
        ↓
V7 L19A
CUSTOMER SHELL & NAVIGATION REFINEMENT
        ↓
V7 L19B
ACCESS & PLANS / ENTITLEMENT UX COMPLETION
        ↓
V7 L19C
ASSESSMENT JOURNEY UX COMPLETION
        ↓
V7 L19D
ADMIN INFORMATION ARCHITECTURE REFINEMENT
        ↓
V7 L19E
QA USER FIXTURES & SCENARIO MATRIX
        ↓
V7 L19F
FINAL UX/UI ACCEPTANCE & CROSS-SURFACE VALIDATION
        ↓
V7 L20
FULL PRODUCT REGRESSION QA
```

The order is intentional and must not be casually rearranged.

------------------------------------------------------------------------

## 7. L13 --- Authentication & Access Completion

### Objective

Create the complete account and access foundation required by the
customer application.

### Required surfaces

``` text
/register
/login
/logout
/session
protected route handling
unauthenticated redirect
authenticated access
```

### Required flow

``` text
REGISTER
   ↓
ACCOUNT CREATED
   ↓
LOGIN
   ↓
SESSION
   ↓
/app
```

Protected-route behavior:

``` text
UNAUTHENTICATED USER
        ↓
PROTECTED ROUTE
        ↓
LOGIN
```

### Acceptance criteria

-   `/login` is reachable.
-   `/register` is reachable.
-   Registration succeeds.
-   Login succeeds.
-   Session persists according to the selected authentication
    architecture.
-   Logout invalidates access correctly.
-   Protected pages reject unauthenticated access.
-   Authenticated users can reach the application.
-   Authentication does not bypass entitlement checks.
-   Authentication does not mutate assessment measurement semantics.
-   Authentication does not break paid E2E.

------------------------------------------------------------------------

## 8. L14 --- Customer Application Shell & Dashboard UX

### Objective

Transform `/app` from a capability listing into a coherent production
application shell.

Conceptual structure:

``` text
┌─────────────────────────────────────────────┐
│ ReadyScore          Navigation / Account    │
├─────────────────────────────────────────────┤
│ Welcome / Customer Context                  │
│                                             │
│ Assessment Status                           │
│                                             │
│ RIASEC     DISC       EQ       Cognitive    │
│ Result     Locked     Locked   Locked       │
│                                             │
│ Recent Results                              │
│                                             │
│ Available Products / Actions                │
└─────────────────────────────────────────────┘
```

### Required states

``` text
AVAILABLE
LOCKED
IN PROGRESS
COMPLETED
EMPTY
LOADING
ERROR
```

### Required areas

-   application header
-   navigation
-   customer identity
-   assessment cards
-   entitlement status
-   result access
-   reassessment access
-   commercial CTA
-   recent activity/results
-   responsive behavior

The dashboard must not expose internal engineering terminology
unnecessarily.

------------------------------------------------------------------------

## 9. L15 --- Unified Question Bank Management

### Objective

Create one administrative workspace for:

``` text
RIASEC
DISC
EQ
COGNITIVE
```

Canonical surface:

``` text
/admin/question-bank
```

Conceptual structure:

``` text
QUESTION BANK
│
├── RIASEC
├── DISC
├── EQ
└── COGNITIVE
```

### Required capabilities

``` text
List
Search
Filter
View
Create
Edit
Duplicate
Version
Activate
Archive
Inspect
```

### Critical rule

The UI must distinguish:

``` text
Logical Question
        ↓
Question Version
```

Editing assessment-facing content must not silently overwrite a version
already used by an assessment.

The unified workspace is an administrative shell only. It must not force
all tests into identical scoring or measurement structures.

------------------------------------------------------------------------

## 10. L16 --- Assessment Administration & Instrument Configuration

### Objective

Separate question content management from assessment-instrument
configuration.

Canonical relationship:

``` text
QUESTION BANK
      ↓
QUESTION VERSION
      ↓
ASSESSMENT CONFIGURATION
      ↓
SELECTION
      ↓
ATTEMPT
      ↓
RESULT
```

Configuration visibility should include, where applicable:

``` text
Assessment Type
Configuration Version
Question Bank Version
Taxonomy Version
Scoring Version
Selection Algorithm Version
Status
```

Existing attempt snapshot semantics remain protected:

``` text
assessmentConfigurationId
assessmentConfigurationVersion
questionBankVersion
taxonomyVersion
scoringVersion
selectionAlgorithmVersion
attemptSeed
selectionSnapshot
```

V7 must not remove or flatten these version boundaries for convenience.

------------------------------------------------------------------------

## 11. L17 --- Admin Review & Content Operations

### Objective

Introduce controlled operational lifecycle for assessment content.

Canonical lifecycle:

``` text
DRAFT
  ↓
REVIEW
  ↓
APPROVED
  ↓
PUBLISHED
  ↓
ACTIVE
  ↓
ARCHIVED
```

Required operations:

-   content validation
-   metadata validation
-   duplicate detection
-   review status
-   version comparison
-   publish protection
-   archive protection
-   audit trail

Publishing is a controlled state transition, not merely a UI toggle.

------------------------------------------------------------------------

## 12. L18 --- Customer Page Completion

### Objective

Bring all customer-facing routes to a consistent production standard.

Target surfaces:

``` text
/app
/profile
/result/[attemptId]
/reassessment/[type]
/reports
/reports/[attemptId]/parent
```

and the commercial customer experience.

### Completion standard

``` text
ROUTE EXISTS
      ↓
FUNCTIONAL
      ↓
CORRECT DATA
      ↓
CORRECT ACCESS CONTROL
      ↓
GOOD UX
      ↓
RESPONSIVE
      ↓
REGRESSION SAFE
```

A route returning HTTP success alone is not sufficient.

------------------------------------------------------------------------

## 13. L19 --- Global UX/UI System Hardening

### Objective

Create a coherent visual and interaction language across:

``` text
Public
Customer
Admin
Institution
```

Standard components:

``` text
Typography
Spacing
Container
Card
Button
Badge
Input
Form
Modal
Table
Navigation
Tabs
Empty State
Loading State
Error State
Toast
```

Global styling follows structural completion. Do not polish one page
extensively while critical application surfaces remain structurally
incomplete.

------------------------------------------------------------------------

## 14. L19A --- Customer Shell & Navigation Refinement

### Objective

Refine the customer application shell so authenticated customer pages
behave as one coherent workspace rather than separate page systems.

### Required customer surfaces

``` text
/app
/profile
/reports
/reports/[attemptId]
/reports/[attemptId]/parent
/result/[attemptId]
/reassessment/[type]
```

### Navigation rule

The customer shell must have one primary navigation system. Duplicate primary
navigation must not appear in both the global header and sidebar unless an
explicit architectural decision requires it.

Recommended baseline:

``` text
HEADER
ReadyScore / Brand
Customer Identity
Logout

SIDEBAR
WORKSPACE
├── Overview
├── Profile
├── Reports
├── Assessments
├── Recent Activity
└── Access & Plans
```

Every visible navigation item must resolve to a meaningful customer-facing
destination. Unfinished or empty destinations must not be presented as
complete functionality.

### Profile continuity

`/profile` must retain the customer workspace shell. Navigation from
Dashboard → Profile must feel like navigation inside one application.

The same continuity principle applies to Reports, Result, and Reassessment.

### Responsive behavior

``` text
Desktop
Sidebar + Content

Tablet
Compact / collapsible navigation

Mobile
Content-first layout + accessible navigation control
```

### Acceptance criteria

- Duplicate primary navigation is removed.
- Customer shell is persistent across customer surfaces.
- Active navigation state is clear.
- Profile no longer unexpectedly loses the customer shell.
- Navigation items resolve to meaningful destinations.
- Desktop/tablet/mobile behavior is intentional.
- Authentication and authorization remain unchanged.
- DATABASE MIGRATION: NO

---

## 15. L19B --- Access & Plans / Entitlement UX Completion

### Objective

Turn Access & Plans into a clear capability and commercial entry point
without changing the existing commercial architecture.

### Protected architecture

``` text
PRODUCT CATALOG
      ↓
COMMERCIAL FLOW
      ↓
PURCHASE / VERIFICATION
      ↓
ENTITLEMENT
      ↓
AVAILABLE CAPABILITY
```

The customer UI must never grant paid capability merely because a user
clicked an activation button.

### Required customer-facing states

``` text
AVAILABLE
LOCKED
IN PROGRESS
COMPLETED
PURCHASE REQUIRED
UPGRADE AVAILABLE
NOT ELIGIBLE
LOADING
ERROR
```

### Required package visibility

``` text
Single Test
All Tests
All Tests + Profiling
Reassessment Credit
Relevant Add-ons
```

The UI must communicate the next valid action, such as:

``` text
[Pilih Paket]
[Mulai Assessment]
[Lihat Akses]
[Upgrade]
```

The actual commercial operation must remain delegated to the existing
commercial flow.

### Active entitlement presentation

When an entitlement exists, the customer should see capability clearly:

``` text
CURRENT ACCESS

IQ / Cognitive
Active

[Mulai Assessment]
```

When entitlement does not exist:

``` text
IQ / Cognitive
Locked

Assessment ini belum termasuk akses Anda.

[Lihat Akses]
```

### Acceptance criteria

- The user can understand why an assessment is locked.
- The user can understand how to obtain access.
- Active entitlements are distinguishable from products requiring purchase.
- Commercial CTAs do not bypass verification.
- Pricing does not conflict with the canonical commercial catalog.
- Upgrade remains delegated to commercial semantics.
- Reassessment remains governed by existing eligibility/entitlement.
- DATABASE MIGRATION: NO

---

## 16. L19C --- Assessment Journey UX Completion

### Objective

Complete and visibly validate the customer journey from assessment
selection through Pre-Test, actual assessment execution, submission, and
result.

### Canonical journey

``` text
DASHBOARD
   ↓
ASSESSMENT SELECTION
   ↓
PRE-TEST
   ↓
START
   ↓
ACTUAL ASSESSMENT
   ↓
SUBMIT
   ↓
RESULT
   ↓
REPORT / PROFILE / REASSESSMENT
```

### Required assessment journeys

The journey must be inspectable for:

``` text
IQ / Cognitive
EQ
DISC
RIASEC
```

### Pre-Test requirements

Each applicable assessment must expose, where supported:

``` text
Assessment name
Purpose / introduction
Expected duration
Question count or task structure
Instructions
Important conditions
Start action
```

Pre-Test must not expose internal database identifiers or implementation
details.

### Actual assessment requirements

The runtime assessment experience must visibly handle:

``` text
Question / task
Progress
Answer state
Navigation
Selected state
Loading
Error
Exit / abandon
Submission
Completion
```

The UI must use the real assessment engine and actual assessment content.
It must never fabricate questions, answers, scores, or results solely for
presentation.

### Result destination

After successful submission:

``` text
ASSESSMENT COMPLETED
        ↓
RESULT PAGE
        ↓
RELEVANT REPORT / NEXT ACTION
```

The result page must preserve assessment-specific result semantics. The UI
must not introduce a universal score to make RIASEC, DISC, EQ, and Cognitive
look identical.

### Ownership

Result access remains subject to existing ownership and authorization
boundaries. Cross-account result access must remain blocked.

### Acceptance criteria

- Pre-Test is reachable for each applicable assessment.
- Actual assessment UI is reachable.
- Submit reaches the correct result destination.
- Result experience is understandable.
- Loading/error/abandon states are represented.
- Cross-account isolation remains enforced.
- Existing result semantics remain unchanged.
- No universal score is introduced.
- DATABASE MIGRATION: NO

---

## 17. L19D --- Admin Information Architecture Refinement

### Objective

Make the administration surface understandable as an operational product
rather than a collection of unrelated engineering pages.

### Recommended admin information architecture

``` text
ADMIN

Overview

CONTENT
├── Question Bank
├── Review & Publishing
└── Assessment Configuration

USERS & ACCESS
├── Users
└── Entitlements / Access

INTEGRATIONS
├── Scalev
└── Other active integrations

SETTINGS
└── Only when real system/admin settings exist
```

### Existing capabilities that must remain discoverable

``` text
Question Bank
Review Queue
Version Comparison
Publishing
Activation
Archive
Audit Trail
Assessment Configuration
```

### User management

The admin IA must provide a defined place for:

``` text
User list
User status
Roles
Entitlements / access
Relevant account information
```

This does not authorize new commercial rules.

### Integration management

Integrations must have a defined administrative home. Existing Scalev
integration surfaces must remain accessible through an appropriate admin
entry point.

### Settings rule

Do not create a Settings area merely for completeness. It should exist only
when there are real global or administrative settings to manage.

### Acceptance criteria

- Admin navigation is grouped by operational responsibility.
- Content management is discoverable.
- User/access management has a defined location.
- Integrations have a defined location.
- Settings is omitted when no real setting exists.
- Admin authorization remains intact.
- Historical content/version safety remains intact.
- DATABASE MIGRATION: NO

---

## 18. L19E --- QA User Fixtures & Scenario Matrix

### Objective

Create deterministic QA identities and data states for validating customer,
commercial, assessment, result, reassessment, profiling, and admin flows.

### Required baseline users

``` text
QA-01
Single Test User
Entitlement:
1 core assessment type

QA-02
All Tests User
Entitlement:
IQ + EQ + DISC + RIASEC

QA-03
Full Access User
Entitlement:
IQ + EQ + DISC + RIASEC + Cross-Test Profiling

QA-04
Admin User
Role:
ADMIN
```

Exact passwords/credentials must be generated securely by the test
environment and must not be hardcoded into production source.

### Recommended state coverage

``` text
NO ASSESSMENT COMPLETED
PARTIALLY COMPLETED
COMPLETED
REASSESSMENT ELIGIBLE
REASSESSMENT NOT ELIGIBLE
PROFILE AVAILABLE
PROFILE UNAVAILABLE
```

### Core scenario matrix

``` text
QA-01 Single Test
→ one assessment available
→ other assessments locked
→ start assessment
→ result ownership

QA-02 All Tests
→ four core assessments available
→ profiling unavailable unless entitled
→ assessment/result journey

QA-03 Full Access
→ four core assessments available
→ profiling available
→ result/profile journey

QA-04 Admin
→ admin authentication
→ question bank
→ review/publishing
→ assessment configuration
→ user/access
→ integrations
```

### Fixture safety

QA fixtures are test data, not production customer data.

Fixture provisioning may create database records but must not require a
schema migration unless the data model itself changes.

### Acceptance criteria

- Required QA identities can be provisioned deterministically.
- Entitlement states are explicit.
- Admin identity is explicit.
- Completed-result state is available for UX review.
- Cross-account isolation can be tested.
- Fixture provisioning is documented.
- DATABASE MIGRATION: NO

---

## 19. L19F --- Final UX/UI Acceptance & Cross-Surface Validation

### Objective

Perform the final product-facing acceptance pass after L19A–L19E and before
L20 Full Product Regression QA.

### Required cross-surface journey

``` text
PUBLIC
   ↓
AUTH
   ↓
CUSTOMER SHELL
   ↓
ACCESS & PLANS
   ↓
PRE-TEST
   ↓
ASSESSMENT
   ↓
RESULT
   ↓
REPORT / PROFILE / REASSESSMENT
   ↓
ADMIN
   ↓
INTEGRATION / ACCESS OPERATIONS
```

### Visual acceptance checklist

``` text
Typography hierarchy
Spacing rhythm
Container widths
Card density
Button hierarchy
Form states
Empty states
Loading states
Error states
Navigation consistency
Responsive behavior
Focus visibility
Keyboard usability
Language consistency
```

### Product-language acceptance

Customer-facing language should be consistent and preferably Indonesia-first
while retaining established product terminology where useful.

Avoid unnecessary internal terminology:

``` text
QuestionVersion.id
ScoringVersion
SelectionAlgorithmVersion
AttemptSeed
internal database identifiers
```

Prefer understandable language:

``` text
Assessment Anda
Hasil Anda
Profil Anda
Assessment tersedia
Terkunci
Sudah dibeli
Selesai
Mulai Assessment
Retake Assessment
```

### Mandatory entry conditions

``` text
L19A PASS
L19B PASS
L19C PASS
L19D PASS
L19E PASS
```

### Acceptance criteria

- All L19 refinement sub-phases PASS.
- Customer shell is visually consistent.
- Customer journey is visually inspectable end-to-end.
- Admin navigation is coherent.
- Desktop and mobile critical journeys are accepted.
- No critical customer dead-end remains.
- No measurement, scoring, result, commercial, entitlement, reassessment,
  or profiling semantic mutation is introduced.
- DATABASE MIGRATION: NO

---

## 20. L20 --- Full Product Regression QA

### Objective

Verify the entire ReadyScore product after completion of L19 and all
mandatory L19A–L19F refinement phases.

L20 is a **regression and release-confidence phase**, not a feature
development phase.

### Entry criteria

L20 may start only when:

``` text
L13 PASS
L14 PASS
L15 PASS
L16 PASS
L17 PASS
L18 PASS
L19 PASS
L19A PASS
L19B PASS
L19C PASS
L19D PASS
L19E PASS
L19F PASS
```

A failed prerequisite means L20 is not ready to begin.

### Public

``` text
/
trial/*
```

### Authentication

``` text
register
login
logout
session
protected routes
unauthenticated redirect
authenticated access
```

### Customer Shell & Navigation

``` text
/app
/profile
/reports
/result/[attemptId]
/reassessment/[type]
```

Verify:

``` text
shared shell
sidebar continuity
navigation consistency
active state
responsive behavior
logout
no duplicate primary navigation
```

### Customer Access & Plans

``` text
Single Test
All Tests
All Tests + Profiling
Reassessment Credit
Upgrade
Add-ons
```

Verify:

``` text
locked state
available state
purchase CTA
entitlement state
upgrade path
commercial delegation
no entitlement bypass
```

### Assessment Journey

For each applicable assessment:

``` text
RIASEC
DISC
EQ
COGNITIVE
```

verify:

``` text
Dashboard
→ Assessment selection
→ Pre-Test
→ Start
→ Actual Assessment
→ Answering
→ Progress
→ Submit
→ Result
→ Report / next action
```

Also verify:

``` text
loading
error
abandon
reload / persistence
ownership
cross-account isolation
```

### Result & Report Experience

Verify:

``` text
Result page reachability
Correct attempt ownership
Assessment-specific result presentation
Report access
Parent report boundary
Cross-test profile boundary
Reassessment action
```

No regression may introduce a universal score or alter result semantics.

### QA User Matrix

Run the core regression against:

``` text
QA-01 Single Test User
QA-02 All Tests User
QA-03 Full Access User
QA-04 Admin User
```

Where applicable, include completed-result and reassessment-eligible
fixture states.

### Admin

``` text
Question Bank
Question Review
Assessment Configuration
Publishing
Activation
Archive
Version History
Audit Trail
Users / Access
Integrations
```

Verify:

``` text
admin authentication
authorization
historical version immutability
publish protection
archive protection
audit trail
no scoring mutation
no measurement mutation
```

### Institution

``` text
/institution
/institution/[institutionId]
```

Verify institution isolation and access boundaries.

### Measurement

``` text
RIASEC
DISC
EQ
COGNITIVE
```

Verify that customer-facing refinement did not alter:

``` text
measurement semantics
scoring semantics
result semantics
selection semantics
version snapshots
```

### V5/V6 regression

``` text
Cross-Test Profiling
Paid Customer E2E
Reassessment
Upgrade
Entitlement
Commercial catalog
Test catalog
Scalev handoff / relevant integration boundary
```

### Regression classification

Every finding must be classified as:

``` text
P0 — blocking release
P1 — critical product defect
P2 — normal defect
P3 — cosmetic / backlog
```

A P0 or P1 issue affecting a protected customer journey prevents L20 PASS.

### L20 PASS condition

L20 is PASS only when:

``` text
All required routes reachable
        +
All protected boundaries verified
        +
Core assessment journeys verified
        +
Commercial flows verified
        +
Admin operations verified
        +
Institution boundary verified
        +
QA fixture matrix verified
        +
Responsive UX verified
        +
Frozen measurement regression PASS
        +
No critical unresolved defect
```

DATABASE MIGRATION: NO, unless a separately approved regression fix
requires one.

## 21. V7 Gate Model

Each L-phase uses:

``` text
STATIC / CONTRACT GATE
        +
TYPECHECK
        +
BUILD
        +
ACTUAL RUNTIME E2E
        +
FROZEN REGRESSION
```

A phase is not PASS merely because TypeScript or Next build passes.

Actual runtime evidence is required for runtime claims.

------------------------------------------------------------------------

## 22. Full ZIP Development Rule

Every V7 implementation package must be delivered as a **full ZIP**, not
a patch-only package.

The user must not be required to reconstruct the application manually
from partial snippets.

Each implementation ZIP must contain the complete source required for
the phase, including required migrations, scripts, configuration, and
phase documentation.

Do not create a new generic `docs/` directory inside the ZIP unless
explicitly authorized.

------------------------------------------------------------------------

## 23. Database & Migration Rules

Database changes require:

``` text
schema change
      ↓
migration
      ↓
migration validation
      ↓
runtime validation
```

Each phase must explicitly declare:

``` text
DATABASE MIGRATION: REQUIRED
```

or:

``` text
DATABASE MIGRATION: NO
```

The declaration must be truthful.

------------------------------------------------------------------------

## 24. Security & Access Rules

Authentication establishes identity.

Authorization determines resource access.

Entitlement determines purchased capability.

They remain separate:

``` text
IDENTITY
   ↓
AUTHENTICATION
   ↓
AUTHORIZATION
   ↓
ENTITLEMENT
   ↓
CAPABILITY
```

A logged-in user must not automatically receive paid assessment access.

------------------------------------------------------------------------

## 25. Admin Safety Rules

Administrative UI is a control surface over assessment content.

Therefore:

1.  Never mutate historical assessment versions silently.
2.  Never delete content required for historical result reconstruction.
3.  Never alter scoring semantics from a generic question editor.
4.  Never publish incomplete configurations.
5.  Never bypass versioning because a UI flow is simpler.
6.  Preserve auditability for material content/configuration changes.

------------------------------------------------------------------------

## 26. Customer UX Rules

Customer-facing pages must not unnecessarily expose internal engineering
concepts such as:

``` text
QuestionVersion.id
ScoringVersion
SelectionAlgorithmVersion
AttemptSeed
internal database identifiers
```

Prefer understandable concepts:

``` text
Your assessment
Your result
Your profile
Retake assessment
Available assessment
Locked
Purchased
Completed
```

------------------------------------------------------------------------

## 27. Regression Protection Matrix

  -----------------------------------------------------------------------
  Area                           UX Improvement           Semantic Change
  ------------------- ------------------------- -------------------------
  Authentication                            Yes     Only through explicit
                                                            auth decision

  Dashboard                                 Yes   No measurement semantic
                                                                   change

  Question Bank UI                          Yes     No historical version
                                                                 mutation

  Assessment Config                         Yes             Only explicit
  UI                                               configuration decision

  Admin Workflow                            Yes No silent scoring changes

  Result UI                                 Yes        No result semantic
                                                                 mutation

  Profiling UI                              Yes         No synthesis-rule
                                                                 mutation

  Commercial UI                             Yes    No pricing/entitlement
                                                mutation without decision

  Reassessment UI                           Yes  No reassessment semantic
                                                                 mutation

  Measurement Engine                         No   **No, unless explicitly
                                                               reopened**
  -----------------------------------------------------------------------

------------------------------------------------------------------------

## 28. Definition of Done

A V7 phase is complete only when all applicable conditions are true:

``` text
[ ] Scope implemented
[ ] Source contract consistent
[ ] Typecheck PASS
[ ] Build PASS
[ ] Static/contract gate PASS
[ ] Database migration verified, if applicable
[ ] Actual runtime E2E PASS
[ ] Frozen regression PASS
[ ] Access-control regression PASS
[ ] No measurement semantic mutation
[ ] No unintended commercial mutation
[ ] Full ZIP produced
[ ] Phase checkpoint documented
```

Any required unchecked item means the phase is **NOT COMPLETE**.

------------------------------------------------------------------------

## 29. V7 Checkpoint Format

``` text
V7 Lxx — <PHASE NAME>

Implementation:
PASS / FAIL

Typecheck:
PASS / FAIL

Build:
PASS / FAIL

Contract Gate:
PASS / FAIL

Database Migration:
REQUIRED / NO

Actual Runtime E2E:
PASS / FAIL

Frozen Regression:
PASS / FAIL

Measurement Semantics:
NO MUTATION / CHANGED BY EXPLICIT DECISION

Commercial Semantics:
NO MUTATION / CHANGED BY EXPLICIT DECISION

Result:
PASS / FAIL
```

------------------------------------------------------------------------

## 30. V7 Failure Policy

If a gate fails:

``` text
FAIL
 ↓
DO NOT declare phase complete
 ↓
Capture exact failure
 ↓
Identify source
 ↓
Fix
 ↓
Re-run complete validation chain
```

Do not mask failures by:

-   weakening validators;
-   removing assertions;
-   bypassing authentication;
-   hardcoding test results;
-   skipping migrations;
-   replacing actual runtime checks with mocks;
-   declaring completion because the UI renders.

------------------------------------------------------------------------

## 31. V7 Implementation Priority

Mandatory default order:

``` text
1. L13 Authentication
2. L14 Customer Application Shell
3. L15 Question Bank Management
4. L16 Assessment Configuration
5. L17 Admin Content Operations
6. L18 Customer Page Completion
7. L19 Global UX/UI Hardening
8. L19A Customer Shell & Navigation Refinement
9. L19B Access & Plans / Entitlement UX Completion
10. L19C Assessment Journey UX Completion
11. L19D Admin Information Architecture Refinement
12. L19E QA User Fixtures & Scenario Matrix
13. L19F Final UX/UI Acceptance & Cross-Surface Validation
14. L20 Full Product Regression
```

Dependency model:

``` text
AUTH
 ↓
APPLICATION SHELL
 ↓
CUSTOMER EXPERIENCE

QUESTION BANK
 ↓
QUESTION VERSION
 ↓
ASSESSMENT CONFIGURATION
 ↓
ADMIN OPERATIONS

CUSTOMER + ADMIN
 ↓
L19A–L19F REFINEMENT
 ↓
FULL PRODUCT QA
```

------------------------------------------------------------------------

## 32. V7 Architectural End State

``` text
                    READY SCORE
                         │
        ┌────────────────┼────────────────┐
        │                │                │
     PUBLIC           CUSTOMER          ADMIN
        │                │                │
        │             AUTH/SESSION       │
        │                │                │
        │              /app              │
        │                │                │
        │       ┌────────┼────────┐      │
        │       │        │        │      │
        │    Results   Profile  Reports  │
        │       │                 │      │
        │   Reassessment          │      │
        │                         │      │
        └──────────────┬──────────┘      │
                       │                 │
                 COMMERCIAL             │
                       │                 │
                 ENTITLEMENT             │
                                         │
                              ┌──────────┼──────────┐
                              │          │          │
                         Question Bank Config    Review
                              │          │          │
                              └──────┬───┴──────────┘
                                     │
                               ASSESSMENT ENGINE
                                     │
                     ┌───────────────┼───────────────┐
                     │       │       │       │       │
                   RIASEC   DISC     EQ   Cognitive ...
                                     │
                              RESULT ENGINE
                                     │
                           CROSS-TEST PROFILE
```

**V7 completes the surfaces around the engine; it does not casually
rewrite the engine.**

------------------------------------------------------------------------

## 33. Final V7 Development Contract

The following rules are binding for V7:

1. V7 consists of L13–L20, with L19A–L19F as mandatory L19 refinement
   sub-phases.
2. L13 Authentication is the first implementation target.
3. L14 establishes the customer application shell.
4. L15 creates unified management for RIASEC, DISC, EQ, and Cognitive
   question banks.
5. L16 separates assessment configuration from question content.
6. L17 introduces controlled review/publish operations.
7. L18 completes customer-facing application pages.
8. L19 establishes the global UX/UI system.
9. L19A refines customer shell and navigation continuity.
10. L19B completes Access & Plans and entitlement-facing UX.
11. L19C completes the visible Pre-Test → Assessment → Result journey.
12. L19D refines the admin information architecture.
13. L19E establishes deterministic QA users and scenario states.
14. L19F performs final UX/UI acceptance before regression.
15. L20 performs complete product regression.
16. Frozen measurement semantics remain protected.
17. Historical assessment versions remain immutable.
18. Authentication, authorization, and entitlement remain separate concerns.
19. Runtime PASS requires actual runtime evidence.
20. Build PASS alone is never sufficient.
21. A failed gate means the phase is not complete.
22. Every implementation package must be delivered as a full ZIP.
23. The next replacement package identifier is **FIXED5** unless explicitly
    changed.
24. Any architectural conflict must be documented before implementation.
25. V7 must not silently expand into measurement recalibration or unrelated
    product scope.
26. L19A–L19F are refinement sub-phases, not permission to reopen protected
    measurement, scoring, result, commercial, entitlement, reassessment, or
    profiling semantics.
27. L20 cannot be declared PASS while any mandatory L19 refinement sub-phase
    remains incomplete.
28. This document is the strict development reference for V7.

## 34. V7 Roadmap Summary

| Phase | Name | Primary Deliverable |
|---|---|---|
| **L13** | Authentication & Access Completion | Register, Login, Logout, Session, Protected Routes |
| **L14** | Customer Application Shell & Dashboard UX | Production-grade `/app` |
| **L15** | Unified Question Bank Management | RIASEC / DISC / EQ / Cognitive admin workspace |
| **L16** | Assessment Administration & Instrument Configuration | Version-safe assessment configuration |
| **L17** | Admin Review & Content Operations | Review → Publish → Active lifecycle |
| **L18** | Customer Page Completion | Complete customer application surface |
| **L19** | Global UX/UI System Hardening | Product-wide UX/UI foundation |
| **L19A** | Customer Shell & Navigation Refinement | Persistent customer workspace and navigation consistency |
| **L19B** | Access & Plans / Entitlement UX Completion | Clear capability states and commercial entry points |
| **L19C** | Assessment Journey UX Completion | Pre-Test → Assessment → Result customer journey |
| **L19D** | Admin Information Architecture Refinement | Coherent admin navigation for content, users, access, integrations |
| **L19E** | QA User Fixtures & Scenario Matrix | Deterministic customer/admin regression identities and states |
| **L19F** | Final UX/UI Acceptance & Cross-Surface Validation | Final product-facing acceptance before regression |
| **L20** | Full Product Regression QA | Full public/customer/admin/institution/regression verification |

### Mandatory L19 Refinement Sequence

``` text
L19
 ↓
L19A
 ↓
L19B
 ↓
L19C
 ↓
L19D
 ↓
L19E
 ↓
L19F
 ↓
L20
```

## 35. Status

``` text
V7 SPECIFICATION
================

Status      : LOCKED DEVELOPMENT REFERENCE
Version     : V7.1.0
Date        : 2026-08-28

V6 L11      : PAID CUSTOMER E2E — PASS
V6 L12      : LAUNCH QA — BASELINE

V7 L13–L18  : COMPLETED BASELINE
V7 L19      : GLOBAL UX/UI SYSTEM HARDENING — PASS

V7 L19A     : CUSTOMER SHELL & NAVIGATION REFINEMENT — PLANNED
V7 L19B     : ACCESS & PLANS / ENTITLEMENT UX — PLANNED
V7 L19C     : ASSESSMENT JOURNEY UX — PLANNED
V7 L19D     : ADMIN INFORMATION ARCHITECTURE — PLANNED
V7 L19E     : QA USER FIXTURES & SCENARIO MATRIX — PLANNED
V7 L19F     : FINAL UX/UI ACCEPTANCE — PLANNED

V7 L20     : FULL PRODUCT REGRESSION QA — BLOCKED UNTIL L19A–L19F PASS

Measurement:
FROZEN

Commercial:
PROTECTED

Paid E2E:
PROTECTED

Cross-Test Profiling:
PROTECTED

Question Versioning:
PROTECTED

L19 Refinement:
MANDATORY BEFORE L20

Replacement:
FIXED5
```

**END OF V7 SPECIFICATION**
