# ReadyScore V17.8 — Production Deployment & Runtime Certification

## Status
Implementation baseline for Phase 17.8. Production execution is intentionally gated by an explicit approval environment variable and must occur only from a clean, committed, pushed branch after V17.7 PASS.

## Objective
Deploy the exact V17.7 PASS baseline to `app.readyscore.id` and certify the real production WhatsApp path:

`Meta -> ReadyScore webhook -> Conversation/Message -> Admin Inbox -> Admin Reply -> Meta -> customer -> provider status`

The V17 architecture baseline identifies Phase 17.8 as the production sequence after V17.7 PASS. See the V17 specification Phase 17.8 contract. 

## Mandatory sequence

1. Confirm V17.7 Full Local Certification is PASS.
2. Commit the V17.7 baseline and corrections.
3. Run `git status --porcelain` and require an empty working tree.
4. Push `main`.
5. On VPS `/var/www/readyscore`, perform the VPS pull by fetching and fast-forwarding to `origin/main`.
6. Run `pnpm install --frozen-lockfile`.
7. Run `pnpm exec prisma migrate deploy`.
8. Run `pnpm exec prisma generate`.
9. Run `pnpm build`.
10. Restart the existing PM2 application.
11. Run production smoke checks.
12. Verify Meta webhook challenge using the production server-side verification token without printing the token.
13. Perform a real inbound WhatsApp message from an authorized test/customer phone.
14. Confirm the message appears in `/admin/whatsapp`.
15. Send an admin reply from ReadyScore.
16. Confirm the customer receives the outbound WhatsApp message.
17. Confirm provider status synchronization in the inbox/database (status verification).
18. Record PASS only when every runtime checkpoint succeeds.

## Production target

- Host: `139.190.96.89`
- SSH user: `adminready`
- Application path: `/var/www/readyscore`
- Public application: `https://app.readyscore.id`
- WhatsApp webhook: `https://app.readyscore.id/api/webhooks/whatsapp`
- Existing WhatsApp identity remains the V17 source of truth.

The runner supports environment overrides so deployment infrastructure is not hard-coded into application logic:

- `READYSCORE_VPS_HOST`
- `READYSCORE_VPS_USER`
- `READYSCORE_VPS_PATH`
- `READYSCORE_PM2_APP`
- `READYSCORE_PRODUCTION_URL`
- `READYSCORE_SSH_OPTIONS`

Defaults correspond to the current ReadyScore production deployment.

## Safety gates

Production mutation is refused unless:

```text
READYSCORE_PRODUCTION_APPROVED=YES
```

The local repository must be clean before push. The runner never prints, reads back, or transmits WhatsApp access tokens/app secrets to the terminal output.

The runner does not use `git restore` and does not manipulate `data/auth-state.json`.

## Migration safety

Use `prisma migrate deploy`, never `migrate dev`, on production. Existing migration history is not rewritten. The V17.2 safe migration remains part of the repository baseline.

## Smoke checks

The runner verifies HTTP availability and key unauthenticated/authenticated boundaries without requiring secrets in output. Expected examples:

- `/` -> HTTP 200
- `/free` -> HTTP 200
- `/api/auth/session` -> HTTP 401/unauthenticated contract
- `/api/admin/leads` -> HTTP 401 when unauthenticated
- `/api/webhooks/whatsapp` -> webhook endpoint reachable

## Real WhatsApp certification

The runner deliberately stops for human confirmation for the real customer-side actions. HTTP/build success is not accepted as a substitute.

### Inbound
Send a real WhatsApp text to the ReadyScore production number:

`+62 811-9696-2200`

Confirm:
- webhook receives it;
- a conversation is created/reused;
- the message is visible in the admin inbox;
- unread/read state updates.

### Admin reply
From `https://app.readyscore.id/admin/whatsapp`, open the conversation and send a short text reply.

Confirm:
- outbound message is persisted;
- provider message ID exists;
- customer receives the message.

### Status
Wait for provider events and confirm the inbox reflects the actual provider status. Never mark PASS merely because the Graph API HTTP request succeeded.

## Failure semantics

- Any failed automated step => FAIL.
- Missing dependency => SKIPPED, not PASS.
- Real inbound/outbound not performed => INCOMPLETE, not PASS.
- Production rollback is not automated by this certification runner; if deployment/build fails before PM2 restart, the existing process is left untouched where possible. If PM2 restart occurs and runtime is unhealthy, use the normal operator rollback procedure.

## Final gate

```text
V17 PRODUCTION RUNTIME — PASS
```

only after all automated and real-message checkpoints succeed.
