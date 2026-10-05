import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentSession } from "../../../../../lib/auth/session";
import { getClientAssessmentResult, getClientOrganizationWorkspace } from "../../../../../lib/client-organization/service";
import { interpretDisc } from "../../../../../lib/assessment/disc/interpretation";
import ClientWorkspaceShell from "../../ClientWorkspaceShell";

export default async function ClientDiscResultPage({
  params,
}: {
  params: Promise<{ organizationId: string; invitationId: string }>;
}) {
  const session = await getCurrentSession();
  if (!session) redirect("/login?next=%2Fclient");
  const { organizationId, invitationId } = await params;
  const workspace = await getClientOrganizationWorkspace(session.user.id, organizationId);
  if (!workspace) redirect("/client");
  const result = await getClientAssessmentResult(organizationId, invitationId, session.user.id);

  if (!result) {
    return <ClientWorkspaceShell organizationId={organizationId} organizationName={workspace.organization.name} websiteUrl={workspace.organization.websiteUrl} active="reports" role={workspace.membership.role}><section className="rs-card max-w-2xl p-7"><h1 className="text-2xl font-black">Hasil belum tersedia</h1><p className="mt-2 text-sm text-slate-600">Hasil tidak ditemukan atau assessment belum selesai.</p><Link href={`/client/${encodeURIComponent(organizationId)}/reports`} className="rs-button rs-button-primary mt-5">Kembali ke laporan</Link></section></ClientWorkspaceShell>;
  }

  const rawResult = result.assessmentAttempt!.result!.result as unknown as Parameters<typeof interpretDisc>[0];
  const interpretation = interpretDisc(rawResult);
  const measurement = rawResult.disc?.measurement as { dimensionScores?: Array<{ dimension: string; score: number; selectedCount: number }> } | undefined;

  return (
    <ClientWorkspaceShell organizationId={organizationId} organizationName={result.organization.name} websiteUrl={result.organization.websiteUrl} active="reports" role={workspace.membership.role}>
      <div className="mx-auto max-w-5xl space-y-5">
        <Link href={`/client/${encodeURIComponent(organizationId)}/reports`} className="text-sm font-bold text-slate-600">← Kembali ke laporan</Link>
        <header className="rs-card mt-5 p-7 sm:p-9">
          <p className="rs-eyebrow">{result.organization.name} · Laporan DISC</p>
          <h1 className="mt-2 text-3xl font-black">{result.participant!.fullName}</h1>
          <p className="mt-2 text-sm text-slate-600">{result.category === "CANDIDATE" ? "Candidate" : result.category === "EMPLOYEE" ? "Karyawan" : "Alumni"}{result.jobTitle ? ` · ${result.jobTitle}` : ""}{result.department ? ` · ${result.department}` : ""}</p>
          <p className="mt-1 text-xs text-slate-500">Selesai {result.completedAt?.toLocaleDateString("id-ID") ?? "—"} · Assessment provided by ReadyScore</p>
        </header>

        <section className="rs-card mt-6 p-7">
          <p className="rs-eyebrow">Pola utama</p>
          <h2 className="mt-2 text-2xl font-black">{interpretation.primaryPattern.name} · {interpretation.secondaryPattern.name}</h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-700">{interpretation.summary}</p>
          <p className="mt-4 rounded-xl bg-indigo-50 p-4 text-sm leading-6 text-indigo-950">Gunakan hasil sebagai bahan refleksi dan diskusi tentang komunikasi serta kolaborasi. DISC tidak menentukan kelayakan kerja dan bukan keputusan otomatis untuk menerima atau menolak kandidat.</p>
        </section>

        <section className="rs-card mt-6 p-7">
          <h2 className="text-xl font-black">Profil pilihan DISC</h2>
          <p className="mt-1 text-xs text-slate-500">Persentase menunjukkan proporsi pilihan dalam assessment ini; jumlah dimensi berjumlah 100%.</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {(measurement?.dimensionScores ?? []).map((item) => <div key={item.dimension} className="rounded-2xl border border-slate-200 p-4">
              <div className="flex justify-between gap-3"><span className="font-bold">{dimensionName(item.dimension)}</span><span className="font-black">{item.score}%</span></div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-indigo-600" style={{ width: `${Math.max(0, Math.min(100, item.score))}%` }} /></div>
            </div>)}
          </div>
        </section>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <section className="rs-card p-6"><h2 className="text-lg font-black">Potensi kekuatan</h2><ul className="mt-3 space-y-2 text-sm text-slate-700">{interpretation.potentialStrengths.map((item) => <li key={item}>• {item}</li>)}</ul></section>
          <section className="rs-card p-6"><h2 className="text-lg font-black">Area untuk diperhatikan</h2><ul className="mt-3 space-y-2 text-sm text-slate-700">{interpretation.potentialChallenges.map((item) => <li key={item}>• {item}</li>)}</ul></section>
        </div>
        <p className="mt-6 text-xs leading-5 text-slate-500">Client Admin dan Viewer yang memiliki akses organisasi dapat melihat laporan ini. Hasil mengikuti paket dan versi interpretasi yang digunakan saat assessment.</p>
      </div>
    </ClientWorkspaceShell>
  );
}

function dimensionName(value: string) {
  return ({ D: "Dominance", I: "Influence", S: "Steadiness", C: "Conscientiousness" } as Record<string, string>)[value] ?? value;
}
