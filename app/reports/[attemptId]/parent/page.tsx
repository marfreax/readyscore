import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentSession } from "../../../../lib/auth/session";
import { getAssessmentReportV19_3, getParentReport, ReportAccessError } from "../../../../lib/reports/service";
import { CustomerPageShell } from "../../../../components/app/CustomerPageShell";

export default async function ParentReportPage({ params }: { params: Promise<{ attemptId: string }> }) {
  const session = await getCurrentSession();
  const { attemptId } = await params;

  if (!session) redirect(`/login?next=/reports/${encodeURIComponent(attemptId)}/parent`);

  try {
    const report = await getParentReport(session.user.id, attemptId);
    const assessment = report.assessments[0];
    const assessmentReport = await getAssessmentReportV19_3(session.user.id, attemptId);

    return (
      <CustomerPageShell
        userName={session.user.name}
        eyebrow="Parent View · Report_V1"
        title="Assessment Report"
        description="Ringkasan yang dirancang sebagai bahan percakapan orang tua dan peserta. Nilai dan interpretasi tetap mengikuti semantic contract assessment asal."
      >
        <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm sm:p-8">
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-5"><p className="text-xs font-bold text-slate-500">Assessment</p><p className="mt-2 text-xl font-black">{assessment.assessmentType}</p></div>
            <div className="rounded-2xl bg-slate-50 p-5"><p className="text-xs font-bold text-slate-500">Status</p><p className="mt-2 text-xl font-black">{assessment.status}</p></div>
            <div className="rounded-2xl bg-slate-50 p-5"><p className="text-xs font-bold text-slate-500">Result Contract</p><p className="mt-2 text-sm font-black">{assessment.resultContractVersion ?? "—"}</p></div>
          </div>

          <div className="mt-6 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl bg-white p-4 border border-slate-200"><p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">Peserta</p><p className="mt-2 font-black">{report.participantName}</p></div>
            <div className="rounded-2xl bg-white p-4 border border-slate-200"><p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">Account Owner</p><p className="mt-2 font-black">{report.accountOwnerName}</p></div>
            <div className="rounded-2xl bg-white p-4 border border-slate-200"><p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">Tanggal</p><p className="mt-2 font-black">{report.completedAt ? new Date(report.completedAt).toLocaleString("id-ID") : "—"}</p></div>
          </div>

          <section className="mt-6 rounded-3xl border border-indigo-100 bg-indigo-50 p-6">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-indigo-600">06 · Assessment Summary</p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">Bahan bacaan untuk memahami hasil</h2>
            <p className="mt-4 text-sm leading-7 text-slate-700">{assessmentReport.assessmentSummary.reading}</p>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl bg-white p-5"><p className="text-xs font-black uppercase tracking-[0.12em] text-indigo-600">Strengths</p><ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700">{assessmentReport.assessmentSummary.strengths.map((item) => <li key={item}>• {item}</li>)}</ul></div>
              <div className="rounded-2xl bg-white p-5"><p className="text-xs font-black uppercase tracking-[0.12em] text-indigo-600">Areas to Watch</p><ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700">{assessmentReport.assessmentSummary.areasToWatch.map((item) => <li key={item}>• {item}</li>)}</ul></div>
            </div>
          </section>

          <section className="mt-6 rounded-3xl border border-indigo-100 bg-indigo-50 p-6">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-indigo-600">How to use this report</p>
            <ul className="mt-4 space-y-2 text-sm leading-6 text-slate-700">{report.parentView.guidance.map((item) => <li key={item}>• {item}</li>)}</ul>
          </section>

          <section className="mt-6 rounded-3xl border border-slate-200 p-6">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Evidence boundary</p>
            <p className="mt-3 text-sm leading-7 text-slate-600">Parent view does not create a new score, does not combine heterogeneous scores, and does not assign study direction, major, or career. Report ini hanya menyajikan evidence yang sudah dimiliki assessment dan mempertahankan semantic owner pada result asli.</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href={`/result/${attemptId}`} className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white">Open original result →</Link>
              <a href={`/api/reports/${encodeURIComponent(attemptId)}/pdf`} className="rounded-xl border border-indigo-200 bg-indigo-50 px-5 py-3 text-sm font-bold text-indigo-700">Download PDF report</a>
              <Link href="/reports" className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold">Back to reports</Link>
            </div>
          </section>
        </section>
      </CustomerPageShell>
    );
  } catch (error) {
    const message = error instanceof ReportAccessError ? error.message : "Report tidak dapat dimuat.";
    return (
      <CustomerPageShell
        userName={session.user.name}
        eyebrow="Customer reports"
        title="Parent View belum tersedia"
        description="Report hanya dapat dibuka untuk attempt milik akun yang sedang login dan dengan entitlement yang sesuai."
      >
        <section className="rounded-3xl border border-amber-200 bg-amber-50 p-7 shadow-sm">
          <p className="text-sm leading-7 text-amber-950">{message}</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/reports" className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white">Kembali ke Reports</Link>
            <Link href="/app" className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold">Dashboard</Link>
          </div>
        </section>
      </CustomerPageShell>
    );
  }
}
