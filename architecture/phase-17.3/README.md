# Phase 17.3 — Admin Inbox Read Model

Baseline: **ReadyScore V17.2.3 — PASS**

This phase adds the protected ReadyScore admin WhatsApp read experience:

- `/admin/whatsapp`
- conversation list (OPEN by default)
- name/phone search
- 50-item pagination boundary
- message history
- unread count
- explicit mark-read state
- customer / Business Lead / assessment / Free Report context

**Explicit boundary:** outbound reply is not implemented here. Meta Graph API send remains Phase 17.4.

## Local gate

```bash
pnpm install
pnpm v17:3:gate
pnpm typecheck
pnpm build
pnpm e2e:v17:3:inbox
```

Do not modify production before all local gates are PASS.
