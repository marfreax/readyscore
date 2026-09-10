"use client";

import { useCallback, useEffect, useState } from "react";
import { Eye, RefreshCw, X } from "lucide-react";
import { AdminPagination, type AdminPaginationPageSize } from "./AdminPagination";

type AuditEvent = {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  fromStatus: string | null;
  toStatus: string | null;
  actorUserId: string;
  metadata: unknown;
  createdAt: string;
};

type AuditDetailResponse = {
  ok: boolean;
  event?: AuditEvent;
  error?: { code?: string };
};

type AuditResponse = {
  ok: boolean;
  items?: AuditEvent[];
  pagination?: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  error?: { code?: string };
};

const DEFAULT_PAGE_SIZE: AdminPaginationPageSize = 25;

function actionLabel(action: string) {
  return action.replaceAll("_", " ");
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function stateLabel(value: string | null) {
  return value ? value.replaceAll("_", " ") : "—";
}

export function AdminAuditWorkspace() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<AdminPaginationPageSize>(DEFAULT_PAGE_SIZE);
  const [data, setData] = useState<AuditResponse>({ ok: true, items: [], pagination: {
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    totalItems: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  }});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<AuditEvent | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const load = useCallback(async (requestedPage: number, requestedPageSize: AdminPaginationPageSize) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(requestedPage),
        pageSize: String(requestedPageSize),
      });
      const response = await fetch(`/api/admin/audit?${params.toString()}`, {
        method: "GET",
        cache: "no-store",
        headers: { Accept: "application/json" },
      });
      const payload = (await response.json()) as AuditResponse;
      if (!response.ok || !payload.ok || !payload.pagination || !payload.items) {
        throw new Error(payload.error?.code || "ADMIN_AUDIT_FAILED");
      }
      setData(payload);
      if (payload.pagination.page !== requestedPage) setPage(payload.pagination.page);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "ADMIN_AUDIT_FAILED");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(page, pageSize);
  }, [load, page, pageSize]);

  const openDetail = useCallback(async (eventId: string) => {
    setDetailLoading(true);
    setDetailError(null);
    try {
      const response = await fetch(`/api/admin/audit/${encodeURIComponent(eventId)}`, {
        method: "GET",
        cache: "no-store",
        headers: { Accept: "application/json" },
      });
      const payload = (await response.json()) as AuditDetailResponse;
      if (!response.ok || !payload.ok || !payload.event) {
        throw new Error(payload.error?.code || "ADMIN_AUDIT_DETAIL_FAILED");
      }
      setSelectedEvent(payload.event);
    } catch (cause) {
      setDetailError(cause instanceof Error ? cause.message : "ADMIN_AUDIT_DETAIL_FAILED");
    } finally {
      setDetailLoading(false);
    }
  }, []);


  const pagination = data.pagination ?? {
    page,
    pageSize,
    totalItems: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  };
  const items = data.items ?? [];

  return (
    <section className="rs-container py-8 sm:py-10">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="rs-eyebrow">Auditability</p>
          <h1 className="rs-section-title mt-1 text-3xl">Audit Trail</h1>
          <p className="rs-subtitle mt-2 max-w-3xl">
            Riwayat operasi admin yang tersimpan secara immutable. Workspace ini bersifat read-only.
          </p>
        </div>
        <button
          type="button"
          className="rs-button rs-button-secondary w-fit"
          disabled={loading}
          onClick={() => void load(page, pageSize)}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} aria-hidden="true" />
          Refresh
        </button>
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-sm">
        <div>
          <p className="font-black text-slate-950">Admin Activity Log</p>
          <p className="mt-1 text-slate-500">Urutan terbaru terlebih dahulu dengan tie-breaker ID.</p>
        </div>
        <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-black text-slate-600">
          Read-only
        </span>
      </div>

      <div className="overflow-hidden rounded-3xl border bg-white shadow-sm">
        {loading && items.length === 0 ? (
          <div className="p-8 text-sm text-slate-500" aria-live="polite">Memuat audit event…</div>
        ) : error ? (
          <div className="p-8" role="alert">
            <p className="text-sm font-black text-rose-900">Audit trail tidak dapat dimuat.</p>
            <p className="mt-1 text-sm text-rose-700">Kode error: {error}</p>
            <button type="button" className="rs-button rs-button-secondary mt-4" onClick={() => void load(page, pageSize)}>
              Coba lagi
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="p-8">
            <p className="text-sm font-black text-slate-950">Belum ada audit event.</p>
            <p className="mt-1 text-sm text-slate-500">Aktivitas admin yang tercatat akan muncul di sini.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr className="text-[11px] font-black uppercase tracking-wide text-slate-500">
                  <th scope="col" className="px-5 py-4">Action</th>
                  <th scope="col" className="px-5 py-4">Entity</th>
                  <th scope="col" className="px-5 py-4">Actor</th>
                  <th scope="col" className="px-5 py-4">State</th>
                  <th scope="col" className="px-5 py-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((event) => (
                  <tr key={event.id} className="align-top hover:bg-slate-50/70">
                    <td className="px-5 py-4">
                      <button
                        type="button"
                        className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-black text-slate-800 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                        onClick={() => void openDetail(event.id)}
                        disabled={detailLoading}
                        aria-label={`View audit event ${event.id}`}
                      >
                        <Eye className="h-4 w-4" aria-hidden="true" />
                        {actionLabel(event.action)}
                      </button>
                      <p className="mt-2 font-mono text-[11px] text-slate-400">{event.id}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-xs font-black uppercase tracking-wide text-slate-500">{event.entityType}</p>
                      <p className="mt-1 break-all font-mono text-sm text-slate-800">{event.entityId}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="break-all font-mono text-xs text-slate-700">{event.actorUserId}</p>
                    </td>
                    <td className="px-5 py-4 text-xs">
                      <p className="font-semibold text-slate-500">{stateLabel(event.fromStatus)}</p>
                      <p className="my-1 text-slate-300">↓</p>
                      <p className="font-black text-slate-800">{stateLabel(event.toStatus)}</p>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">{formatDate(event.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-5">
        <AdminPagination
          page={pagination.page}
          pageSize={pagination.pageSize}
          totalItems={pagination.totalItems}
          totalPages={pagination.totalPages}
          hasNextPage={pagination.hasNextPage}
          hasPreviousPage={pagination.hasPreviousPage}
          disabled={loading}
          onPageChange={setPage}
          onPageSizeChange={(nextPageSize) => {
            setPageSize(nextPageSize);
            setPage(1);
          }}
        />
      </div>

      {selectedEvent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedEvent(null);
          }}
        >
          <div
            className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border bg-white shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="audit-detail-title"
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-6">
              <div>
                <p className="rs-eyebrow">Audit Detail</p>
                <h2 id="audit-detail-title" className="mt-1 text-2xl font-black text-slate-950">{actionLabel(selectedEvent.action)}</h2>
                <p className="mt-1 break-all font-mono text-xs text-slate-400">{selectedEvent.id}</p>
              </div>
              <button
                type="button"
                className="rounded-xl border p-2 text-slate-600 hover:bg-slate-100"
                onClick={() => setSelectedEvent(null)}
                aria-label="Close audit detail"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <div className="grid gap-5 p-6 sm:grid-cols-2">
              <DetailField label="Action" value={actionLabel(selectedEvent.action)} />
              <DetailField label="Actor" value={selectedEvent.actorUserId} mono />
              <DetailField label="Entity" value={selectedEvent.entityType} />
              <DetailField label="Entity ID" value={selectedEvent.entityId} mono />
              <DetailField label="Timestamp" value={formatDate(selectedEvent.createdAt)} />
              <DetailField label="From State" value={stateLabel(selectedEvent.fromStatus)} />
              <DetailField label="To State" value={stateLabel(selectedEvent.toStatus)} />
              <div className="sm:col-span-2">
                <p className="text-[11px] font-black uppercase tracking-wide text-slate-500">Metadata</p>
                {detailError ? (
                  <p className="mt-2 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-800">{detailError}</p>
                ) : detailLoading ? (
                  <p className="mt-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">Memuat detail…</p>
                ) : (
                  <MetadataView value={selectedEvent.metadata} />
                )}
              </div>
            </div>

            <div className="border-t border-slate-200 bg-slate-50 px-6 py-4 text-right">
              <span className="text-xs font-black uppercase tracking-wide text-slate-500">Read-only · Immutable audit event</span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function DetailField({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-[11px] font-black uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-2 break-all text-sm font-semibold text-slate-900 ${mono ? "font-mono" : ""}`}>{value}</p>
    </div>
  );
}

function MetadataView({ value }: { value: unknown }) {
  if (value === null || value === undefined) {
    return <p className="mt-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">No metadata recorded.</p>;
  }

  if (typeof value === "object" && !Array.isArray(value)) {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) {
      return <p className="mt-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">Empty metadata object.</p>;
    }
    return (
      <dl className="mt-2 overflow-hidden rounded-2xl border border-slate-200">
        {entries.map(([key, item]) => (
          <div key={key} className="grid gap-1 border-b border-slate-100 p-4 last:border-b-0 sm:grid-cols-[180px_1fr] sm:gap-4">
            <dt className="text-xs font-black text-slate-500">{key}</dt>
            <dd className="break-all font-mono text-xs text-slate-800">{formatMetadataValue(item)}</dd>
          </div>
        ))}
      </dl>
    );
  }

  return <pre className="mt-2 overflow-x-auto rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-800">{JSON.stringify(value, null, 2)}</pre>;
}

function formatMetadataValue(value: unknown): string {
  if (typeof value === "string") return value;
  if (value === null) return "null";
  if (typeof value === "undefined") return "undefined";
  return JSON.stringify(value);
}
