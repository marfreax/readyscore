# ReadyScore V9.10 Delivery Notes

V9.10 formalizes the Cross-Test Profile as an evidence synthesis layer over the protected V8.13/V9.0–V9.9 baseline.

No database migration is included. No assessment measurement, scoring, question bank, or result semantics are changed.

Run from repository root:

```bash
pnpm install
pnpm typecheck
pnpm build
pnpm v9:0:gate
pnpm v9:1:gate
pnpm v9:2:gate
pnpm v9:3:gate
pnpm v9:4:gate
pnpm v9:5:gate
pnpm v9:6:gate
pnpm v9:7:gate
pnpm v9:8:gate
pnpm v9:9:gate
pnpm v9:10:gate
```

For actual runtime coverage against PostgreSQL and HTTP, the existing `scripts/e2e-cross-test-profile-runtime.mjs` remains the dedicated cross-test profile E2E.
