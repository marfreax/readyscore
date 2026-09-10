import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2, Clock3 } from "lucide-react";
import { CustomerPageShell } from "../../../../components/app/CustomerPageShell";
import { getCurrentSession } from "../../../../lib/auth/session";
import { getAssessmentAboutPreTest } from "../../../../lib/assessment/about-pretest";

const TYPES = ["cognitive", "eq", "disc", "riasec"] as const;

export function generateStaticParams() { return TYPES.map((type) => ({ type })); }

export default async function AssessmentPreTestPage({ params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  if (!TYPES.includes(type as (typeof TYPES)[number])) notFound();
  const assessment = getAssessmentAboutPreTest(type);
  if (!assessment) notFound();
  const session = await getCurrentSession();
  if (!session) redirect(`/login?next=/assessments/${type}/pre-test`);

  return (
    <CustomerPageShell userName={session.user.name} eyebrow="Pre-Test" title={`Siap memulai ${assessment.label}?`} description="Pastikan Anda memahami tujuan, cara menjawab, durasi, dan persiapan sebelum masuk ke assessment.">
      <div className="space-y-6 pb-10">
        <Link href={`/assessments/${type}`} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-950"><ArrowLeft className="h-4 w-4" /> Kembali ke About Assessment</Link>
        <section className="rounded-[32px] border border-slate-200 bg-white p-7 shadow-sm sm:p-10">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div><p className="text-xs font-black uppercase tracking-[0.16em] text-indigo-600">{assessment.eyebrow}</p><h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{assessment.label}</h2><p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">{assessment.purpose}</p></div>
            <div className="flex shrink-0 gap-3"><div className="rounded-2xl bg-slate-50 p-4"><p className="text-lg font-black">{assessment.questionCount}</p><p className="mt-1 text-xs text-slate-500">soal</p></div><div className="rounded-2xl bg-slate-50 p-4"><Clock3 className="h-5 w-5 text-indigo-600" /><p className="mt-1 text-xs font-semibold text-slate-500">{assessment.duration}</p></div></div>
          </div>
        </section>
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
          <h2 className="text-xl font-bold">Sebelum Anda mulai</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">{assessment.whatToExpect}</p>
          <ul className="mt-5 space-y-3">{assessment.preparation.map((item) => <li key={item} className="flex items-start gap-3 text-sm font-semibold text-slate-700"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600" />{item}</li>)}</ul>
          <div className="mt-6 rounded-2xl border border-indigo-100 bg-indigo-50 p-5"><p className="text-sm font-bold text-indigo-900">Cara menjawab</p><p className="mt-2 text-sm leading-6 text-indigo-900/75">{assessment.responseInstruction}</p></div>
        </section>
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7"><h2 className="text-xl font-bold">Setelah selesai</h2><p className="mt-2 text-sm leading-6 text-slate-600">{assessment.resultSummary} Jawaban Anda akan diproses oleh assessment engine sesuai model assessment ini.</p></section>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm text-slate-500">Dengan melanjutkan, Anda siap mengerjakan {assessment.questionCount} soal dalam sekitar {assessment.duration}.</p><Link href={`/assessments/${type}/test`} className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 text-sm font-bold text-white hover:bg-indigo-700">Mulai Assessment <ArrowRight className="h-4 w-4" /></Link></div>
      </div>
    </CustomerPageShell>
  );
}
