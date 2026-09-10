# V13.8 — Package Configuration

## Status
IMPLEMENTATION COMPLETE — UPSTREAM CONTENT AVAILABILITY REMAINS A V13.5/V13.6 BLOCKER.

V13.8 translates the frozen V13.4 production blueprint into Question Package configuration targets without changing scoring, taxonomy, or runtime selection architecture.

## Production package targets

| Test Type | Total | Timer | Composition |
|---|---:|---:|---|
| RIASEC | 60 | 1200s | R/I/A/S/E/C = 10 each |
| DISC | 80 | 1200s | TARGET_D/I/S/C = 20 each |
| EQ | 50 | 1200s | 13/13/12/12 |
| Cognitive | 40 | 1200s | 10/10/10/10 |

The package is configuration only. It does not redefine the scoring model. Runtime availability remains a V13.9 concern.

## Admin UI

The existing Question Packages workspace supports:
- create package
- select TestType
- select V2 taxonomy
- set total questions
- set timer
- define composition rules
- save draft
- inspect
- validate
- publish when configuration is valid

V13.8 adds production presets so the frozen blueprint can be loaded without manually reconstructing composition counts.

## No migration

V13.8 introduces no database migration. It uses the existing V13.1 Question Package schema and V13.2 runtime contract.

## Gate

`pnpm v13:8:gate`

The gate validates the V13.8 configuration artifact and implementation contract. It intentionally does not claim production eligibility where upstream question pools are incomplete; that belongs to V13.9.
