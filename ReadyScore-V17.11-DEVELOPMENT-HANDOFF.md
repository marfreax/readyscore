# ReadyScore V17.11 — DEVELOPMENT HANDOFF

## Baseline

Based on `AppRS-v17.10.1.zip`.

V17.10.1 baseline:
- Admin UI gate: PASS
- Typecheck: PASS
- Build: PASS
- DB/runtime alignment: already completed
- Historical data must remain untouched

## V17.11 Objective

Freeze the Question Architecture and establish regression gates without redesigning the already-PASS runtime.

Canonical runtime:

```text
Assessment Type
→ Active AssessmentConfigurationVersion
→ QuestionPackageVersion
→ QuestionPackageCompositionRule
→ Eligible QuestionVersions
→ Selection Algorithm
→ AssessmentAttempt Snapshot
→ Scoring
→ Result / Report
```

## Added files

- `scripts/validate-v17-11-question-architecture-freeze.mjs`
- `scripts/e2e-v17-11-question-architecture-regression.mjs`
- `scripts/v17-11-freeze.mjs`
- `ReadyScore-V17.11-Question-Architecture-Freeze-Spec.md`
- `ReadyScore-V17.11-DEVELOPMENT-HANDOFF.md`

## Added package commands

```bash
pnpm v17.11:architecture:gate
pnpm v17.11:regression
pnpm v17.11:freeze
```

## Important behavior

V17.11 does not:
- run database migrations;
- delete or rewrite historical attempts;
- delete legacy configuration;
- deploy production;
- make paid E2E consume real entitlements by default.

`pnpm v17.11:regression` is intentionally read-safe:
- FREE runtime start + package/snapshot validation;
- unauthenticated paid-access guard for RIASEC/DISC/EQ/COGNITIVE.

Existing mutating assessment/scoring/result/commercial/WhatsApp suites remain the regression source and must be run on the user's Mac when doing final certification.

## Local verification already performed on generated baseline

- Node syntax check: PASS for all new `.mjs` files.
- `package.json` parse: PASS.
- `pnpm v17.11:architecture:gate` equivalent direct execution: PASS.

## Next user-side commands

```bash
pnpm install --frozen-lockfile
pnpm v17.11:freeze
pnpm v17.11:regression
```

Then run the established full regression suites required by the existing ReadyScore release process.

Do not deploy production until all required local regression gates are PASS.
