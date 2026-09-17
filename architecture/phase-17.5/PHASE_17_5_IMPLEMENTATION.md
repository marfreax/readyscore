# ReadyScore V17.5 — Business Lead & ReadyScore Context

## Baseline
V17.4.2 Admin Reply — PASS.

## Objective
Connect WhatsApp conversations to the existing ReadyScore BusinessLead and expose accurate assessment / Free Report context without creating a second customer identity system.

## Implemented
- Deterministic exact WhatsApp matching using the existing normalized BusinessLead.whatsapp identity.
- Existing conversations can be synchronized to a BusinessLead when an exact phone match becomes available.
- Explicit admin BusinessLead linking via `POST /api/admin/whatsapp/conversations/:id/link-lead`.
- Admin-only BusinessLead candidate search for name, email, or WhatsApp.
- Link audit event using the existing `AdminContentAuditEvent` store.
- Context panel refinement: customer, BusinessLead, assessment attempt/reference, RIASEC result, Free Report PDF/WhatsApp/email delivery status.
- No new customer/CRM identity table.

## Matching contract
1. Exact normalized WhatsApp number.
2. Explicit admin link.
3. Email is available for candidate discovery, not guessed as an identity when the conversation has no verified email.
4. Name alone is never used for automatic linking.

## Safety
- Existing admin authentication/RBAC reused.
- Existing BusinessLead model reused.
- No WhatsApp credentials added to browser/database/logs.
- No production changes.
- No fabricated assessment or report state.

## Verification
```bash
pnpm v17:5:gate
pnpm typecheck
pnpm build
pnpm e2e:v17:4:reply
pnpm e2e:v17:5:context
```

Phase 17.5 is PASS only after all requested local gates and runtime/regression checks succeed.
