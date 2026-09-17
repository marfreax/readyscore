# ReadyScore V17.0.1 — Phase 17.0 Gate Correction

This is a correction to the Phase 17.0 Architecture & Contract Lock package.

## Correction

The original V17.0 validation script asserted the literal phrase `No AI chatbot`,
while the canonical V17 specification expresses this as the `AI chatbot` item
inside the explicitly out-of-scope list.

The implementation itself was not changed. Only the static validation assertion
was corrected so the gate matches the canonical specification.

## Required validation

```bash
pnpm install
pnpm v17:0:gate
pnpm typecheck
pnpm build
```

Expected:

```text
ReadyScore V17.0 Architecture & Contract Lock: PASS
```

No V17 runtime implementation is introduced by this correction.
