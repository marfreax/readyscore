# V11.6.6 Architecture — Question Bank Pagination

## Contract

`getAdminQuestionsPaginated(params)` returns:

- `items: AdminQuestion[]`
- `pagination.page`
- `pagination.pageSize`
- `pagination.totalItems`
- `pagination.totalPages`
- `pagination.hasNextPage`
- `pagination.hasPreviousPage`

The shared pagination utility from V11.6.2 remains the normalization boundary.

## Data path

```text
/admin/question-bank
        ↓
UnifiedQuestionBankWorkspace
        ↓
GET /api/admin/question-bank?page=&pageSize=&group=&status=&search=
        ↓
requireAdminApi()
        ↓
getAdminQuestionsPaginated()
        ↓
PostgreSQL COUNT + paginated SELECT
```

## Latest-version boundary

Question Bank displays one latest Question Version per logical Question. The repository therefore ranks versions with:

```text
ROW_NUMBER() OVER (
  PARTITION BY questionId
  ORDER BY createdAt DESC, id DESC
)
```

Only the latest row (`rn = 1`) enters the filtered/paginated collection.

## Database pagination

The implementation uses database pagination:

```text
COUNT(*)
LIMIT pageSize
OFFSET (page - 1) * pageSize
```

It does not load the complete Question Bank and then slice it in JavaScript.

## Compatibility

The existing `getQuestions()` compatibility function remains available for non-workspace internal callers. The Question Bank admin page and list API use the new paginated contract.

## Migration policy

No schema change is required. Existing Question/QuestionVersion/TestType fields and indexes are sufficient for this phase. Additional filter-specific indexing is deferred until the actual query patterns of Phase 11.7 are implemented and measured.
