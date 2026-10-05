import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentSession } from "../../../../lib/auth/session";
import { getClientOrganizationWorkspace, listClientReports } from "../../../../lib/client-organization/service";
import ClientWorkspaceShell from "../ClientWorkspaceShell";

type Category = "ALL" | "CANDIDATE" | "EMPLOYEE" | "ALUMNI";

export default async function ClientReportsPage({
  params,
  searchParams,
}: {
  params: Promise<{ organizationId: string }>;
  searchParams: Promise<{ category?: string; q?: string }>;
}) {
  const session = await getCurrentSession();
  if (!session) redirect("/login?next=%2Fclient");
  const [{ organizationId }, query] = await Promise.all([params, searchParams]);
  const workspace = await getClientOrganizationWorkspace(session.user.id, organizationId);
  if (!workspace) redirect("/client");
  const search = query.q?.trim().slice(0, 120) ?? "";
  const allReports = await listClientReports(organizationId, session.user.id, search);
  const validCategories: Category[] = ["ALL", "CANDIDATE", "EMPLOYEE", "ALUMNI"];
  const category = validCategories.includes(query.category as Category) ? (query.category as Category) : "ALL";
  const reports = category === "ALL" ? allReports : allReports.filter((report) => report.category === category);
  const categories: { key: Category; label: string }[] = [
    { key: "ALL", label: "Semua" },
    { key: "EMPLOYEE", label: "Karyawan" },
    { key: "CANDIDATE", label: "Candidate" },
    { key: "ALUMNI", label: "Alumni" },
  ];

  return (
    <ClientWorkspaceShell organizationId={organizationId} organizationName={workspace.organization.name} websiteUrl={workspace.organization.websiteUrl} active="reports" role={workspace.membership.role}>
      <div className="space-y-5">
        <Link href={`/client/${encodeURIComponent(organizationId)}`} className="text-sm font-bold text-slate-600">← Kembali ke ringkasan</Link>
        <header className="rs-card mt-5 flex flex-wrap items-end justify-between gap-5 p-7 sm:p-9">
          <div>
            <p className="rs-eyebrow">{workspace.organization.name} · Client Report</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight">Laporan DISC</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Daftar assessment yang selesai dan akses ke laporan individual. Hasil hanya tersedia bagi anggota organisasi ini.</p>
          </div>
          <div className="rounded-2xl bg-indigo-50 px-5 py-4"><p className="text-xs font-bold uppercase tracking-wide text-indigo-700">Laporan selesai</p><p className="mt-1 text-2xl font-black text-indigo-950">{reports.length}</p></div>
        </header>

        <nav aria-label="Filter kategori laporan" className="mt-6 flex flex-wrap gap-2">
          {categories.map(({ key, label }) => <Link key={key} href={`/client/${encodeURIComponent(organizationId)}/reports${key === "ALL" ? "" : `?category=${key}`}`} aria-current={category === key ? "page" : undefined} className={`rounded-full px-4 py-2 text-sm font-bold ${category === key ? "bg-indigo-700 text-white" : "border border-slate-200 bg-white text-slate-700"}`}>{label}</Link>)}
        </nav>

        <form method="get" className="rs-card mt-4 flex flex-wrap items-end gap-3 p-4">
          {category !== "ALL" ? <input type="hidden" name="category" value={category} /> : null}
          <label className="min-w-[16rem] flex-1 text-sm font-bold text-slate-700">
            Cari laporan
            <input name="q" defaultValue={search} maxLength={120} placeholder="Nama, email, jabatan, atau departemen" className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-medium outline-none focus:border-indigo-500" />
          </label>
          <button type="submit" className="rs-button rs-button-secondary">Cari</button>
          {search ? <Link href={`/client/${encodeURIComponent(organizationId)}/reports${category === "ALL" ? "" : `?category=${category}`}`} className="px-3 py-3 text-sm font-bold text-slate-600">Hapus pencarian</Link> : null}
        </form>

        <section className="rs-card mt-5 overflow-hidden">
          {reports.length === 0 ? <p className="p-6 text-sm text-slate-600">Belum ada laporan DISC selesai untuk kategori ini.</p> : <div className="divide-y divide-slate-100">{reports.map((report) => (
            <article key={report.id} className="flex flex-wrap items-center justify-between gap-4 p-5 sm:px-6">
              <div className="min-w-0">
                <h2 className="truncate font-black">{report.participant?.fullName || report.participant?.email || "Peserta"}</h2>
                <p className="mt-1 text-sm text-slate-600">{labelCategory(report.category)}{report.jobTitle ? ` · ${report.jobTitle}` : ""}{report.department ? ` · ${report.department}` : ""}</p>
                <p className="mt-1 text-xs text-slate-500">{report.participant?.email} · {report.assessmentConfigurationVersion.questionCount} soal · {Math.ceil(report.questionPackageVersion.timeLimitSeconds / 60)} menit · selesai {report.completedAt ? new Date(report.completedAt).toLocaleDateString("id-ID") : "—"}</p>
                <p className="mt-1 text-xs text-slate-400">Paket {report.questionPackageVersion.version} · konfigurasi {report.assessmentConfigurationVersion.version} · Email hasil: {report.resultEmailStatus === "SENT" ? "terkirim" : report.resultEmailStatus === "FAILED" ? "gagal" : "menunggu"}</p>
              </div>
              <Link href={`/client/${encodeURIComponent(organizationId)}/results/${encodeURIComponent(report.id)}`} className="rs-button rs-button-secondary shrink-0">Buka laporan</Link>
            </article>
          ))}</div>}
        </section>
        <p className="mt-5 text-xs leading-5 text-slate-500">Hasil DISC adalah bahan refleksi dan diskusi tentang perilaku kerja. Hasil ini tidak menghasilkan keputusan otomatis untuk menerima atau menolak kandidat.</p>
        <p className="mt-2 text-xs text-slate-400">Assessment provided by ReadyScore</p>
      </div>
    </ClientWorkspaceShell>
  );
}

function labelCategory(category: string) {
  return category === "EMPLOYEE" ? "Karyawan" : category === "ALUMNI" ? "Alumni" : "Candidate";
}
