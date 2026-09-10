# ReadyScore V15.2 — V6 Typecheck Fix

## Root cause
`lib/v15/major-matching/engine-v1.ts` contained an incomplete `String.replace()` call:

`replace(/[.!?]+$/, )`

TypeScript correctly rejected this because `String.replace()` requires a replacement value.

## Fix
The call now supplies an empty replacement string:

`replace(/[.!?]+$/g, "")`

No matching/scoring logic was changed. This is a compile/typecheck-only correction to the V15.2 editorial sentence cleanup.

## Expected result
- `pnpm typecheck` PASS
- `pnpm build` PASS
- `pnpm v15.2:gate` PASS
