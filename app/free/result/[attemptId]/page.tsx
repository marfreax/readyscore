import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAttemptResult, RuntimeError } from "../../../../lib/assessment/runtime-service";
import { prisma } from "../../../../lib/db/prisma";
import { buildFreeReport } from "../../../../lib/free-report";
import type { AssessmentResult } from "../../../../lib/assessment/types";
import FreeLeadGate from "../../../../components/free/FreeLeadGate";
import FreeReportDeliveryStatus from "../../../../components/free/FreeReportDeliveryStatus";
import FreePremiumOffer from "../../../../components/free/FreePremiumOffer";
import FunnelPageTracker from "../../../../components/free/FunnelPageTracker";

export const dynamic = "force-dynamic";

export default async function FreeResultPage({ params }: { params: Promise<{ attemptId: string }> }) {
  const { attemptId } = await params;
  let result: AssessmentResult;
  try { result = await getAttemptResult(attemptId) as AssessmentResult; }
  catch (error) { if (error instanceof RuntimeError) notFound(); throw error; }
  if (result.assessmentType !== "FREE") notFound();

  const report = buildFreeReport(result);
  const lead = await prisma.freeLeadCapture.findUnique({ where: { attemptId } });

  return <><FunnelPageTracker event="instant_result_view" attemptId={attemptId} />
  <main className="min-h-screen bg-[#F8FAFF] px-4 py-8 text-[#0B1D3A]">
    <div className="mx-auto max-w-2xl">
      <header className="flex items-center"><Image src="/readyscore-logo.png" alt="ReadyScore Personality Assessment" width={2048} height={673} priority className="h-9 w-auto object-contain sm:h-10" /></header>
      <section className="mt-8 rounded-[28px] border border-slate-200 bg-white p-7 shadow-sm sm:p-10">
        <span className="inline-flex rounded-full bg-teal-50 px-3 py-1 text-[11px] font-black tracking-widest text-teal-700">HASIL INSTANT</span>
        <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">Kamu Tipe <span className="text-[#0A4C9A]">{report.typeName}</span></h1>
        <p className="mt-4 text-sm leading-7 text-slate-600">{report.interpretation}</p>
        <div className="mt-7 rounded-2xl border border-blue-100 bg-blue-50/60 p-5">
          <p className="text-xs font-black uppercase tracking-widest text-[#0A4C9A]">Satu arah yang layak dieksplorasi</p>
          <p className="mt-3 text-sm font-bold text-slate-800">{report.recommendations[0]}</p>
        </div>

        {!lead ? <><FunnelPageTracker event="locked_insight_view" attemptId={attemptId} /><div className="mt-7 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5">
          <p className="text-sm font-black">Masih ada insight lain di Free Report</p>
          <div className="mt-4 grid gap-2 text-sm text-slate-400"><p className="rounded-xl bg-white p-3 blur-[4px] select-none">{report.recommendations[1]} • {report.recommendations[2]}</p><p className="rounded-xl bg-white p-3 blur-[4px] select-none">Kekuatan utama kamu</p><p className="rounded-xl bg-white p-3 blur-[4px] select-none">Gaya belajar yang mungkin lebih cocok</p></div>
        </div><FreeLeadGate attemptId={attemptId} /></> : <><section className="mt-8 rounded-[28px] border border-emerald-100 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-xs font-black uppercase tracking-[.16em] text-emerald-700">FREE REPORT TERBUKA</p>
          <h2 className="mt-2 text-2xl font-black">Halo, {lead.name}.</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">Berikut ringkasan hasil yang bisa kamu gunakan sebagai titik awal eksplorasi.</p>
          <div className="mt-6 grid gap-5">
            <div><p className="text-xs font-black uppercase tracking-widest text-slate-400">Kekuatan awal</p><ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700">{report.strengths.map((item) => <li key={item}>✓ {item}</li>)}</ul></div>
            <div><p className="text-xs font-black uppercase tracking-widest text-slate-400">Gaya belajar</p><p className="mt-3 text-sm leading-7 text-slate-700">{report.learningStyle}</p></div>
            <div><p className="text-xs font-black uppercase tracking-widest text-slate-400">3 jurusan untuk dieksplorasi</p><ol className="mt-3 space-y-2 text-sm font-bold text-slate-700">{report.recommendations.map((item, index) => <li key={item}>{index + 1}. {item}</li>)}</ol></div>
          </div>
          <div className="mt-7 rounded-2xl bg-slate-50 p-5"><p className="text-sm font-black">Ini adalah Free Report</p><p className="mt-1 text-xs leading-5 text-slate-500">Gunakan hasil ini sebagai bahan eksplorasi, bukan sebagai penentu tunggal pilihan jurusan.</p></div><div className="mt-5 flex flex-wrap gap-3"><Link href={`/api/free/report/pdf?attemptId=${encodeURIComponent(attemptId)}`} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#0B1D3A] px-5 text-sm font-black text-white">Download Free Report PDF</Link></div><FreeReportDeliveryStatus attemptId={attemptId} />
        </section><FreePremiumOffer /></>}
      </section>
      <Link href="/" className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-black text-[#0B1D3A]">Kembali ke ReadyScore</Link>
    </div>
  </main></>;
}
