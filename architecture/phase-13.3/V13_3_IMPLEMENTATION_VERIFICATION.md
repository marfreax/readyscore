# V13.3 Implementation Verification

Static implementation verification prepared for local environment validation.

## Required local gates

```bash
pnpm install
pnpm exec prisma generate
pnpm exec prisma validate
pnpm exec prisma migrate status
pnpm exec prisma migrate deploy
pnpm typecheck
pnpm build
pnpm v13:3:gate
```

## Runtime E2E

Start the application first with `pnpm dev`, then run `pnpm e2e:v13:3:resilience` in a second terminal. The E2E uses real HTTP and real PostgreSQL.
