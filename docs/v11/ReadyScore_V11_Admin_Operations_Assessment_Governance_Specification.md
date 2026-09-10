# ReadyScore V11 --- Admin Operations & Assessment Governance

**Status:** SPECIFICATION / DEVELOPMENT BASELINE\
**Version:** 1.0\
**Date:** 2026-09-05\
**Parent Baseline:** V7 Final / L20 Full Product Regression QA PASS +
V9.15 Final Acceptance / Freeze + V10 Customer Workspace UX Refinement\
**Primary Focus:** Administration Surface, Assessment Governance,
Content Operations, Safety, and Customer Impact

------------------------------------------------------------------------

## 1. Purpose

V11 is the next development track for the ReadyScore Administration
Surface.

V11 is **not** merely an Admin UI completion phase. The purpose of V11
is to make Admin a controlled operational layer for managing:

1.  Question Bank;
2.  Question Groups;
3.  Question Versions;
4.  Assessment Configuration;
5.  Review and Publishing;
6.  User & Access operations;
7.  Operational health/readiness;
8.  Auditability;
9.  Customer-impact safety.

The governing principle is:

> **Admin may control what becomes available to customers, but must
> never silently rewrite what has already happened to customers.**

Historical assessment content, attempt snapshots, answers, scoring
semantics, and historical results must remain reconstructable.

------------------------------------------------------------------------

# 2. Source-of-Truth and Development Rule

The development order remains:

``` text
Reference / Product Contract
        ↓
Version / Phase Specification
        ↓
Actual Source + Database Contract
        ↓
Frozen Runtime Contract
        ↓
Implementation
        ↓
Runtime E2E
        ↓
Regression Evidence
```

If specification, source code, database, or frozen runtime behavior
conflict:

1.  stop the affected implementation;
2.  identify the conflict;
3.  classify the conflict;
4.  resolve it explicitly;
5.  document the decision;
6.  implement only after the contract is clear;
7.  regress all affected customer and Admin flows.

Build success or typecheck success alone is never sufficient for PASS.

------------------------------------------------------------------------

# 3. V11 Core Principles

## 3.1 Admin is an Operations Layer, Not Generic CRUD

Admin actions must represent controlled business operations rather than
unrestricted database mutation.

The expected lifecycle is:

``` text
CREATE
  ↓
VALIDATE
  ↓
REVIEW
  ↓
APPROVE
  ↓
VERSION
  ↓
PUBLISH
  ↓
ACTIVATE
  ↓
CUSTOMER USE
  ↓
HISTORICAL PRESERVATION
```

Not every object necessarily uses every state, but no operation may
bypass the safety boundary appropriate to that object.

------------------------------------------------------------------------

## 3.2 Historical Immutability

Never silently mutate historical assessment content.

If an existing question requires correction:

``` text
Existing Question Version
        ↓
        IMMUTABLE
        ↓
New Question Version
```

The new version may become the version used by future attempts after
normal validation/review/publishing.

Historical attempts must continue to resolve against the
content/configuration boundary under which they were created.

------------------------------------------------------------------------

## 3.3 Question ≠ Question Version

Admin must visibly distinguish:

``` text
Logical Question
        │
        ├── Version 1
        ├── Version 2
        ├── Version 3
        └── ...
```

Editing a question that already has operational/historical use must
create a new version instead of overwriting an existing version.

------------------------------------------------------------------------

## 3.4 Question Group Definition

For V11, **Question Group** has a specific operational meaning.

It is the assessment/instrument partition:

``` text
DISC
RIASEC
IQ & Cognitive
EQ
```

It is **not**:

-   domain;
-   subdomain;
-   indicator;
-   scoring dimension;
-   taxonomy;
-   question status.

Question Group is the primary operational partition of the unified
Question Bank.

Taxonomy remains inside the relevant group.

Example:

``` text
QUESTION GROUP
└── DISC
    └── Question
        ├── Question Version
        ├── Domain / Dimension
        ├── Subdomain
        ├── Indicator
        ├── Question Type
        ├── Response Model
        └── Scoring / Key Metadata
```

------------------------------------------------------------------------

## 3.5 Assessment-Specific Structure

The unified Question Bank must not force all assessments into one
identical item structure.

Different Question Groups may require different:

-   question types;
-   response models;
-   options;
-   correct-answer/key metadata;
-   dimension mappings;
-   scoring metadata;
-   difficulty metadata;
-   stimulus structures;
-   image/media references;
-   validation rules.

Examples of potential item formats include:

-   Likert/self-report;
-   single choice;
-   forced choice;
-   scenario;
-   image choice;
-   pattern;
-   numerical;
-   text stimulus.

The final permitted types and fields must follow the instrument audit /
measurement contract, not UI convenience.

------------------------------------------------------------------------

## 3.6 Version Boundaries Must Be Explicit

The canonical operational relationship remains:

``` text
QUESTION GROUP
      ↓
QUESTION
      ↓
QUESTION VERSION
      ↓
ASSESSMENT CONFIGURATION VERSION
      ↓
SELECTION
      ↓
ATTEMPT
      ↓
RESULT
```

Changing the currently active configuration must not rewrite an
already-created attempt.

------------------------------------------------------------------------

## 3.7 Measurement Semantics Are Not Generic Admin Settings

Admin Question Bank and Configuration tools must not provide generic
controls that accidentally alter:

-   scoring semantics;
-   dimension interpretation;
-   profile construction;
-   classification logic;
-   universal score;
-   raw-average synthesis;
-   psychometric meaning.

Any material measurement change must be explicitly versioned, reviewed,
tested, and governed by the appropriate instrument specification.

------------------------------------------------------------------------

# 4. V11 Scope

## 4.1 In Scope

### A. Question Bank Operations

-   Question Group navigation;
-   search/filter;
-   inspect;
-   create;
-   edit through versioning;
-   duplicate;
-   import/upload;
-   template download;
-   import preview;
-   validation;
-   bulk operations where safe;
-   lifecycle operations;
-   version history;
-   mapping inspection.

### B. Assessment Configuration

-   configuration creation;
-   configuration versioning;
-   question-group linkage;
-   question selection constraints;
-   readiness/health validation;
-   activation/archive controls;
-   impact preview.

### C. Review & Publishing

-   validation;
-   review;
-   approval;
-   publishing;
-   activation;
-   archive/replacement safety;
-   audit trail;
-   clear ownership of lifecycle actions.

### D. Users & Access

-   user directory;
-   user status/inactive semantics;
-   role operations where explicitly authorized;
-   safe access administration;
-   audit trail;
-   preservation of historical customer records.

### E. Admin Health / Operations

-   active configuration visibility;
-   question coverage;
-   incomplete mapping;
-   unpublished content;
-   broken configuration;
-   readiness status;
-   recent operational events;
-   actionable warnings.

### F. Customer Impact Safety

Every material Admin operation must be evaluated for its customer
impact.

------------------------------------------------------------------------

## 4.2 Out of Scope Unless Explicitly Authorized

V11 must not silently expand into:

-   redesign of measurement instruments;
-   scoring algorithm changes;
-   psychometric calibration;
-   universal ReadyScore;
-   raw-average synthesis across assessments;
-   entitlement business logic;
-   pricing;
-   Scalev commercial logic;
-   customer result semantics;
-   historical result recalculation;
-   replacing the frozen customer UX architecture;
-   unrelated CRM or marketing functionality.

If an Admin requirement requires any of these, it must become an
explicit architectural/specification decision rather than being hidden
inside V11 implementation.

------------------------------------------------------------------------

# 5. Question Bank Specification

## 5.1 Primary Navigation

The Admin Question Bank should support:

``` text
Question Bank
├── All
├── DISC
├── RIASEC
├── IQ & Cognitive
└── EQ
```

The selected group determines the relevant item schema and validation
rules.

------------------------------------------------------------------------

## 5.2 Group-Level Actions

Each Question Group should expose:

-   question count;
-   published count;
-   active/usable count;
-   draft/review count;
-   validation errors;
-   mapping errors;
-   import/upload;
-   template download;
-   readiness/health;
-   recent changes.

Example:

``` text
DISC
Questions: 120
Published: 112
Needs Review: 5
Validation Errors: 3

[View Questions]
[Upload]
[Download Template]
[View Health]
```

------------------------------------------------------------------------

## 5.3 Upload Workflow

The upload workflow must not directly publish imported content.

Required flow:

``` text
Select Group
    ↓
Download Group Template
    ↓
Upload File
    ↓
Parse
    ↓
Preview
    ↓
Schema Validation
    ↓
Content Validation
    ↓
Duplicate Detection
    ↓
Taxonomy / Mapping Validation
    ↓
Import
    ↓
Draft / Review State
    ↓
Approve
    ↓
Publish
    ↓
Activate
```

Import errors must identify:

-   row;
-   field;
-   reason;
-   severity;
-   suggested correction where appropriate.

A failed import must not partially corrupt the existing active Question
Bank.

------------------------------------------------------------------------

## 5.4 Group-Specific Templates

There should not be one universal template if doing so would flatten
legitimate instrument differences.

Minimum requirement:

``` text
DISC_template
RIASEC_template
IQ_Cognitive_template
EQ_template
```

The exact columns are defined from the final instrument contract.

Template generation/download must use the same canonical schema used by
the importer so that documentation and runtime validation do not
diverge.

------------------------------------------------------------------------

## 5.5 Create/Edit

The current generic create form is insufficient as the long-term V11
model because it assumes a predominantly Likert-5 structure.

V11 must support assessment-specific metadata without making the Admin
operator edit raw database structures.

The UI should present:

``` text
Question Group
Question Type
Response Model
Question Content
Taxonomy / Dimension Mapping
Answer / Key Metadata
Scoring Metadata (where permitted)
Media / Stimulus (where applicable)
Difficulty (where applicable)
Version / Lifecycle
```

Measurement-sensitive fields must be governed by validation and
appropriate permissions.

------------------------------------------------------------------------

# 6. Review & Publishing Governance

## 6.1 Canonical Ownership

V11 must remove ambiguity between:

-   Question Bank lifecycle actions;
-   Review lifecycle actions.

The UI may expose shortcuts, but the underlying lifecycle must have one
canonical state transition model.

Example:

``` text
Question Bank
  → content management

Review
  → validation / review / approval

Publishing
  → production eligibility

Activation
  → current customer-facing operational version
```

The exact state model must remain compatible with the frozen runtime
contract.

------------------------------------------------------------------------

## 6.2 Required Protections

The system must block:

-   publishing incomplete questions;
-   publishing invalid mappings;
-   publishing duplicate content where duplicates are prohibited;
-   bypassing required review;
-   destructive archive of content required for historical
    reconstruction;
-   overwriting historical versions;
-   activation of invalid configuration;
-   changes that silently affect historical attempts.

------------------------------------------------------------------------

## 6.3 Audit Trail

Every material operation must produce an immutable audit event.

At minimum:

-   actor;
-   timestamp;
-   object;
-   object version;
-   action;
-   previous state;
-   new state;
-   reason where required;
-   relevant change summary.

The existing `AdminContentAuditEvent` pattern should be extended rather
than replaced where appropriate.

------------------------------------------------------------------------

# 7. Assessment Configuration Governance

## 7.1 Configuration Must Be Inspectable

Admin should be able to inspect the effective configuration as a
coherent object rather than only seeing independent fields.

The inspection view should make clear:

``` text
Assessment
├── Active Configuration
├── Question Group
├── Question Source
├── Selection Rules
├── Coverage / Constraints
├── Scoring Contract
├── Result Contract
└── Readiness
```

Internal implementation IDs may be shown to technical operators only
where necessary, but should not become customer-facing terminology.

------------------------------------------------------------------------

## 7.2 Assessment Health / Readiness

Before activation, the configuration should be evaluated.

Suggested checks:

-   required question count available;
-   sufficient eligible questions;
-   required dimensions/domains covered;
-   mappings complete;
-   required metadata complete;
-   duplicates handled;
-   compatible question types;
-   selection rules valid;
-   scoring contract available;
-   result contract available;
-   no known historical-safety violation;
-   required runtime checks passed.

Example:

``` text
DISC — Readiness

✓ Question inventory
✓ Dimension mapping
✓ Selection rules
✓ Scoring contract
✓ Result contract
✓ Review approval
⚠ 3 questions still unpublished

STATUS: NOT READY
```

Activation must be blocked when required checks fail.

------------------------------------------------------------------------

# 8. Impact Preview

A material Admin change should provide an impact preview before
execution.

Example:

``` text
CHANGE IMPACT

Object:
DISC Question Q-102

Change:
Create Question Version 4

Current use:
✓ Active configuration
✓ Available for future attempts
✓ Historical attempts exist

Historical impact:
NONE

Future customer impact:
New attempts may use Version 4
after publication/activation.

Scoring impact:
No

Requires review:
YES

Requires regression:
YES
```

The purpose is to make the safety boundary explicit before an operator
confirms a change.

------------------------------------------------------------------------

# 9. Users & Access

## 9.1 Current Gap

The existing Users & Access surface is primarily a read-only directory.

V11 may extend it into operational administration, but only with
explicit semantics.

------------------------------------------------------------------------

## 9.2 User Status

If user deactivation is introduced, prefer a non-destructive state such
as:

``` text
ACTIVE
INACTIVE / SUSPENDED
```

rather than hard deletion.

Historical:

-   attempts;
-   answers;
-   results;
-   purchases;
-   entitlements;
-   institution relationships

must remain reconstructable.

------------------------------------------------------------------------

## 9.3 Access Boundary

Changing user status or role must not silently mutate:

-   entitlement history;
-   purchase history;
-   assessment results;
-   historical attempts.

Authentication, authorization, and entitlement remain separate concerns.

------------------------------------------------------------------------

## 9.4 Audit

Material user administration should be auditable, especially:

-   role change;
-   status change;
-   access-related administrative action.

------------------------------------------------------------------------

# 10. Admin Dashboard / Operations Health

The Admin overview should evolve from simple counts toward operational
visibility.

Recommended sections:

``` text
ADMIN OVERVIEW

Assessment Health
├── DISC
├── RIASEC
├── IQ & Cognitive
└── EQ

Content Health
├── Draft
├── Needs Review
├── Validation Errors
├── Unpublished
└── Active

Configuration Health
├── Ready
├── Warning
└── Blocked

Recent Admin Activity
└── Audit events
```

The dashboard should prioritize items requiring action rather than
merely displaying database totals.

------------------------------------------------------------------------

# 11. Customer-Side Impact Contract

Every V11 phase must include customer regression where the change can
affect customer behavior.

## 11.1 Assessment Catalog / Overview

Admin changes to:

-   assessment name;
-   description;
-   question count;
-   duration;
-   availability;
-   active configuration

must not produce stale or contradictory customer information.

Canonical configuration data should be preferred over duplicated
hardcoded values where practical.

------------------------------------------------------------------------

## 11.2 About / Pre-Test

Customer-facing assessment information must remain consistent with the
effective assessment configuration.

Internal terms must not leak to customers, including:

-   QuestionVersion ID;
-   ScoringVersion;
-   SelectionAlgorithmVersion;
-   AttemptSeed;
-   database IDs.

Use customer language such as:

-   Your assessment;
-   Your result;
-   Your profile.

------------------------------------------------------------------------

## 11.3 Assessment Runtime

Activation of a new version should affect future eligible attempts
according to the configuration boundary.

It must not rewrite an in-progress or historical attempt.

Required regression:

``` text
Start attempt using Version A
        ↓
Activate Version B
        ↓
Continue Version A attempt
        ↓
Submit
        ↓
Result remains internally consistent with Version A
```

------------------------------------------------------------------------

## 11.4 Results

Historical customer results must not change merely because Admin
changes:

-   current questions;
-   current configuration;
-   current interpretation;
-   current active version.

A new interpretation or content version must not silently recalculate
historical results.

------------------------------------------------------------------------

## 11.5 Profile / Cross-Assessment

V11 must preserve the existing separation between assessment results.

Do not introduce:

``` text
DISC + RIASEC + EQ + IQ
        ↓
Universal score
```

or raw-average synthesis merely because Admin needs a convenient
aggregate.

Any cross-assessment presentation must continue to use the approved
result/profile contract.

------------------------------------------------------------------------

## 11.6 Reports / PDF

Historical reports must preserve the historical result semantics.

Admin changes to current content/configuration must not retroactively
alter an already-created result.

Report generation remains a presentation concern unless an explicit
future specification says otherwise.

------------------------------------------------------------------------

## 11.7 Access & Plans

Admin activation must not bypass customer entitlement.

The following remain separate:

``` text
Authentication
Authorization
Entitlement
Assessment Configuration
Question Bank
```

A configuration being active does not automatically mean every customer
is entitled to use it.

------------------------------------------------------------------------

# 12. V11 Development Phases

## V11.0 --- Admin Architecture & Safety Contract

### Objective

Establish the canonical Admin operational model before feature
expansion.

### Work

-   freeze Question Group definition;
-   define lifecycle/state transitions;
-   define Question vs Question Version behavior;
-   define configuration/version relationship;
-   define audit requirements;
-   define impact-preview contract;
-   define activation safety;
-   define customer-impact regression matrix.

### Gate

-   specification contract approved;
-   no unresolved lifecycle ambiguity;
-   no historical-safety gap in architecture.

------------------------------------------------------------------------

## V11.1 --- Question Bank Operations

### Objective

Complete the unified Question Bank as an operational content system.

### Work

-   Question Group navigation;
-   group-specific filtering;
-   assessment-specific create/edit;
-   version history;
-   duplicate;
-   import/upload;
-   group-specific templates;
-   preview and validation;
-   duplicate detection;
-   mapping validation;
-   safe bulk operations;
-   lifecycle controls.

### Customer Regression

-   assessment catalog;
-   pre-test information;
-   new attempt;
-   in-progress attempt;
-   result integrity;
-   historical result integrity.

### Gate

-   typecheck;
-   build;
-   Admin runtime E2E;
-   upload/import E2E;
-   versioning E2E;
-   customer regression.

------------------------------------------------------------------------

## V11.2 --- Assessment Configuration Governance

### Objective

Turn Assessment Configuration into a controlled, inspectable
configuration system.

### Work

-   configuration version inspection;
-   question-group linkage;
-   selection constraints;
-   coverage validation;
-   readiness/health;
-   activation protection;
-   archive/replacement protection;
-   impact preview.

### Customer Regression

-   assessment availability;
-   start behavior;
-   in-progress attempt preservation;
-   result integrity;
-   entitlement boundary.

### Gate

No configuration may become active when required readiness checks fail.

------------------------------------------------------------------------

## V11.3 --- Review & Publishing Governance

### Objective

Consolidate lifecycle governance and remove duplicated/ambiguous
controls.

### Work

-   canonical lifecycle;
-   review queue;
-   validation;
-   approval;
-   publishing;
-   activation;
-   archive/replacement;
-   audit trail;
-   permissions;
-   confirmation for high-impact operations.

### Customer Regression

-   only approved/published content becomes customer-eligible;
-   no historical mutation;
-   no unexpected assessment availability changes;
-   result regression.

------------------------------------------------------------------------

## V11.4 --- Admin Operations Dashboard

### Objective

Make Admin capable of detecting operational problems before customers
encounter them.

### Work

-   assessment health;
-   content health;
-   configuration readiness;
-   broken mappings;
-   incomplete content;
-   recent audit events;
-   actionable warnings.

### Gate

Dashboard indicators must derive from canonical operational state, not
duplicated manually maintained counters.

------------------------------------------------------------------------

## V11.5 --- Users & Access Operations

### Objective

Move Users & Access from passive directory toward safe administration
where required.

### Work

-   define ACTIVE / INACTIVE semantics;
-   safe role administration if required;
-   access-related actions;
-   audit;
-   confirmation;
-   historical-data preservation.

### Customer Regression

-   login;
-   authorization;
-   assessment access;
-   entitlement;
-   existing results;
-   existing attempts.

### Gate

No user administration action may destroy or rewrite historical
assessment data.

------------------------------------------------------------------------

## V11.6 --- Full Admin + Customer Regression

### Objective

Validate V11 as an integrated system.

### Admin Regression

``` text
Admin Login
    ↓
Dashboard
    ↓
Question Group
    ↓
Question CRUD / Version
    ↓
Upload / Import
    ↓
Validation
    ↓
Review
    ↓
Approval
    ↓
Publish
    ↓
Activate
    ↓
Configuration
    ↓
Readiness
    ↓
User / Access Operations
    ↓
Audit
```

### Customer Regression

``` text
Login
 ↓
Overview
 ↓
Assessments
 ↓
About / Pre-Test
 ↓
Start
 ↓
Answer
 ↓
Persistence / Reload
 ↓
Submit
 ↓
Result
 ↓
Profile
 ↓
Activity
 ↓
Access & Plans
 ↓
Report / PDF
```

### Historical Safety Regression

At minimum:

1.  create historical attempt;
2.  create new Question Version;
3.  change configuration;
4.  activate new version;
5.  complete historical/in-progress attempt;
6.  verify historical result;
7.  verify report;
8.  verify no unauthorized entitlement mutation.

### Gate

V11 PASS requires:

-   static/contract gates;
-   typecheck;
-   production build;
-   actual runtime E2E;
-   Admin regression;
-   customer regression;
-   historical-safety regression;
-   audit verification.

------------------------------------------------------------------------

# 13. Change Impact Matrix

  ------------------------------------------------------------------------------
  Admin Change   New Customers   In-Progress    Historical        Regression
                                 Attempt        Attempt/Result    
  -------------- --------------- -------------- ----------------- --------------
  New Question   May affect      Must not       Must not change   Required
  Version        future          silently                         
                 selection       change                           

  Edit existing  New version     Must preserve  Must preserve     Required
  used question  only            snapshot       history           

  Publish        May make        Depends on     No change         Required
  question       content         selection                        
                 eligible        boundary                         

  Activate new   May affect      Existing       No change         Required
  config         future attempts attempt                          
                                 preserved                        

  Archive unused Usually none    None           None              Targeted
  draft                                                           

  Archive        Must protect    Must preserve  Must remain       Mandatory
  historically   replacement     history        reconstructable   
  used content                                                    

  Change         May affect      Must preserve  Must preserve     Required
  taxonomy       future          current        historical        
  mapping        selection       attempt        interpretation    

  Change user    Access may      Must define    Historical data   Required
  status         change          behavior       preserved         
                                 explicitly                       

  Change role    Authorization   Assessment     Historical data   Required
                 may change      data preserved preserved         
  ------------------------------------------------------------------------------

------------------------------------------------------------------------

# 14. Security and Operational Requirements

Every Admin mutation must:

-   require Admin authorization;
-   validate server-side;
-   not rely solely on client-side restrictions;
-   be protected against unauthorized direct API calls;
-   use transactional behavior where multiple records must change
    together;
-   handle duplicate/concurrent operations safely;
-   provide explicit confirmation for high-impact operations;
-   preserve auditability.

Import operations must be atomic or otherwise guarantee that a failed
batch cannot leave the active Question Bank in an inconsistent state.

------------------------------------------------------------------------

# 15. UX Requirements for Admin

Admin UX should optimize for:

1.  safety;
2.  clarity;
3.  operational speed;
4.  traceability.

High-risk actions should communicate:

-   what will change;
-   what will not change;
-   who will be affected;
-   whether historical attempts are affected;
-   whether a new version is created;
-   whether review is required;
-   whether regression is required.

Avoid presenting destructive operations as ordinary CRUD buttons.

------------------------------------------------------------------------

# 16. Technical/Data Principles

V11 should prefer the existing architecture where it already satisfies
the contract.

Do not introduce a new Prisma migration merely because the Admin UI can
be made more convenient.

A schema migration is justified only when the operational contract
cannot be represented safely by the existing data model.

Potential schema changes may be required for capabilities such as:

-   persistent user status;
-   additional audit metadata;
-   first-class Question Group representation if the existing model
    cannot safely represent it;
-   assessment-specific question metadata if the existing model is
    insufficient.

Any migration must be separately justified, reviewed, migrated safely,
and regression-tested.

------------------------------------------------------------------------

# 17. Definition of Done

V11 is complete only when:

### Architecture

-   [ ] Question Group definition is frozen.
-   [ ] Lifecycle ownership is unambiguous.
-   [ ] Question / Question Version distinction is explicit.
-   [ ] Configuration/version boundaries are explicit.
-   [ ] Customer-impact rules are documented.

### Question Bank

-   [ ] DISC available as group.
-   [ ] RIASEC available as group.
-   [ ] IQ & Cognitive available as group.
-   [ ] EQ available as group.
-   [ ] Group-specific templates exist.
-   [ ] Upload/import has preview and validation.
-   [ ] Assessment-specific item structures are supported.
-   [ ] Historical versions remain immutable.

### Configuration

-   [ ] Configuration inspection works.
-   [ ] Readiness checks work.
-   [ ] Activation protection works.
-   [ ] Impact preview works.

### Review

-   [ ] Canonical lifecycle is enforced.
-   [ ] Approval/publishing protection works.
-   [ ] Audit trail works.
-   [ ] High-impact actions require appropriate confirmation.

### Users & Access

-   [ ] User status semantics are defined if implemented.
-   [ ] Role/access changes are authorized and auditable.
-   [ ] Historical data is preserved.

### Customer

-   [ ] Catalog remains consistent.
-   [ ] Pre-test information remains consistent.
-   [ ] In-progress attempts remain safe.
-   [ ] Historical results remain unchanged.
-   [ ] Profile behavior remains unchanged unless explicitly specified.
-   [ ] Reports remain historically consistent.
-   [ ] Entitlement boundary remains intact.

### Regression

-   [ ] Static gates pass.
-   [ ] Typecheck passes.
-   [ ] Production build passes.
-   [ ] Admin runtime E2E passes.
-   [ ] Customer runtime E2E passes.
-   [ ] Historical-safety E2E passes.
-   [ ] Full regression evidence is recorded.

------------------------------------------------------------------------

# 18. Final V11 Rule

The central rule of V11 is:

> **Admin controls future operational state; it does not rewrite
> historical customer reality.**

Therefore:

``` text
NEW CONTENT
    ↓
VERSION
    ↓
VALIDATE
    ↓
REVIEW
    ↓
APPROVE
    ↓
PUBLISH
    ↓
ACTIVATE
    ↓
FUTURE CUSTOMER USE

while

HISTORICAL ATTEMPT
    ↓
HISTORICAL CONTENT
    ↓
HISTORICAL RESULT
    ↓
IMMUTABLE / RECONSTRUCTABLE
```

V11 should make this boundary visible, enforceable, auditable, and
testable.

------------------------------------------------------------------------

# 19. Development Sequence Summary

``` text
V11.0
Admin Architecture & Safety Contract
        ↓
V11.1
Question Bank Operations
        ↓
V11.2
Assessment Configuration Governance
        ↓
V11.3
Review & Publishing Governance
        ↓
V11.4
Admin Operations Dashboard
        ↓
V11.5
Users & Access Operations
        ↓
V11.6
Full Admin + Customer Regression
```

**Recommended implementation priority:** V11.0 → V11.1 → V11.2 → V11.3 →
V11.4 → V11.5 → V11.6.

No later phase should be used to bypass an unresolved safety or contract
issue from an earlier phase.
