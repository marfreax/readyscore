/**
 * ReadyScore Admin — Pagination Repository Utility.
 *
 * Phase 11.6.2 establishes the reusable server-side pagination contract.
 * It is intentionally data-source agnostic: repositories may use the
 * normalized page/offset values with Prisma or another database adapter.
 *
 * This utility does not perform I/O and does not mutate data.
 */

export const ADMIN_PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;
export const ADMIN_DEFAULT_PAGE_SIZE = 25;
export const ADMIN_MAX_PAGE_SIZE = 100;

export type AdminPaginationInput = {
  page?: number;
  pageSize?: number;
};

export type AdminPagination = {
  page: number;
  pageSize: number;
  offset: number;
  limit: number;
};

export type AdminPaginationMeta = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export type AdminPaginatedResult<T> = {
  items: T[];
  pagination: AdminPaginationMeta;
};

function toFiniteInteger(value: number | undefined): number | undefined {
  if (value === undefined || !Number.isFinite(value)) return undefined;
  return Math.trunc(value);
}

/**
 * Normalize untrusted pagination input at the repository boundary.
 *
 * Page numbers below 1 become 1. Page sizes are normalized to one of the
 * supported admin page-size options; values above the maximum are capped at
 * the maximum. Invalid/missing values fall back to the default.
 */
export function normalizeAdminPagination(
  input: AdminPaginationInput = {},
): AdminPagination {
  const requestedPage = toFiniteInteger(input.page);
  const requestedPageSize = toFiniteInteger(input.pageSize);

  const page = Math.max(1, requestedPage ?? 1);

  let pageSize = ADMIN_DEFAULT_PAGE_SIZE;
  if (requestedPageSize !== undefined && requestedPageSize > 0) {
    if (requestedPageSize >= ADMIN_MAX_PAGE_SIZE) {
      pageSize = ADMIN_MAX_PAGE_SIZE;
    } else {
      const closest = ADMIN_PAGE_SIZE_OPTIONS.reduce((best, option) => {
        const bestDistance = Math.abs(best - requestedPageSize);
        const optionDistance = Math.abs(option - requestedPageSize);
        return optionDistance < bestDistance ? option : best;
      }, ADMIN_DEFAULT_PAGE_SIZE);
      pageSize = closest;
    }
  }

  return {
    page,
    pageSize,
    offset: (page - 1) * pageSize,
    limit: pageSize,
  };
}

/**
 * Build pagination metadata from a normalized page and total item count.
 */
export function buildAdminPaginationMeta(
  pagination: Pick<AdminPagination, "page" | "pageSize">,
  totalItems: number,
): AdminPaginationMeta {
  const safeTotalItems = Number.isFinite(totalItems)
    ? Math.max(0, Math.trunc(totalItems))
    : 0;
  const totalPages = Math.ceil(safeTotalItems / pagination.pageSize);

  return {
    page: pagination.page,
    pageSize: pagination.pageSize,
    totalItems: safeTotalItems,
    totalPages,
    hasNextPage: pagination.page < totalPages,
    hasPreviousPage: pagination.page > 1 && totalPages > 0,
  };
}

/**
 * Create the canonical paginated repository result.
 *
 * The helper intentionally does not silently change item order or slice a
 * collection. Repositories must query only the requested page at the data
 * source and pass those items here.
 */
export function createAdminPaginatedResult<T>(
  items: T[],
  pagination: Pick<AdminPagination, "page" | "pageSize">,
  totalItems: number,
): AdminPaginatedResult<T> {
  return {
    items,
    pagination: buildAdminPaginationMeta(pagination, totalItems),
  };
}
