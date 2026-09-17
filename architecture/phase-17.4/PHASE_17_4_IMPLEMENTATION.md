# ReadyScore V17.4 — Admin Reply

## Baseline
V17.3.1 Admin Inbox Read Model — PASS.

## Scope
- Admin text composer.
- Existing admin authentication/RBAC.
- POST conversation message endpoint.
- Meta WhatsApp Cloud API text send.
- Persist outbound message as SENDING before provider call.
- On provider success: store provider message ID and mark SENT.
- On provider failure: mark FAILED and expose safe mapped error code.
- Refresh conversation timeline after successful send.

## Explicit boundaries
- No AI reply.
- No broadcast/campaign.
- No template management UI.
- No media composer.
- No new CRM identity system.
- No production changes.
- No fake provider success.

## Provider contract
Server-only environment variables:
- `WHATSAPP_ACCESS_TOKEN`
- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_GRAPH_VERSION` (default `v23.0`)

Provider request uses `POST /{phone_number_id}/messages` with a text message.
Provider message ID is required for a successful application-level send.

## Failure semantics
Mapped application codes include:
- `WHATSAPP_PROVIDER_NOT_CONFIGURED`
- `WHATSAPP_AUTH_FAILED`
- `WHATSAPP_PHONE_NOT_FOUND`
- `WHATSAPP_RATE_LIMITED`
- `WHATSAPP_TEMPLATE_REQUIRED`
- `WHATSAPP_PROVIDER_REJECTED`
- `WHATSAPP_NETWORK_ERROR`
- `WHATSAPP_UNKNOWN_ERROR`

No raw access token, app secret, signature, or session data is logged or returned.

## Verification
Run:
```bash
pnpm v17:4:gate
pnpm typecheck
pnpm build
pnpm e2e:v17:4:reply
```

Production remains untouched until the complete local V17 certification path passes.
