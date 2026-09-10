# V13.1 Manifest

## New
- `prisma/migrations/20260907100000_v13_1_question_package_configuration/migration.sql`
- `lib/question-package-repository.ts`
- `app/api/admin/question-packages/route.ts`
- `app/admin/question-packages/page.tsx`
- `components/admin/QuestionPackageWorkspace.tsx`
- `scripts/validate-v13-1-question-package-configuration.mjs`
- `V13_1_ARCHITECTURE.md`
- `V13_1_DELIVERY_NOTES.md`
- `V13_1_MANIFEST.md`

## Updated
- `prisma/schema.prisma`
- `lib/admin-content-operations.ts`
- `app/admin/page.tsx`
- `package.json`

## Architecture boundary
V13.1 only establishes Question Package configuration and governance. It does not alter question selection, assessment runtime, scoring, payment, or customer access delivery.
