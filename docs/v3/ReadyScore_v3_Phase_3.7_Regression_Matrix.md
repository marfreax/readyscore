# ReadyScore v3 — Phase 3.7 Regression Matrix

| ID | Case | Expected |
|---|---|---|
| D01 | RIASEC-only profile | Partial/limited direction evidence; no fabricated ability/strength |
| D02 | Full multi-test profile | Primary/supporting evidence combined according to catalog |
| D03 | Missing primary evidence | Strong evidence claim blocked |
| D04 | Conflicting evidence | Tension surfaced |
| D05 | Unknown test type | Zero synthetic signals |
| D06 | Universal average attempt | Rejected / prohibited |
| D07 | Raw answer supplied to engine | Rejected by service boundary |
| D08 | Direction without rationale | Rejected |
| D09 | Major-specific rule in Phase 3.7 | Rejected / out of scope |
| D10 | Career-specific rule in Phase 3.7 | Rejected / out of scope |
| D11 | Catalog version changes | Historical result remains reproducible |
| D12 | Profile version changes | Result provenance remains traceable |
| D13 | F.10-C.2-F RIASEC E2E | PASS |
| D14 | Cross-Test Profile gate | PASS |
| D15 | Typecheck | PASS |
| D16 | Build | PASS |

## Frozen minimum protection

```text
pnpm e2e:riasec
pnpm profile:gate
```

## Phase 3.7 gate

```text
pnpm direction:gate
```

The gate must validate contract semantics, evidence governance, no-average invariant, missing-evidence behavior, and explainability.
