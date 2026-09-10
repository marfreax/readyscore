# ReadyScore V11.6.3 — Audit API

## Scope

Introduce the read-only admin Audit API on top of the V11.6.1 audit repository contract and V11.6.2 pagination utility.

## Contract

- Route: `GET /api/admin/audit`
- Server authorization: `requireAdminApi()`
- Optional filters: `entityType`, `entityId`, `actorUserId`, `action`
- Optional pagination: `page`, `pageSize`
- Supported entity types are the canonical repository values.
- Response shape:

```json
{
  "ok": true,
  "items": [],
  "pagination": {
    "page": 1,
    "pageSize": 25,
    "totalItems": 0,
    "totalPages": 0,
    "hasNextPage": false,
    "hasPreviousPage": false
  }
}
```

## Data behavior

- Filtering is performed in the database query.
- `count()` and paged `findMany({ skip, take })` are used; the API never loads the full audit collection for browser-side slicing.
- Ordering is deterministic: `createdAt DESC, id DESC`.
- Pagination is normalized by `admin-pagination.ts`.
- No mutation endpoint is introduced.
- No database migration is introduced.
- Existing audit events are not modified or deleted.

## Validation

Invalid positive-integer pagination values return `INVALID_PAGINATION`. Unknown audit entity types return `INVALID_ENTITY_TYPE`. Unauthenticated and non-admin requests remain server-rejected.

## Non-goals

- Audit UI/workspace
- Audit detail UI
- Search/date-range UX
- Pagination integration into other admin workspaces
- Any customer, scoring, result, entitlement, or historical semantics
