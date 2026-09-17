# ReadyScore V17.0 — Architecture & Contract Lock

**Status:** LOCKED / IMPLEMENTATION NOT STARTED  
**Baseline:** ReadyScore V16.8.4 — Production Runtime Certified  
**Scope:** Architecture, contracts, security boundaries, data model, API surface, UX boundary, and phase gates only.

## Phase 17.0 decision

V17 is a first-party WhatsApp Inbox built on the existing Meta WhatsApp Cloud API integration.

Primary route:

`/admin/whatsapp`

V17 does not replace Meta WhatsApp infrastructure and does not introduce Kirimi, QR automation, WhatsApp Web automation, unofficial APIs, AI, campaigns, broadcast, or omnichannel scope.

## Locked contracts

- Meta WABA remains the source of truth.
- Existing V16.8.4 outbound WhatsApp delivery remains intact.
- Inbound communication enters through a verified Meta webhook.
- Conversations and messages are persisted in ReadyScore.
- `externalMessageId` is the inbound idempotency key when supplied by Meta.
- WhatsApp customer identity is based on normalized phone number.
- Existing `BusinessLead` is reused; no second CRM identity system.
- Admin access reuses existing ReadyScore authentication/RBAC.
- Meta credentials remain server-side only.
- Provider delivery/read status is authoritative; no fake success.
- V16.8.4 functionality is regression-locked.

## Phase boundary

Phase 17.0 MUST NOT implement:

- webhook runtime;
- Prisma migration;
- WhatsApp conversation/message tables;
- `/admin/whatsapp` runtime page;
- outbound admin reply;
- production Meta webhook configuration.

Those belong to later phases.

## Phase 17.0 PASS criteria

1. V17 specification is present and canonical.
2. Architecture and API/webhook/security contracts are locked.
3. V16.8.4 baseline remains unchanged except for Phase 17.0 documentation and validation tooling.
4. No V17 runtime implementation is introduced.
5. Static contract gate passes.
6. Typecheck passes.
7. Production build passes.
8. Existing V16 regression gates remain available.

**Next phase:** Phase 17.1 — WhatsApp Webhook Foundation.
