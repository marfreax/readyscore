# ReadyScore V7 L19D — Admin Information Architecture Refinement

**Status:** Implementation package
**Database Migration:** NO
**Scope:** Admin navigation and operational information architecture

## Objective

Make the administration surface understandable as an operational product rather than a collection of unrelated engineering pages.

## Canonical information architecture

```text
ADMIN
│
├── Overview
│
├── CONTENT
│   ├── Question Bank
│   ├── Review & Publishing
│   └── Assessment Configuration
│
├── USERS & ACCESS
│   └── Users & Access
│
└── INTEGRATIONS
    └── Integrations
```

A Settings area is intentionally omitted because the current model does not expose a real global/admin settings domain.

## Implementation

### Admin shell

A shared `AdminShell` now provides:

- one persistent admin header;
- one primary sidebar on desktop;
- collapsible navigation on mobile;
- active navigation state;
- Customer App escape route;
- protected admin context;
- grouped operational navigation.

### Content

Existing L15–L17 capabilities remain discoverable:

- Question Bank;
- Review & Publishing;
- Assessment Configuration.

The specialized RIASEC Human Review route remains available and is now explicitly protected by the admin authorization boundary.

### Users & Access

`/admin/users` provides an administrative directory over the existing data model:

- user identity;
- role;
- account existence;
- concrete active entitlement count;
- assessment activity count;
- add-on entitlement count;
- reassessment credit count;
- institution membership count;
- creation date.

No new user-status/suspension semantics are invented because the current `User` model does not contain such a field.

### Integrations

`/admin/integrations` provides operational visibility for the existing Scalev boundary:

- webhook configuration state without exposing secrets;
- webhook event counts;
- processed/failed/received counts;
- purchase and add-on purchase counts;
- handoff count;
- explicit statement of the existing commerce boundary.

No credential value is rendered.

## Safety

L19D does not:

- change measurement semantics;
- change scoring semantics;
- change result semantics;
- change commercial semantics;
- change entitlement semantics;
- change reassessment semantics;
- change profiling semantics;
- create a universal score;
- alter historical question/version behavior;
- introduce a database migration.

The IA is a presentation and discoverability layer over existing capabilities.

## Acceptance

1. Admin navigation is grouped by operational responsibility.
2. Content management is discoverable.
3. User/access management has a defined location.
4. Integrations have a defined location.
5. Settings is omitted when no real setting exists.
6. All admin surfaces retain admin authorization.
7. Historical content/version safety remains intact.
8. Existing specialized RIASEC review remains accessible and protected.
9. No database migration is introduced.
10. Runtime E2E verifies the admin shell and all canonical destinations.

## Validation

```text
Typecheck
Build
Static / Contract Gate
Actual Runtime E2E
```

**DATABASE MIGRATION: NO**

## Checkpoint

```text
V7 L19D — ADMIN INFORMATION ARCHITECTURE REFINEMENT

Implementation:
PASS

Typecheck:
PASS when local validation is run

Build:
PASS when local validation is run

Contract Gate:
PASS when local validation is run

Database Migration:
NO

Actual Runtime E2E:
PASS when local validation is run

Frozen Regression:
Protected / unchanged

Measurement Semantics:
NO MUTATION

Commercial Semantics:
NO MUTATION
```
