import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentSession } from "../../lib/auth/session";
import { getUserReportOverview } from "../../lib/reports/service";
import { CustomerPageShell } from "../../components/app/CustomerPageShell";
import { Card, Badge, EmptyState } from "../../components/ui/DesignSystem";
import { ExportPdfButton } from "../../components/reports/ExportPdfButton";
import { getV15CustomerReportState } from "../../lib/v15/customer-service";

const LABELS: Record<string, string> = {
  COGNITIVE: "Cognitive",
  EQ: "Emotional Intelligence",
  DISC: "DISC",
  RIASEC: "RIASEC",
};

function labelFor(type: string) {
  return LABELS[type.toUpperCase()] ?? type;
}

function formatDate(value: string | null) {
  return value
    ? new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value))
    : "Belum selesai";
}

export default async function ReportsPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/login?next=/reports");

  const [{ report, reportAccess }, v15State] = await Promise.all([
    getUserReportOverview(session.user.id),
    getV15CustomerReportState(session.user.id),
  ]);
  const completed = report.assessments.filter((item) => item.status === "COMPLETED" && item.resultAvailable);
  const inProgress = report.assessments.filter((item) => item.status === "IN_PROGRESS");
  const groupedCompleted = Object.entries(
    completed.reduce<Record<string, typeof completed>>((groups, assessment) => {
      const key = assessment.assessmentType.toUpperCase();
      groups[key] = groups[key] ?? [];
      groups[key].push(assessment);
      return groups;
    }, {}),
  ).sort(([a], [b]) => labelFor(a).localeCompare(labelFor(b), "id-ID"));

  return (
    <CustomerPageShell
      userName={session.user.name}
      eyebrow="Reports · REPORT_V1"
      title="Reports"
      description="Ringkasan hasil assessment dan bahan pembacaan yang tersedia untuk akun Anda. Setiap assessment tetap dibaca menggunakan makna dan aturan hasilnya sendiri."
    >
      <div id="readyscore-report" className="space-y-6 pb-10 rs-report-document">
        <section className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" aria-label="Report summary">
          <Card className="px-5 py-5">
            <p className="text-xs font-bold text-slate-500">Assessment tercatat</p>
            <p className="mt-2 text-3xl font-black">{report.assessmentCount}</p>
          </Card>
          <Card className="px-5 py-5">
            <p className="text-xs font-bold text-slate-500">Hasil selesai</p>
            <p className="mt-2 text-3xl font-black">{report.completedAssessmentCount}</p>
            <p className="mt-1 text-xs text-slate-400">completed attempts dengan result</p>
          </Card>
          <Card tone="accent" className="px-5 py-5">
            <p className="text-xs font-bold text-slate-500">Report status</p>
            <p className="mt-2 text-xl font-black">{reportAccess ? "Available" : "Limited"}</p>
          </Card>
        </section>

        {reportAccess ? (
          <Card tone="accent" className="px-5 py-6 sm:px-7">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2"><p className="rs-eyebrow">V15 · Personalized Report</p>{v15State.readiness === "READY" ? <Badge tone="success">Ready</Badge> : <Badge tone="warning">Not ready</Badge>}</div>
                <h2 className="mt-2 text-2xl font-black">Profil personal, rekomendasi jurusan & action plan</h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{v15State.readiness === "READY" ? `Report personal ${v15State.report?.document.pageCount ?? 0} halaman sudah siap dibaca.` : `Selesaikan ${v15State.missingTypes.length} assessment yang masih kurang untuk membuka personalized report.`}</p>
              </div>
              {v15State.readiness === "READY" ? <Link href="/reports/personalized" className="rs-button rs-button-primary">Buka Personalized Report</Link> : <Link href="/assessments" className="rs-button rs-button-primary">Lanjutkan Assessment</Link>}
            </div>
          </Card>
        ) : null}

        <Card className="px-5 py-6 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="rs-eyebrow">Available results & reports</p>
              <h2 className="rs-title mt-1 text-2xl">Hasil assessment Anda</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Semua completed attempt yang memiliki result tetap ditampilkan di sini. Buka result asli untuk membaca interpretasi assessment. Parent View dan PDF tersedia bila entitlement report aktif.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {reportAccess ? <ExportPdfButton targetId="readyscore-report" /> : null}
              <Link href="/activity" className="rs-button rs-button-secondary">Lihat activity</Link>
            </div>
          </div>

          {!reportAccess ? (
            <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4" role="status">
              <p className="font-black text-amber-950">Report lengkap belum aktif</p>
              <p className="mt-1 text-sm leading-6 text-amber-900">Data hasil assessment Anda tidak hilang. Report dan Parent View memerlukan entitlement report.</p>
              <Link href="/access" className="rs-button rs-button-primary mt-4">Lihat akses report</Link>
            </div>
          ) : null}

          {completed.length === 0 ? (
            <div className="mt-6">
              <EmptyState
                title="Belum ada result tersedia"
                description="Selesaikan assessment untuk membuat result yang dapat dibaca di workspace."
                action={<Link href="/assessments" className="rs-button rs-button-primary">Lihat Assessments</Link>}
              />
            </div>
          ) : (
            <div className="mt-6 space-y-5">
              {groupedCompleted.map(([assessmentType, assessments]) => (
                <section key={assessmentType} className="rounded-2xl border border-slate-200 p-4 sm:p-5" aria-labelledby={`report-group-${assessmentType}`}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.14em] text-indigo-600">{labelFor(assessmentType)}</p>
                      <h3 id={`report-group-${assessmentType}`} className="mt-1 text-lg font-black">{assessments.length} completed result{assessments.length === 1 ? "" : "s"}</h3>
                    </div>
                    <Badge tone="success">Completed</Badge>
                  </div>
                  <div className="mt-4 space-y-3">
                    {assessments.map((assessment) => (
                      <article key={assessment.attemptId} className="rounded-2xl bg-slate-50 p-4">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <dl className="grid gap-1 text-xs sm:grid-cols-2 sm:gap-x-8">
                            <div><dt className="text-slate-500">Selesai</dt><dd className="font-bold text-slate-700">{formatDate(assessment.completedAt)}</dd></div>
                            <div><dt className="text-slate-500">Result contract</dt><dd className="font-bold text-slate-700">{assessment.resultContractVersion ?? "—"}</dd></div>
                          </dl>
                          <div className="flex flex-wrap gap-2">
                            <Link href={`/result/${encodeURIComponent(assessment.attemptId)}`} className="rs-button rs-button-secondary">Open result</Link>
                            {reportAccess ? (
                              <Link href={`/reports/${encodeURIComponent(assessment.attemptId)}/parent`} className="rs-button rs-button-primary">Parent View</Link>
                            ) : (
                              <Link href="/access" className="rs-button rs-button-primary">Unlock report</Link>
                            )}
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}

          {inProgress.length > 0 ? (
            <section className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5" aria-labelledby="reports-in-progress">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="rs-eyebrow">In progress</p>
                  <h3 id="reports-in-progress" className="mt-1 text-lg font-black">{inProgress.length} assessment masih berjalan</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600">Selesaikan assessment yang sedang berjalan untuk menambah result ke workspace ini.</p>
                </div>
                <Link href="/assessments" className="rs-button rs-button-secondary">Lihat assessments</Link>
              </div>
            </section>
          ) : null}
        </Card>

        <Card tone="accent" className="px-5 py-6 sm:px-6">
          <p className="rs-eyebrow">How to read your reports</p>
          <ul className="mt-4 grid gap-3 text-sm leading-6 text-slate-700 md:grid-cols-1 sm:grid-cols-2">
            {report.parentView.guidance.map((item) => <li key={item} className="rounded-2xl bg-white/70 p-4">• {item}</li>)}
          </ul>
        </Card>

        <Card className="px-5 py-6 sm:px-6">
          <p className="rs-eyebrow">Report boundary</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              ["Test-specific", "Interpretasi tetap berasal dari assessment asal."],
              ["Read-only", "Reports tidak mengubah attempt atau scoring."],
              ["No universal score", "Tidak ada penggabungan skor lintas assessment."],
            ].map(([title, description]) => (
              <div key={title} className="rounded-2xl border border-slate-200 p-4">
                <p className="font-black">{title}</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </CustomerPageShell>
  );
}
