import { requireAdmin } from "../../../lib/auth/admin";
import { getReviewStats, listReviewQueue } from "../../../lib/admin-review-repository";
import AdminReviewContentOperations from "../../../components/admin/AdminReviewContentOperations";

export default async function AdminReviewPage() {
  await requireAdmin();
  const [items, stats] = await Promise.all([listReviewQueue(), getReviewStats()]);
  return <main className="rs-page">
    <script type="application/json" dangerouslySetInnerHTML={{__html: JSON.stringify({ title: "Review & Content Operations" })}} />
    <header className="border-b border-slate-200 bg-white">
      <div className="rs-container flex min-h-16 items-center justify-between gap-4 py-4">
        <div><p className="rs-eyebrow">ReadyScore Admin</p><h1 className="rs-section-title mt-1 text-2xl">Review & Content Operations</h1><p className="rs-subtitle mt-1">Validate · Review · Approve · Publish · Activate · Archive</p></div>
        <nav className="flex flex-wrap gap-2"><a href="/admin/question-bank" className="rs-button rs-button-secondary">Question Bank</a><a href="/admin/assessment-config" className="rs-button rs-button-secondary">Assessment Config</a><a href="/app" className="rs-button rs-button-secondary">Customer App</a></nav>
      </div>
    </header>
    <div className="rs-container py-8"><section className="mb-6 grid gap-3 md:grid-cols-3"><div className="rounded-xl border bg-white p-4"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Controlled publishing.</p><p className="mt-1 text-sm text-slate-600">Publishing requires controlled review and approval.</p></div><div className="rounded-xl border bg-white p-4"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Audit trail</p><p className="mt-1 text-sm text-slate-600">Content operations are recorded for traceability.</p></div><div className="rounded-xl border bg-white p-4"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Version history</p><p className="mt-1 text-sm text-slate-600">Historical content versions remain inspectable.</p></div></section><AdminReviewContentOperations initialItems={items} initialStats={stats}/></div>
  </main>;
}
