# ReadyScore V17.3 — Admin Inbox Read Model

## Baseline
V17.2.3 — Conversation & Message Persistence — PASS.

## Scope
- Protected `/admin/whatsapp` workspace.
- Conversation list, OPEN by default, sorted by latest activity.
- Search by customer display name or normalized phone number.
- 50-item conversation and message page limits.
- Message timeline with direction, timestamp and provider status.
- Unread count and explicit mark-read operation.
- Basic customer, Business Lead, assessment and Free Report context from existing canonical records.
- No outbound reply/provider-send implementation; reserved for Phase 17.4.

## API
- `GET /api/admin/whatsapp/conversations`
- `GET /api/admin/whatsapp/conversations/:id`
- `GET /api/admin/whatsapp/conversations/:id/messages`
- `POST /api/admin/whatsapp/conversations/:id/read`

All endpoints reuse existing `requireAdminApi()` and the existing `{ ok: true, ... }` response convention.

## Boundary
Phase 17.3 is read-model/UI only. It does not call Meta Graph API, send WhatsApp messages, introduce a second auth system, or create a second CRM identity system.

## Gate
`pnpm v17:3:gate`
`pnpm typecheck`
`pnpm build`
`pnpm e2e:v17:3:inbox`

Production remains untouched until the full local certification sequence reaches PASS.
