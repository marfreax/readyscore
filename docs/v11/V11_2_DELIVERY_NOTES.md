# V11.2 Delivery Notes

V11.2 adds Assessment Configuration Governance on top of V11.1.

Implemented:
- configuration/version inspection
- assessment-specific Question Group linkage
- selection constraints metadata
- readiness/health checks against eligible QuestionVersions
- activation protection when readiness is blocked
- transactional activation/replacement safety
- active-version archive protection
- activation impact preview
- no new Prisma migration

The existing attempt snapshot fields remain the historical safety boundary.

Validation commands:
- `pnpm v11:2:gate`
- `pnpm e2e:v11:2:assessment-config`
- `pnpm typecheck`
- `pnpm build`

V11.2 deliberately does not redesign scoring, result semantics, entitlements, or customer UX.
