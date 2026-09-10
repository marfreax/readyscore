# V13.10 FIX9 — Explicit Bulk Question Lifecycle

## Problem
The Admin Review & Publishing workspace exposed lifecycle actions only per question. This made the new V13.10 DISC/EQ/Cognitive content operationally impractical because dozens of newly imported questions would require repetitive manual clicks.

## Change
FIX9 adds an explicit admin-initiated bulk lifecycle runner. The admin can select all questions matching the current server-side search/status context and process the selected set to `PUBLISHED`.

The bulk runner does **not** bypass the existing governance path. For every question it advances only through the same underlying operations already used by the single-item UI:

`DRAFT → VALIDATED → REVIEW_REQUIRED → mapping APPROVED → APPROVED → PUBLISHED`

Questions that fail validation, duplicate detection, mapping requirements, or another lifecycle guard remain failed and are reported individually. Each successful mutation keeps its existing audit event. Publishing requires one explicit confirmation for the requested batch.

## Safety boundary
- Maximum explicit batch selection: 100 questions.
- No database migration.
- No scoring or measurement change.
- Import remains DRAFT-only.
- No automatic publishing on import.
- No silent overwrite of existing content.
- Server-side authorization remains required.
- Existing per-question actions remain available.

## Intended V13.10 use
1. Import DISC 56 / EQ 26 / Cognitive 16 as DRAFT.
2. Use Review & Publishing search to isolate the new batch.
3. Click `Select all matching`.
4. Click `Process selected → Published`.
5. Confirm once.
6. Inspect the completion summary and resolve any failed items.
7. Re-check package production eligibility.
8. Publish the package only when eligibility is READY.

## Verification status
Static source changes are prepared. Real `pnpm typecheck`, `pnpm build`, Admin UI E2E, and real DB/HTTP E2E must still be executed in the user's environment before V13.10 can be marked PASS/FROZEN.
