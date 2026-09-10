# V9.12 Delivery Notes

## Implemented

- Access & Plans customer surface strengthened.
- Current entitlement state made explicit.
- Plan comparison and capability hierarchy clarified.
- Single Test conversion surfaced per assessment.
- Upgrade conversion surfaced from existing `getUpgradeQuote()`.
- Scalev checkout configuration is checked before purchase CTAs.
- Checkout remains a redirect boundary; no entitlement is granted by the UI.
- Existing add-on catalog remains informational/entitlement-aware.
- No measurement, scoring, question-bank, result, report, or activity semantics changed.
- No database migration introduced.

## Validation

Run:

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
pnpm v9:11:gate
pnpm v9:12:gate
```

Do not run a database migration for V9.12.
