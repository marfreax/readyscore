# ReadyScore V17.1

## WhatsApp Webhook Foundation

Implemented:

- Meta GET webhook verification
- HMAC SHA-256 signature validation
- safe POST parsing and validation
- inbound message/status normalization
- deterministic local runtime E2E
- no persistence yet

Run:

```bash
pnpm v17:1:gate
pnpm typecheck
pnpm build
pnpm e2e:v17:1:webhook
```

Persistence begins in Phase 17.2.
