# V13.10 FIX6 — Admin UI New Version Production Preset

## Issue
The Question Packages “New version” form did not carry the selected package's `testTypeId` into the local form state. The Production Preset button is intentionally disabled when `testTypeId` is empty, so New Version could not load the production preset and the Taxonomy Version remained blank.

## Fix
`components/admin/QuestionPackageWorkspace.tsx` now initializes `form.testTypeId` from `p.testType.id` in `openVersion(p)`. This enables the existing Production Preset flow for an existing package version.

## Scope
No changes to measurement, scoring, database schema/migrations, question selection, package eligibility rules, runtime assessment behavior, timer enforcement, or result behavior.
