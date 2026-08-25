# Phase 2.1 Build Fix

The previous package had three integration defects:

1. The question bank type did not expose the imported `domain` field.
2. `question-engine.ts` referenced `assessment-config.ts` from the wrong directory.
3. The generated `data/question-bank.json` must be included in the project and resolved through `resolveJsonModule`.

These are implementation defects, not product-model changes.

The data contract remains Phase 2.1.
