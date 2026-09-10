# ReadyScore V12.3 — Change Password & Credential Operations

## Scope
V12.3 adds authenticated self-service password change without using the forgot-password flow.

## Contract
- Authenticated session required server-side.
- Inputs: `currentPassword`, `newPassword`, `confirmNewPassword`.
- Current password verified server-side against the authoritative DB credential.
- New password uses canonical `hashPassword()`.
- Minimum password length remains 8 characters, aligned with the existing authentication contract.
- Password mutation is transactionally guarded by the current stored hash and ACTIVE status.
- DB User `role`, `status`, entitlements, assessment attempts, and assessment results are not modified.
- Local `auth-state.json` credential representation is synchronized after the DB mutation because the current authentication architecture is hybrid.
- Session semantics are intentionally unchanged; session invalidation belongs to V12.4 security/session semantics.

## Routes
- `GET /change-password` — authenticated customer UI.
- `POST /api/auth/change-password` — authenticated credential mutation API.

## No Migration
V12.3 reuses the existing User credential storage. No Prisma schema or migration is introduced.
