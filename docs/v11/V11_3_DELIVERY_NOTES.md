# ReadyScore V11.3 Delivery Notes

Status: IMPLEMENTED — awaiting environment runtime verification
Base: AppRS-v11.2

## Scope
Review & Publishing Governance: canonical lifecycle, review queue, validation, mapping approval, approval, publishing, activation, archive/replacement protection, audit trail, Admin authorization, and high-impact confirmation.

## Safety
- No Prisma migration.
- Historical QuestionVersion rows are not overwritten.
- Published content cannot be destructively archived.
- Publish requires APPROVED question status and APPROVED mapping.
- Validation blocks duplicate content.
- High-impact PUBLISH / ACTIVATE / ARCHIVE operations require server-validated explicit confirmation.
- Impact preview exposes historical impact, future customer impact, scoring impact, review/regression requirements, validation errors, and blockers.
- ACTIVATE preserves the frozen runtime convention in which customer-eligible question content is represented by PUBLISHED; activation is recorded as an audit event.
- All mutation paths require Admin authorization server-side.

## Commands
Use pnpm.

pnpm v11:3:gate
pnpm e2e:v11:3:review-publishing
pnpm typecheck
pnpm build

## Static/runtime smoke
The V11.3 contract gate and governance smoke are included in the package and must pass before typecheck/build are considered a V11.3 PASS.
