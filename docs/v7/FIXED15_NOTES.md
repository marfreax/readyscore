# ReadyScore V7 L18 FIXED15

Root cause fixed: React/Next server rendering can insert hydration separator comments between JSX text nodes when adjacent literal text and expressions are used. The L18 E2E exact marker `EQ · Retake` could therefore be absent as a contiguous substring even though the visual page was correct.

Reassessment header markers now use single template-string expressions:
- `${LABELS[type]} · Retake`
- `Assessment ${LABELS[type]}`

This preserves the visible UI while guaranteeing contiguous server-rendered marker text for runtime verification.

No database migration. No measurement/scoring/commercial semantics changed.
