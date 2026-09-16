# ReadyScore V16.5 — PDF & Delivery Hardening

## Scope

V16.5 hardens Free Report PDF generation and retrieval without changing the V16 business funnel.

Reference baseline:
- V16.4
- `ReadyScore-V16.5-16.8-Free-Funnel-Completion-Spec.md`

## Changes

1. Cross-platform Chromium/Chrome discovery.
2. Explicit environment override:
   - `READYSCORE_CHROMIUM_PATH`
   - `CHROME_BIN`
3. Executable validation before renderer execution.
4. Valid PDF signature and minimum-size validation.
5. Corrupt stored PDF detection and regeneration.
6. PDF route error handling with safe client-facing errors.
7. Delivery ledger is marked `FAILED` when PDF generation/output is invalid.
8. PDF response adds `X-Content-Type-Options: nosniff`.
9. Static V16.5 contract gate.

## Runtime contract

```text
Free Report
  ↓
Generate PDF
  ↓
Validate %PDF-
  ↓
Persist
  ↓
GET /api/free/report/pdf
  ↓
Valid application/pdf
```

## Non-goals

- WhatsApp provider integration changes.
- Resend provider integration changes.
- CRM/business lead changes.
- Premium/payment changes.
- V17 AI.

## Verification

```bash
pnpm v16:5:gate
pnpm typecheck
pnpm build
```

Runtime verification must use a real completed FREE attempt:

```text
POST /api/free/delivery
→ pdfStatus = GENERATED
→ GET /api/free/report/pdf?attemptId=...
→ HTTP 200
→ Content-Type: application/pdf
→ file header = %PDF-
```

If Chromium is not auto-detected, configure:

```bash
READYSCORE_CHROMIUM_PATH=/absolute/path/to/chromium
```
