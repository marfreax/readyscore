# ReadyScore V18.3 — Production Hardening & Full Certification

Status: implementation baseline / local certification pending

## Baseline

This phase is based directly on the last user-validated PASS baseline: V18.2 Admin Inbox & Customer Context.

## Scope

- webhook retry safety and idempotency hardening
- admin send rate limiting
- safe provider error mapping
- webhook input/body-size validation
- pagination/performance boundaries
- security headers
- auditability
- preservation of V17.11 Question Architecture
- full local regression across V17.11, V18.1, V18.2 and existing WhatsApp hardening

## Production boundary

No production deployment, database mutation, Git operation, or real WhatsApp traffic is performed by the local certification script.

Production evidence remains a separate operator step after local certification passes, in accordance with the V18 specification.

## Verification

```text
pnpm install --frozen-lockfile && pnpm v18.3:gate && pnpm typecheck && pnpm build && pnpm e2e:v18.3:local-cert
```

## Definition of Done

The local phase is not claimed PASS until the actual Mac runtime produces a complete PASS for the local certification command.

Production certification additionally requires real production smoke, Meta webhook verification, real inbound WhatsApp, admin reply, real outbound WhatsApp, and provider status verification.
