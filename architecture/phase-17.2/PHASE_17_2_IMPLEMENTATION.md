# ReadyScore V17.2 — Conversation & Message Persistence

**Status:** Implementation delivered — pending local validation
**Baseline:** V17.1 — WhatsApp Webhook Foundation — LOCAL PASS

## Scope implemented

- `WhatsAppConversation` persistence.
- `WhatsAppMessage` persistence.
- WhatsApp-only channel enum with composite phone/channel uniqueness.
- Canonical Indonesian WhatsApp phone normalization.
- Inbound webhook persistence with external message ID idempotency.
- Automatic conversation creation/reuse.
- BusinessLead linking when the normalized WhatsApp number matches exactly.
- Unread counter increment for newly persisted inbound messages.
- Provider status persistence for known message statuses.
- Duplicate and stale webhook protection.
- Prisma migration and indexes.

## Explicit boundary

Phase 17.2 does **not** implement:

- Admin Inbox UI.
- Admin conversation APIs.
- Admin reply composer.
- New CRM identity system.
- AI/chatbot behavior.
- Third-party WhatsApp provider dependency.

Those remain in later V17 phases according to the locked V17 architecture.

## Security

The persistence layer does not read or store:

- `WHATSAPP_ACCESS_TOKEN`
- `WHATSAPP_APP_SECRET`
- `WHATSAPP_VERIFY_TOKEN`

The webhook continues to perform signature verification before persistence.

## Gate

Required local validation:

```text
pnpm v17:2:gate
pnpm typecheck
pnpm build
pnpm e2e:v17:1:webhook
pnpm e2e:v17:2:persistence
```

V17.2 is PASS only after these commands are actually validated locally.
