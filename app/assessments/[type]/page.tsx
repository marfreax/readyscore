import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2, ShieldCheck } from "lucide-react";
import { CustomerPageShell } from "../../../components/app/CustomerPageShell";
import { getCurrentSession } from "../../../lib/auth/session";
import { getAssessmentAboutPreTest } from "../../../lib/assessment/about-pretest";

const TYPES = ["cognitive", "eq", "disc", "riasec"] as const;

export function generateStaticParams() {
  return TYPES.map((type) => ({ type }));
}

export default async function AssessmentAboutPage({ params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  if (!TYPES.includes(type as (typeof TYPES)[number])) notFound();
  const assessment = getAssessmentAboutPreTest(type);
  if (!assessment) notFound();
  const session = await getCurrentSession();
  if (!session) redirect(`/login?next=/assessments/${type}`);

  return (
    <CustomerPageShell userName={session.user.name} eyebrow="About Assessment" title={assessment.label} description="Pahami apa yang diukur, bagaimana Anda menjawab, dan apa yang perlu disiapkan sebelum memulai.">
      <div className="space-y-6 pb-10">
        <Link href="/assessments" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-950"><ArrowLeft className="h-4 w-4" /> Kembali ke Assessments</Link>
        <section className="rounded-[32px] border border-slate-200 bg-white p-7 shadow-sm sm:p-10">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700"><ShieldCheck className="h-4 w-4" /> ReadyScore {assessment.eyebrow}</span>
              <p className="mt-6 text-xs font-black uppercase tracking-[0.16em] text-slate-400">Tentang assessment</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{assessment.description}</h2>
              <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">{assessment.purpose}</p>
            </div>
            <div className="grid shrink-0 grid-cols-2 gap-3 sm:w-56">
              <div className="rounded-2xl bg-slate-50 p-4"><p className="text-lg font-black">{assessment.questionCount}</p><p className="mt-1 text-xs text-slate-500">soal</p></div>
              <div className="rounded-2xl bg-slate-50 p-4"><p className="text-lg font-black">{assessment.duration}</p><p className="mt-1 text-xs text-slate-500">durasi</p></div>
            </div>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-xl font-bold">Yang diukur</h2><ul className="mt-5 space-y-3">{assessment.measures.map((item) => <li key={item} className="flex items-start gap-3 text-sm font-semibold text-slate-700"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600" /> {item}</li>)}</ul></section>
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-xl font-bold">Batas interpretasi</h2><ul className="mt-5 space-y-3">{assessment.limitations.map((item) => <li key={item} className="flex items-start gap-3 text-sm font-semibold text-slate-700"><span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-slate-400" /> {item}</li>)}</ul></section>
        </div>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
          <h2 className="text-xl font-bold">Apa yang akan Anda lakukan?</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">{assessment.whatToExpect}</p>
          <div className="mt-5 rounded-2xl bg-slate-50 p-5"><p className="text-sm font-bold">Cara menjawab</p><p className="mt-2 text-sm leading-6 text-slate-600">{assessment.responseInstruction}</p></div>
          <div className="mt-5 rounded-2xl border border-indigo-100 bg-indigo-50 p-5"><p className="text-sm font-bold text-indigo-900">Hasil yang akan Anda dapatkan</p><p className="mt-2 text-sm leading-6 text-indigo-900/75">{assessment.resultSummary}</p></div>
        </section>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">Siap? Lihat instruksi singkat dan persiapan terakhir sebelum assessment dimulai.</p>
          <Link href={`/assessments/${type}/pre-test`} className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 text-sm font-bold text-white hover:bg-indigo-700">Lanjut ke Pre-Test <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </div>
    </CustomerPageShell>
  );
}
