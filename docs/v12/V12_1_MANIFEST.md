# ReadyScore V12.1 — Manifest

Artifact: V12.1 Password Recovery Foundation
Source baseline: AppRS-v11.7.17-Delivery-Notes-Closure.zip

Primary additions:
- lib/auth/password-recovery.ts
- lib/auth/password-recovery-email.ts
- app/api/auth/forgot-password/route.ts
- app/forgot-password/page.tsx
- Prisma PasswordResetToken model
- scripts/validate-v12-1-password-recovery-foundation.mjs
- V12_1_ARCHITECTURE.md
- V12_1_DELIVERY_NOTES.md
- V12_1_MANIFEST.md

Package script:
- v12:1:gate

Database migration: included.
- prisma/migrations/20260906122000_v12_1_password_recovery_foundation/migration.sql
