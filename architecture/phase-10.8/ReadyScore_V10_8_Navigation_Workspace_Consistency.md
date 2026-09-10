# ReadyScore V10.8 — Navigation & Workspace Consistency

## Objective
Combine V10 customer surfaces into one consistent mental model.

## Primary navigation
WORKSPACE
- Overview
- Assessments
- Results
- My Profile
- Activity

ACCOUNT
- Access & Plans

Reports is not a primary sidebar destination. It remains an existing route and is discoverable from Results and My Profile.

## Route preservation
Existing customer routes remain intact:
- /app
- /access
- /assessments
- /profile
- /reports
- /results
- /activity
- /result/[attemptId]
- /reassessment/[type]

## Safety
Presentation-only. Existing services, entitlement logic, assessment runtime, result semantics, and persistence remain source of truth.

## Definition of Done
- Navigation labels and grouping match V10 IA.
- Reports remains discoverable without becoming a primary sidebar destination.
- Existing routes are preserved.
- No prohibited mutation.
- Typecheck/build/runtime evidence required for acceptance.
