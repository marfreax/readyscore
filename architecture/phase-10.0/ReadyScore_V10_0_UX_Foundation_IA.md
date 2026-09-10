# ReadyScore V10.0 — UX Foundation & Information Architecture

**Version:** V10.0
**Status:** IMPLEMENTATION CONTRACT
**Parent Baseline:** ReadyScore V9.15 Final Acceptance / Freeze
**Scope:** UX foundation, information architecture, navigation responsibility, page roles, CTA/state rules, and V9.15 preservation boundary

---

## 1. Objective

V10.0 is the foundation phase for the V10 Customer Workspace UX Refinement.

This phase **locks the information architecture and UX boundaries before any visual/page implementation begins**.

V10.0 is documentation/contract-first. It does not introduce customer-facing feature behavior.

---

## 2. Protected Baseline

V10.0 is based on the V9.15 frozen baseline.

Required baseline boundary:

```text
V9.15 FROZEN BASELINE
        ↓
V10.0 UX FOUNDATION & IA
```

V9.15 remains the source of truth for:

- authentication
- authorization
- assessment runtime
- answer persistence
- scoring
- result semantics
- profile evidence
- entitlement
- commercial/Scalev checkout boundary
- historical assessment content

---

## 3. V10.0 Scope

V10.0 defines:

1. customer workspace information architecture
2. page responsibility
3. primary navigation grouping
4. CTA hierarchy
5. assessment status presentation model
6. Results vs Profile vs Reports boundary
7. Access & Plans information hierarchy
8. Activity mental model
9. responsive/accessibility principles to be carried into implementation phases
10. V9.15 preservation rules

---

## 4. Customer Workspace IA

Recommended primary navigation:

```text
WORKSPACE

Overview
Assessments
Results
My Profile
Activity

----------------

ACCOUNT

Access & Plans
```

Reports remain a report/document output surface and do not need to become a primary sidebar destination.

Recommended discovery:

```text
Results
   ↓
Report / Summary
   ↓
Export PDF
```

and:

```text
My Profile
   ↓
Profile Summary / Report
   ↓
Export PDF
```

Existing `/reports` route may remain intact. V10.0 does not authorize route deletion.

---

## 5. Page Responsibility Matrix

| Page | Primary Responsibility | Must Not Become |
|---|---|---|
| Overview | Current state + next action | Full catalog/history duplicate |
| Assessments | What user can/should do | Generic marketing catalog only |
| Results | Individual assessment results | Cross-test score calculator |
| My Profile | Cross-test evidence visualization | Universal score |
| Reports | Summary/document output | New scoring engine |
| Activity | Journey timeline + next action | New event analytics platform |
| Access & Plans | Current access + options to get more | New entitlement engine |

---

## 6. Core UX Mental Model

```text
OVERVIEW
"What is happening with me?"

        ↓

ASSESSMENTS
"What can I do?"

        ↓

RESULTS
"What did I get?"

        ↓

MY PROFILE
"What does the bigger picture look like?"

        ↓

REPORTS
"How can I see/save the summary?"

        ↓

ACTIVITY
"What have I done and what should I continue?"

        ↓

ACCESS & PLANS
"What do I have and what can I get?"
```

---

## 7. CTA Rules

CTA must reflect existing application state.

| State | Primary CTA |
|---|---|
| Available assessment | Start |
| In-progress assessment | Continue |
| Completed assessment | View result |
| Locked/unavailable assessment | Get access |
| Available report | View report / Export PDF |
| Current plan | View current access |
| Upgrade option | Get access / Upgrade |

CTA presentation must not create entitlement or bypass authorization.

---

## 8. Results / Profile / Reports Boundary

### Results

One assessment result at a time.

### My Profile

Cross-test evidence already supported by the existing profile engine.

### Reports

Presentation/document summary of existing result/profile information.

The three surfaces must not silently converge into a new scoring or synthesis layer.

---

## 9. Profile Visualization Boundary

The V10 profile spider/radar visualization is an evidence visualization.

It is **not** a universal score.

If a domain has no evidence:

```text
No evidence / Not available
```

It must not be represented as a measured score of `0` merely because the assessment is incomplete.

A textual equivalent is required for accessibility.

---

## 10. Assessment Workspace Boundary

The assessment workspace may present:

- available
- in progress
- completed
- locked/unavailable

Locked assessments may be visible for discovery and conversion.

The existing entitlement logic remains authoritative.

Purchase continues through the existing commercial/Scalev boundary.

No new checkout contract is introduced by V10.0.

---

## 11. Activity Boundary

Activity is defined as:

> timeline perjalanan user + next action

The V10.0 IA does not introduce:

- a new event model
- a new activity database model
- a new analytics platform
- a new ingestion architecture

---

## 12. Access & Plans Boundary

Required information hierarchy:

```text
Current Access
      ↓
Included Capabilities
      ↓
Assessment Access
      ↓
Get More / Upgrade
      ↓
Purchase Boundary
```

Existing pricing, package, entitlement, and checkout rules remain unchanged.

---

## 13. Existing Route Preservation

V10.0 must preserve existing route contracts, including:

```text
/app
/access
/assessments
/assessments/[type]
/assessments/[type]/pre-test
/activity
/profile
/reports
/result/[attemptId]
/reassessment/[type]
```

Changing navigation discovery in later V10 phases does not imply deleting these routes.

---

## 14. Explicit Non-Goals

V10.0 does not implement:

- new database schema
- migration
- scoring changes
- measurement changes
- question bank changes
- result semantics changes
- entitlement changes
- authentication changes
- assessment runtime changes
- historical data changes
- universal score
- raw-average synthesis
- new cross-test mathematical synthesis

---

## 15. Acceptance Criteria

V10.0 is complete when:

- this IA contract is present
- the master V10 specification is present
- package registration for the V10.0 gate exists
- protected V9.15 sources remain present
- no V10.0 database migration is introduced
- no prohibited measurement/scoring/question-bank/result/entitlement mutation is introduced by the phase
- page responsibility is explicit
- Results/Profile/Reports boundaries are explicit
- navigation grouping is explicit
- CTA/state rules are explicit
- route preservation is explicit

This phase is accepted by contract validation. Full runtime acceptance belongs to the later V10 regression/freeze phases.
