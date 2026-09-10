# ReadyScore V10.11-PATCH.3 — Reports Attempt Grouping

## Objective
Make the Reports workspace unambiguous about the difference between assessment types and completed attempts.

## Contract
- `Assessment tercatat` = all attempts returned by the existing report overview.
- `Hasil selesai` = completed attempts that already have a result payload.
- Results are displayed grouped by assessment type, with every result-bearing completed attempt preserved.
- In-progress attempts are shown separately and are not counted as completed results.
- `REPORT_ACCESS` continues to gate Parent View and PDF export.
- `Open result` continues to open the existing individual result route.

## Explicit Non-Goals
- No database migration.
- No changes to report engine semantics.
- No changes to scoring or measurement.
- No changes to entitlement logic.
- No universal score or cross-test averaging.
- No historical content mutation.
