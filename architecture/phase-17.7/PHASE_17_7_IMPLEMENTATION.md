# ReadyScore V17.7 — Full Local E2E Certification

## Objective
Certify the complete ReadyScore V17 operational flow locally before any production deployment.

## Certification boundaries
- V15.2 customer/report regression.
- V16.5 PDF and delivery regression.
- V16.6 delivery/idempotency regression.
- V16.7 Business Lead regression.
- V16.8/V16.8.4 funnel and WhatsApp-copy regression.
- V17.0 architecture contract.
- V17.1 webhook verification/signature/normalization.
- V17.2 conversation/message persistence and idempotency.
- V17.3 admin inbox/read model.
- V17.4 admin reply/provider status.
- V17.5 Business Lead and ReadyScore context.
- V17.6 production hardening.

## Runtime sequence
```text
Legacy regression
      ↓
V17 webhook
      ↓
V17 persistence
      ↓
V17 inbox
      ↓
V17 admin reply
      ↓
V17 Business Lead / ReadyScore context
      ↓
V17 production hardening
```

## Gate
`pnpm v17:7:gate`

## Full certification
`pnpm e2e:v17:7:full-local`

## Production boundary
This phase performs local certification only. It does not push Git, pull a VPS, restart PM2, or mutate production.

Phase 17.8 is the first phase permitted to perform production deployment, and only after this phase reaches PASS.
