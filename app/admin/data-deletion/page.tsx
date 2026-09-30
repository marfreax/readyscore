import { requireAdmin } from "../../../lib/auth/admin";
import { listDataDeletionRequests } from "../../../lib/privacy/data-deletion";
import { DataDeletionAdmin } from "../../../components/admin/DataDeletionAdmin";

export default async function AdminDataDeletionPage() {
  await requireAdmin();
  const requests = await listDataDeletionRequests();
  return <section className="rs-container py-8 sm:py-10"><div className="mb-8"><p className="rs-eyebrow">Privacy Operations</p><h1 className="rs-section-title mt-1 text-3xl">Data Deletion Requests</h1><p className="rs-subtitle mt-2 max-w-3xl">Verifikasi dan proses permintaan penghapusan data. Processing mempertahankan historical records yang dibutuhkan dan menganonimkan identitas aplikasi.</p></div><DataDeletionAdmin initialRequests={requests.map((r) => ({ ...r, requestedAt: r.requestedAt.toISOString(), processedAt: r.processedAt?.toISOString() ?? null }))} /></section>;
}
