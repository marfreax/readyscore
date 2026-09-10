# ReadyScore V11.6.2 — Pagination Repository Utility

## Status

**IMPLEMENTED — RUNTIME VERIFICATION REQUIRED**

## Baseline

V11.6.1 PASS / V11.5 FROZEN.

## Objective

Menyediakan utility pagination reusable di repository/data-access boundary tanpa mengubah customer behavior, database schema, atau operational semantics.

## Canonical contract

```ts
type AdminPaginationInput = {
  page?: number;
  pageSize?: number;
};

type AdminPagination = {
  page: number;
  pageSize: number;
  offset: number;
  limit: number;
};

type AdminPaginationMeta = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

type AdminPaginatedResult<T> = {
  items: T[];
  pagination: AdminPaginationMeta;
};
```

## Normalization rules

- default page = `1`;
- page `< 1` normalizes to `1`;
- non-finite/invalid page falls back to `1`;
- default page size = `25`;
- supported page sizes = `10`, `25`, `50`, `100`;
- values at/above the maximum normalize to `100`;
- non-positive/invalid page size falls back to `25`;
- `offset = (page - 1) * pageSize`;
- `limit = pageSize`;
- total item count is normalized to a non-negative integer;
- metadata derives `totalPages`, `hasNextPage`, and `hasPreviousPage` deterministically.

## Repository rule

The utility does **not** fetch or slice a full dataset. A repository must use `offset` and `limit` (or equivalent database pagination parameters) in its data-source query.

Forbidden:

```text
findMany(all)
→ JavaScript slice()
```

Required direction:

```text
request
→ normalizeAdminPagination()
→ database query using offset/limit
→ count()
→ createAdminPaginatedResult()
```

## Scope

Implemented:

- reusable pagination types;
- input normalization;
- offset/limit calculation;
- pagination metadata;
- generic paginated result helper.

Not implemented:

- Audit API;
- `/admin/audit` page;
- UI pagination controls;
- search/filter/sort;
- Question Bank integration;
- Review integration;
- Users integration;
- database migration;
- customer UX changes;
- measurement/scoring/result changes;
- entitlement changes;
- historical recalculation.

## Acceptance

A later integration phase must prove that each admin repository uses this utility with database-side bounded queries. This task itself establishes only the reusable repository utility contract.
