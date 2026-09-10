import { requireAdmin } from "../../../lib/auth/admin";
import { listAdminUsersPaginated } from "../../../lib/admin-users-repository";
import { AdminUsersOperations } from "../../../components/admin/AdminUsersOperations";

export default async function AdminUsersPage() {
  const admin = await requireAdmin();
  const result = await listAdminUsersPaginated({ page: 1, pageSize: 25 });

  return <section className="rs-container py-8 sm:py-10">
    <div className="mb-8"><p className="rs-eyebrow">Users & Access</p><h1 className="rs-section-title mt-1 text-3xl">Users</h1><p className="rs-subtitle mt-2 max-w-3xl">Safe administration untuk status akun dan role. Operasi bersifat non-destructive, terotorisasi server-side, membutuhkan konfirmasi, dan tercatat di audit trail.</p></div>
    <div className="mb-6 grid gap-3 sm:grid-cols-4">
      {[["Accounts",result.summary.total],["Active",result.summary.active],["Inactive",result.summary.inactive],["Admins",result.summary.admins]].map(([label,value])=><div key={label as string} className="rounded-2xl border bg-white p-5"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p><p className="mt-2 text-2xl font-black">{value}</p></div>)}
    </div>
    <div className="mb-6 rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950"><b>Safety boundary.</b> INACTIVE prevents authentication/session access, but does not delete or mutate attempts, answers, results, purchases, entitlements, or institution relationships. Role changes affect authorization only. Entitlement remains a separate concern.</div>
    <AdminUsersOperations initialUsers={result.items} initialPagination={result.pagination} currentAdminId={admin.id} />
  </section>;
}
