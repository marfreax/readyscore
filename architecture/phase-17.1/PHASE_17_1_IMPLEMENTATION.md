# ReadyScore V17.1 — WhatsApp Webhook Foundation

**Status:** Implementation package  
**Baseline:** ReadyScore V17.0.1 — Architecture & Contract Lock  
**Scope:** Meta WhatsApp webhook verification, signature validation, payload normalization, safe ACK, environment contract, and local E2E.

## Implemented

- `GET /api/webhooks/whatsapp`
  - validates `hub.mode=subscribe`
  - validates `hub.verify_token`
  - returns `hub.challenge` only on successful verification
  - returns 503 when verify token is not configured
  - returns 403 for invalid verification

- `POST /api/webhooks/whatsapp`
  - reads raw body before parsing
  - validates `X-Hub-Signature-256`
  - rejects malformed signatures
  - parses JSON safely
  - validates WhatsApp Business Account webhook shape
  - normalizes message/status events
  - returns a fast JSON acknowledgement
  - does not persist anything in Phase 17.1

## Environment contract

```env
WHATSAPP_VERIFY_TOKEN=
WHATSAPP_APP_SECRET=
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_GRAPH_VERSION=
```

Phase 17.1 only consumes:

- `WHATSAPP_VERIFY_TOKEN`
- `WHATSAPP_APP_SECRET`

The existing outbound variables remain untouched.

## Security

The following are never returned or logged:

- `WHATSAPP_ACCESS_TOKEN`
- `WHATSAPP_APP_SECRET`
- `WHATSAPP_VERIFY_TOKEN`
- webhook signature

Signature comparison uses timing-safe comparison.

## Phase boundary

Persistence belongs to Phase 17.2.

No `WhatsAppConversation` or `WhatsAppMessage` database models are introduced in Phase 17.1.

No admin inbox UI is introduced in Phase 17.1.

No outbound admin reply is introduced in Phase 17.1.

## Validation

```bash
pnpm v17:1:gate
pnpm typecheck
pnpm build
pnpm e2e:v17:1:webhook
```

Expected final result:

```text
ReadyScore V17.1 WhatsApp Webhook Foundation: PASS
```
