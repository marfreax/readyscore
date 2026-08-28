# ReadyScore V7 --- Application Completion & Product Operations Specification

**Document:** `ReadyScore_V7_Development_Specification.md`\
**Version:** V7.0.0\
**Date:** 2026-08-27\
**Status:** **LOCKED DEVELOPMENT REFERENCE**\
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

## 14. L20 --- Full Product Regression QA

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
```

### Customer

``` text
/app
assessment
result
profile
reassessment
reports
```

### Commercial

``` text
Single Test
All Tests
All Tests + Profiling
Reassessment Credit
Upgrade
```

### Admin

``` text
Question Bank
Question Review
Assessment Configuration
Publishing
```

### Institution

``` text
/institution
/institution/[institutionId]
```

### Measurement

``` text
RIASEC
DISC
EQ
COGNITIVE
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
```

------------------------------------------------------------------------

## 15. V7 Gate Model

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

## 16. Full ZIP Development Rule

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

## 17. Database & Migration Rules

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

## 18. Security & Access Rules

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

## 19. Admin Safety Rules

Administrative UI is a control surface over assessment content.

Therefore:

1.  Never mutate historical assessment versions silently.
2.  Never delete content required for historical result reconstruction.
3.  Never alter scoring semantics from a generic question editor.
4.  Never publish incomplete configurations.
5.  Never bypass versioning because a UI flow is simpler.
6.  Preserve auditability for material content/configuration changes.

------------------------------------------------------------------------

## 20. Customer UX Rules

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

## 21. Regression Protection Matrix

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

## 22. Definition of Done

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

## 23. V7 Checkpoint Format

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

## 24. V7 Failure Policy

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

## 25. V7 Implementation Priority

Mandatory default order:

``` text
1. L13 Authentication
2. L14 Customer Application Shell
3. L15 Question Bank Management
4. L16 Assessment Configuration
5. L17 Admin Content Operations
6. L18 Customer Page Completion
7. L19 Global UX/UI Hardening
8. L20 Full Product Regression
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
FULL PRODUCT QA
```

------------------------------------------------------------------------

## 26. V7 Architectural End State

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

## 27. Final V7 Development Contract

The following rules are binding for V7:

1.  V7 consists of L13--L20.
2.  L13 Authentication is the first implementation target.
3.  L14 establishes the customer application shell.
4.  L15 creates unified management for RIASEC, DISC, EQ, and Cognitive
    question banks.
5.  L16 separates assessment configuration from question content.
6.  L17 introduces controlled review/publish operations.
7.  L18 completes customer-facing application pages.
8.  L19 standardizes global UX/UI.
9.  L20 performs complete product regression.
10. Frozen measurement semantics remain protected.
11. Historical assessment versions remain immutable.
12. Authentication, authorization, and entitlement remain separate
    concerns.
13. Runtime PASS requires actual runtime evidence.
14. Build PASS alone is never sufficient.
15. A failed gate means the phase is not complete.
16. Every implementation package must be delivered as a full ZIP.
17. The next replacement package identifier is **FIXED5** unless
    explicitly changed.
18. Any architectural conflict must be documented before implementation.
19. V7 must not silently expand into measurement recalibration or
    unrelated product scope.
20. This document is the strict development reference for V7.

------------------------------------------------------------------------

## 28. V7 Roadmap Summary

  ----------------------------------------------------------------------------------
  Phase                   Name                    Primary Deliverable
  ----------------------- ----------------------- ----------------------------------
  **L13**                 Authentication & Access Register, Login, Logout, Session,
                          Completion              Protected Routes

  **L14**                 Customer Application    Production-grade `/app`
                          Shell & Dashboard UX    

  **L15**                 Unified Question Bank   RIASEC / DISC / EQ / Cognitive
                          Management              admin workspace

  **L16**                 Assessment              Version-safe assessment
                          Administration &        configuration
                          Instrument              
                          Configuration           

  **L17**                 Admin Review & Content  Review → Publish → Active
                          Operations              lifecycle

  **L18**                 Customer Page           Complete customer application
                          Completion              surface

  **L19**                 Global UX/UI System     Consistent product-wide UI system
                          Hardening               

  **L20**                 Full Product Regression Full
                          QA                      public/customer/admin/regression
                                                  verification
  ----------------------------------------------------------------------------------

------------------------------------------------------------------------

## 29. Status

``` text
V7 SPECIFICATION
================

Status      : LOCKED DEVELOPMENT REFERENCE
Version     : V7.0.0
Date        : 2026-08-27

V6 L11      : PAID CUSTOMER E2E — PASS
V6 L12      : LAUNCH QA — BASELINE
V7 L13–L20  : NEXT DEVELOPMENT TRACK

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

Replacement:
FIXED5
```

**END OF V7 SPECIFICATION**
