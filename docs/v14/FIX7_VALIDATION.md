# ReadyScore V14.1 — FIX7 Validation

## Scope
Validation-only fix for the V14.1 functional/database E2E.

## Change
`v14/tests/e2e-v14-1-commercial-domain.mjs` no longer expects the customer-facing commercial catalog API to expose a `status` field.

Product selection now uses the catalog's exposed `priceIdr` to select a priced product. The selected product's authoritative database state is still verified immediately afterward:

- `status === ACTIVE`
- integer `priceIdr > 0`

No production domain logic, API contract, Prisma schema, migration, or assessment runtime was changed.

## Validation command

```bash
pnpm e2e:v14.1:commercial
```

The test remains REAL HTTP + REAL PostgreSQL.
