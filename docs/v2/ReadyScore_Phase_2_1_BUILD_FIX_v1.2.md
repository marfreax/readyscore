# Phase 2.1 Build Fix v1.2

The runtime question-bank loader now uses `data/question-bank.ts` instead of importing JSON through the `@/data/question-bank.json` alias.

Reason:
- The previous runtime import depended on JSON module resolution and produced TS2307 in the user's Next.js environment.
- The generated TypeScript data module is directly type-checkable by Next.js/TypeScript.
- `data/question-bank.json` remains available as an import/audit artifact; it is not the runtime source.

The normalized Question model is explicitly mapped into the application Question contract.
