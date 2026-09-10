# V12.4 Manifest

## New
- `lib/auth/rate-limit.ts`
- `lib/auth/audit.ts`
- `prisma/migrations/20260906133000_v12_4_security_abuse_audit/migration.sql`
- `scripts/validate-v12-4-security-abuse-audit.mjs`
- `scripts/e2e-v12-4-security-abuse-audit-runtime.mjs`
- `V12_4_ARCHITECTURE.md`
- `V12_4_DELIVERY_NOTES.md`
- `V12_4_MANIFEST.md`

## Updated
- `lib/auth/password-recovery.ts`
- `lib/auth/password-reset.ts`
- `lib/auth/change-password.ts`
- `app/api/auth/forgot-password/route.ts`
- `prisma/schema.prisma`
- `package.json`

## Security boundaries
No plaintext password, reset token, full reset URL, or credential secret is added to audit payloads or application logs.
