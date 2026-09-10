# ReadyScore V11.5 Delivery Notes

## V11.5 — Users & Access Operations

Implemented from the V11.4 baseline.

### Delivered

- Persistent `UserStatus`: `ACTIVE` / `INACTIVE`.
- Safe Admin role operations: `USER` / `ADMIN`.
- Server-side Admin authorization for user mutations.
- Explicit server-enforced confirmation for mutations.
- Self-deactivation protection.
- Last active Admin protection.
- Existing session/auth-store status enforcement.
- Inactive login protection.
- User operation audit events using `AdminContentAuditEvent`.
- Non-destructive historical boundary: no attempts, answers, results, purchases, entitlements, or institution memberships are deleted or rewritten.
- Admin Users UI with status/role operations and safety messaging.
- Additive Prisma migration; existing users default to `ACTIVE`.

### Verification available in build package

- `pnpm v11:5:gate`
- `pnpm e2e:v11:5:users-access`

The development environment used to assemble the ZIP does not contain project `node_modules`, so production `typecheck` and `build` must be verified in the consumer environment.
