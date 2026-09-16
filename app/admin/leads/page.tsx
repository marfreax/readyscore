import { requireAdmin } from "../../../lib/auth/admin";
import { listAdminBusinessLeadsPaginated } from "../../../lib/admin-business-leads-repository";
import { AdminBusinessLeadsOperations } from "../../../components/admin/AdminBusinessLeadsOperations";

export default async function AdminLeadsPage() {
  await requireAdmin();
  const result = await listAdminBusinessLeadsPaginated({ page: 1, pageSize: 25 });

  return <section className="rs-container py-8 sm:py-10">
    <div className="mb-8">
      <p className="rs-eyebrow">Acquisition</p>
      <h1 className="rs-section-title mt-1 text-3xl">Business Leads</h1>
      <p className="rs-subtitle mt-2 max-w-3xl">Lead hasil Free Assessment yang sudah menjadi business record. Data hanya dapat diakses oleh admin dan tetap terpisah dari CRM/sales pipeline.</p>
    </div>
    <div className="mb-6 rounded-3xl border border-blue-100 bg-blue-50 p-5 text-sm leading-6 text-blue-950">Source canonical: <b>FREE_ASSESSMENT</b>. Deduplication menggunakan WhatsApp atau normalized email. Assessment baru dapat memperbarui context lead yang sama tanpa membuat business lead kedua.</div>
    <AdminBusinessLeadsOperations initialLeads={result.items} initialPagination={result.pagination} initialSummary={result.summary} />
  </section>;
}
