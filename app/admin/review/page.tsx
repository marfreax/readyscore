import { requireAdmin } from "../../../lib/auth/admin";
import { getReviewStats, listReviewQueuePaginated } from "../../../lib/admin-review-repository";
import AdminReviewContentOperations from "../../../components/admin/AdminReviewContentOperations";

export default async function AdminReviewPage() {
  await requireAdmin();
  const [queue, stats] = await Promise.all([listReviewQueuePaginated({ page: 1, pageSize: 25 }), getReviewStats()]);
  return (
    <section className="rs-container py-8 sm:py-10">
      <div className="mb-8">
        <p className="rs-eyebrow">Content</p>
        <h1 className="rs-section-title mt-1 text-3xl">Review & Publishing</h1>
        <p className="rs-subtitle mt-2">Validate · Review · Approve · Publish · Activate · Archive</p>
      </div>
      <section className="mb-6 grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border bg-white p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Controlled publishing</p>
          <p className="mt-1 text-sm text-slate-600">Publishing requires controlled review and approval.</p>
        </div>
        <div className="rounded-2xl border bg-white p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Audit trail</p>
          <p className="mt-1 text-sm text-slate-600">Content operations are recorded for traceability.</p>
        </div>
        <div className="rounded-2xl border bg-white p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Version history</p>
          <p className="mt-1 text-sm text-slate-600">Historical content versions remain inspectable.</p>
        </div>
      </section>
      <AdminReviewContentOperations initialItems={queue.items} initialPagination={queue.pagination} initialStats={stats} />
    </section>
  );
}
