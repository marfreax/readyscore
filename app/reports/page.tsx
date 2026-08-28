import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentSession } from "../../lib/auth/session";
import { getUserReport, ReportAccessError } from "../../lib/reports/service";
import { CustomerPageShell } from "../../components/app/CustomerPageShell";

export default async function ReportsPage() {
  const session = await getCurrentSession();

  if (!session) redirect("/login?next=/reports");

  try {
    const report = await getUserReport(session.user.id);

    return (
      <CustomerPageShell
        userName={session.user.name}
        eyebrow="Customer reports"
        title={report.parentView.title}
        description={report.parentView.purpose}
      >
        <section className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold text-slate-500">Assessment</p>
            <p className="mt-2 text-3xl font-black">{report.assessmentCount}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold text-slate-500">Completed with result</p>
            <p className="mt-2 text-3xl font-black">{report.completedAssessmentCount}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold text-slate-500">Status</p>
            <p className="mt-2 text-xl font-black">{report.status}</p>
          </div>
        </section>

        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Assessment history</p>
              <h2 className="mt-1 text-xl font-black">Reports yang tersedia</h2>
            </div>
            <p className="text-xs font-semibold text-slate-400">Akses tetap mengikuti entitlement dan ownership akun.</p>
          </div>

          <div className="mt-5 space-y-3">
            {report.assessments.length === 0 ? (
              <div className="rounded-2xl bg-slate-50 p-6 text-center">
                <p className="font-black">Belum ada assessment pada akun ini.</p>
                <Link href="/app#assessments" className="mt-3 inline-block text-sm font-black text-indigo-600">Mulai assessment →</Link>
              </div>
            ) : report.assessments.map((assessment) => (
              <div key={assessment.attemptId} className="flex flex-col gap-4 rounded-2xl border border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-indigo-600">{assessment.assessmentType}</p>
                  <p className="mt-1 font-black">{assessment.resultAvailable ? "Result tersedia" : "Result belum tersedia"}</p>
                  <p className="mt-1 text-xs text-slate-500">{assessment.completedAt ? new Date(assessment.completedAt).toLocaleString("id-ID") : "Belum selesai"}</p>
                </div>
                {assessment.resultAvailable ? (
                  <div className="flex flex-wrap gap-2">
                    <Link href={`/result/${assessment.attemptId}`} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold">Result</Link>
                    <Link href={`/reports/${assessment.attemptId}/parent`} className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-bold text-white">Parent View →</Link>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </section>

        <section className="mt-6 rounded-3xl border border-indigo-100 bg-indigo-50 p-6">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-indigo-600">Parent guidance</p>
          <ul className="mt-4 space-y-2 text-sm leading-6 text-slate-700">{report.parentView.guidance.map((item) => <li key={item}>• {item}</li>)}</ul>
        </section>
      </CustomerPageShell>
    );
  } catch (error) {
    const message = error instanceof ReportAccessError ? error.message : "Report tidak dapat dimuat.";
    return (
      <CustomerPageShell
        userName={session.user.name}
        eyebrow="Customer reports"
        title="Report belum tersedia"
        description="Halaman reports tetap dapat dibuka, tetapi data report hanya ditampilkan ketika entitlement yang sesuai tersedia."
      >
        <section className="rounded-3xl border border-amber-200 bg-amber-50 p-7 shadow-sm">
          <p className="text-sm leading-7 text-amber-950">{message}</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/app#access" className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white">Lihat akses</Link>
            <Link href="/app" className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold">Kembali ke Dashboard</Link>
          </div>
        </section>
      </CustomerPageShell>
    );
  }
}
