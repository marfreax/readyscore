import Link from "next/link";
import { getAttemptResult, RuntimeError } from "../../../lib/assessment/runtime-service";

const labels: Record<string, string> = {
  R: "Realistic",
  I: "Investigative",
  A: "Artistic",
  S: "Social",
  E: "Enterprising",
  C: "Conventional",
};

export default async function ResultPage({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const { attemptId } = await params;

  try {
    const result = await getAttemptResult(attemptId);
    const payload = result as typeof result & {
      riasec?: {
        measurement?: {
          dimensionScores?: Array<{
            dimension: string;
            score: number | null;
            answeredCount: number;
            questionCount: number;
          }>;
          topCode?: string | null;
          coveragePercent?: number;
        };
      };
    };
    const measurement = payload.riasec?.measurement;
    const dimensions = measurement?.dimensionScores ?? result.domainScores.map((d) => ({
      dimension: d.domainId,
      score: d.score,
      answeredCount: d.questionCount,
      questionCount: d.questionCount,
    }));

    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-950 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-[32px] border border-slate-200 bg-white p-7 shadow-sm sm:p-10">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">
              {result.assessmentType}
            </p>
            <h1 className="mt-3 text-4xl font-black tracking-tight">Hasil Assessment</h1>
            <p className="mt-3 text-sm text-slate-500">
              Attempt {result.attemptId}
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl bg-slate-50 p-5">
                <p className="text-xs font-bold text-slate-500">Overall Score</p>
                <p className="mt-2 text-3xl font-black">{result.overallScore}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-5">
                <p className="text-xs font-bold text-slate-500">Band</p>
                <p className="mt-2 text-xl font-black">{result.band}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-5">
                <p className="text-xs font-bold text-slate-500">Coverage</p>
                <p className="mt-2 text-3xl font-black">{result.dataSufficiency.percentage}%</p>
              </div>
            </div>

            {result.assessmentType === "RIASEC" && (
              <>
                <div className="mt-8 rounded-3xl bg-slate-950 p-6 text-white">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-300">RIASEC Profile</p>
                  <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
                    <div>
                      <p className="text-4xl font-black">{measurement?.topCode ?? "—"}</p>
                      <p className="mt-1 text-sm text-slate-400">Top Code</p>
                    </div>
                    <p className="text-sm text-slate-300">{measurement?.coveragePercent ?? result.dataSufficiency.percentage}% coverage</p>
                  </div>
                </div>

                <div className="mt-6 grid gap-3 md:grid-cols-2">
                  {dimensions.map((item) => (
                    <div key={item.dimension} className="rounded-2xl border border-slate-200 p-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-lg font-black">{item.dimension}</p>
                          <p className="text-xs text-slate-500">{labels[item.dimension] ?? item.dimension}</p>
                        </div>
                        <p className="text-2xl font-black">{item.score ?? 0}</p>
                      </div>
                      <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-indigo-600" style={{ width: `${Math.max(0, Math.min(100, item.score ?? 0))}%` }} />
                      </div>
                      <p className="mt-2 text-xs text-slate-400">
                        {item.answeredCount} / {item.questionCount} answered
                      </p>
                    </div>
                  ))}
                </div>
              </>
            )}

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/app" className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white">
                Kembali ke App
              </Link>
              <Link href="/" className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold">
                Home
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  } catch (error) {
    const message = error instanceof RuntimeError ? error.message : "Hasil assessment tidak dapat dimuat.";
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
        <div className="max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-600">Result</p>
          <h1 className="mt-3 text-2xl font-black">Hasil belum tersedia</h1>
          <p className="mt-3 text-sm leading-6 text-slate-500">{message}</p>
          <Link href="/app" className="mt-6 inline-block rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white">
            Kembali
          </Link>
        </div>
      </main>
    );
  }
}
