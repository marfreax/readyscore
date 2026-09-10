"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

export const ADMIN_PAGINATION_PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;
export type AdminPaginationPageSize = (typeof ADMIN_PAGINATION_PAGE_SIZE_OPTIONS)[number];

export type AdminPaginationProps = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: AdminPaginationPageSize) => void;
  pageSizeOptions?: readonly AdminPaginationPageSize[];
  disabled?: boolean;
};

function clampPage(page: number, totalPages: number): number {
  if (!Number.isFinite(page) || !Number.isInteger(page)) return 1;
  return Math.min(Math.max(page, 1), Math.max(totalPages, 1));
}

function buildPageNumbers(page: number, totalPages: number): Array<number | "ellipsis"> {
  if (totalPages <= 1) return [1];
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1);

  const values: Array<number | "ellipsis"> = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(totalPages - 1, page + 1);

  if (start > 2) values.push("ellipsis");
  for (let value = start; value <= end; value += 1) values.push(value);
  if (end < totalPages - 1) values.push("ellipsis");
  values.push(totalPages);

  return values;
}

export function AdminPagination({
  page,
  pageSize,
  totalItems,
  totalPages,
  hasNextPage,
  hasPreviousPage,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = ADMIN_PAGINATION_PAGE_SIZE_OPTIONS,
  disabled = false,
}: AdminPaginationProps) {
  const safePage = clampPage(page, totalPages);
  const safeTotalPages = Math.max(totalPages, 1);
  const start = totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const end = totalItems === 0 ? 0 : Math.min(safePage * pageSize, totalItems);
  const pageNumbers = buildPageNumbers(safePage, safeTotalPages);

  const goToPage = (nextPage: number) => {
    const bounded = Math.min(Math.max(nextPage, 1), safeTotalPages);
    if (bounded !== safePage && !disabled) onPageChange(bounded);
  };

  return (
    <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-500">
        <span aria-live="polite">
          {totalItems === 0 ? "Tidak ada data" : `Menampilkan ${start}–${end} dari ${totalItems}`}
        </span>

        {onPageSizeChange ? (
          <label className="inline-flex items-center gap-2">
            <span>Per halaman</span>
            <select
              value={pageSize}
              disabled={disabled}
              aria-label="Jumlah data per halaman"
              onChange={(event) => {
                const next = Number(event.target.value) as AdminPaginationPageSize;
                if (pageSizeOptions.includes(next)) onPageSizeChange(next);
              }}
              className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            >
              {pageSizeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>

      <nav aria-label="Pagination" className="flex items-center gap-1">
        <button
          type="button"
          className="rs-button rs-button-secondary h-9 px-2.5"
          aria-label="Halaman sebelumnya"
          disabled={disabled || !hasPreviousPage || safePage <= 1}
          onClick={() => goToPage(safePage - 1)}
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">Sebelumnya</span>
        </button>

        <div className="hidden items-center gap-1 sm:flex">
          {pageNumbers.map((value, index) =>
            value === "ellipsis" ? (
              <span key={`ellipsis-${index}`} className="px-2 text-xs font-bold text-slate-400" aria-hidden="true">
                …
              </span>
            ) : (
              <button
                key={value}
                type="button"
                className={`h-9 min-w-9 rounded-xl px-2.5 text-xs font-black transition ${
                  value === safePage
                    ? "bg-slate-900 text-white"
                    : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
                aria-current={value === safePage ? "page" : undefined}
                aria-label={`Halaman ${value}`}
                disabled={disabled}
                onClick={() => goToPage(value)}
              >
                {value}
              </button>
            ),
          )}
        </div>

        <span className="px-2 text-xs font-black text-slate-600 sm:hidden">
          {safePage} / {safeTotalPages}
        </span>

        <button
          type="button"
          className="rs-button rs-button-secondary h-9 px-2.5"
          aria-label="Halaman berikutnya"
          disabled={disabled || !hasNextPage || safePage >= safeTotalPages}
          onClick={() => goToPage(safePage + 1)}
        >
          <span className="hidden sm:inline">Berikutnya</span>
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </nav>
    </div>
  );
}
