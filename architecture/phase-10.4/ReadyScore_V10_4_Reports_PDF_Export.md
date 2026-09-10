# ReadyScore V10.4 — Reports & PDF Export

## Core Definition
Reports are summary/document presentation of results already available.

Result = one assessment result.
Profile = cross-test evidence visualization.
Report = packaged summary/document.

## Implementation Contract
1. Reuse the existing report service and `ReportSummary`.
2. Preserve `/reports` and existing parent-report route.
3. Add a clear `Export PDF` action to the Reports workspace.
4. Export through browser/client-side print-to-PDF.
5. Print output must be branded, hierarchical, readable, A4-friendly, and avoid clipped/broken cards.
6. Export must not calculate new scores or interpretations.
7. Existing entitlement remains the source of truth.

## Prohibited
- new score calculation
- universal score
- raw-average synthesis
- interpretation changes
- diagnosis
- new cross-test mathematical synthesis
- report persistence redesign
- database migration

## Definition of Done
- V10.4 contract gate passes
- typecheck passes
- production build passes
- `/reports` remains available
- Export PDF control exists
- print CSS is present
- existing report service/contract is reused
- no prohibited mutation
