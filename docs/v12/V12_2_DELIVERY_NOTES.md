# ReadyScore V12.2 — Delivery Notes

## Baseline
Built directly from the V12.1 artifact that the user verified PASS.

## Delivered
- Reset Password API
- Reset Password page
- secure token validation
- expiry enforcement
- single-use compare-and-consume
- password hashing through the existing canonical `hashPassword()` implementation
- invalidation of remaining pending reset tokens
- DB/local authentication credential synchronization
- no auto-login
- static gate
- runtime E2E script

## Explicitly Not Delivered
- Change Password (V12.3)
- rate limiting (V12.4)
- authentication audit events (V12.4)
- MFA / OTP / WhatsApp recovery
- session architecture redesign

## Database
No new migration. V12.2 reuses `PasswordResetToken` from V12.1.

## Required User Gates
```bash
pnpm v12:2:gate
pnpm typecheck
pnpm build
pnpm e2e:v12:2:reset-password
```

V12.2 is not considered PASS until the required user-environment gates pass.
