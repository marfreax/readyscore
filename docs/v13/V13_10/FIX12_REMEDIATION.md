# V13.10 FIX12 — Real E2E / Taxonomy Type Remediation

## Fixes
- Complete `AdminQuestion` taxonomy-node fields in all repository return paths so TypeScript remains aligned with FIX10 observability.
- Resolve taxonomy-node display data for non-paginated admin question reads and single-question inspection as well as the paginated Question Bank path.
- Fix the V13.10 static gate reference to use the loaded Question Bank UI source (`questionUi`) instead of an undefined variable.
- Fix production E2E measurement assertions to inspect the canonical assessment-specific persisted payload (`riasec.measurement`, `disc.measurement`, `eq.measurement`, `cognitive.measurement`) rather than requiring a nonexistent top-level `measurement`.

## Protected
No database schema, migration, measurement implementation, scoring implementation, package runtime, selection, randomization, timer, or customer UI behavior was changed.
