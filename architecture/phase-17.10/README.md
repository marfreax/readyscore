# ReadyScore V17.10 — Runtime Alignment & Configuration Migration

## FIXED-2 boundary

V17.10 uses a strict two-step local migration boundary:

1. `pnpm db:migrate:deploy` applies **schema-only additive changes**.
2. `pnpm v17.10:runtime:align` links existing local configuration/package records.

The Prisma migration deliberately does not create TestType, TaxonomyVersion,
TaxonomyNode, QuestionPackage, QuestionPackageVersion, or composition data.
This prevents shadow-database assumptions and avoids manufacturing duplicate
question architecture records.

No production changes are performed by this phase.
