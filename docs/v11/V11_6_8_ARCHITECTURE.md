# ReadyScore V11.6.8 — Users Pagination Architecture

## Scope
Apply the reusable Phase 11.6 pagination contract to Admin Users.

## Contract
- Database-level `count()` + `findMany({ skip, take })`.
- Deterministic order: `createdAt DESC, id DESC`.
- Default page size 25; supported 10/25/50/100; maximum 100.
- Server-side authorization remains mandatory.
- User active-entitlement aggregation is bounded to the requested page user IDs.
- Existing user mutation governance is preserved.
- No database migration.

## UI
`/admin/users` renders the initial page server-side and uses the existing `AdminPagination` component for page and page-size navigation.

## Safety
Pagination is read-only. It does not change roles/statuses or historical customer data. Existing mutation actions remain confirmation-protected, server-authorized, and audited.

## Non-goals
Search, filter, sorting, URL-state persistence, bulk operations, and global search remain Phase 11.7+ scope.
