import Link from "next/link";
import { getAdminQuestions, getAdminQuestionBankStats } from "../../../lib/question-bank-admin";

export default async function AdminQuestionBankPage() {
  const [stats, questions] = await Promise.all([
    getAdminQuestionBankStats(),
    getAdminQuestions(),
  ]);

  const riasec = questions
    .filter((q) => ["R", "I", "A", "S", "E", "C"].includes(q.domain.trim().toUpperCase()))
    .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));

  const counts = Object.fromEntries(
    ["R", "I", "A", "S", "E", "C"].map((d) => [
      d,
      riasec.filter((q) => q.domain.trim().toUpperCase() === d).length,
    ]),
  );

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">ReadyScore Admin</p>
            <h1 className="mt-1 text-2xl font-black">Question Bank</h1>
          </div>
          <Link href="/" className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold">Home</Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-8">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {[
            ["Total", stats.total],
            ["Draft", stats.draft],
            ["Mapped", stats.mapped],
            ["Approved", stats.approved],
            ["Published", stats.published],
          ].map(([label, value]) => (
            <div key={String(label)} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-bold text-slate-500">{label}</p>
              <p className="mt-2 text-2xl font-black">{value}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-indigo-600">RIASEC</p>
              <h2 className="mt-1 text-xl font-black">Current Question Bank</h2>
              <p className="mt-1 text-sm text-slate-500">Read-only runtime view dari PostgreSQL latest QuestionVersion.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(counts).map(([d, count]) => (
                <span key={d} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                  {d}: {count}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Dimension</th>
                  <th className="px-4 py-3">Subdomain</th>
                  <th className="px-4 py-3">Indicator</th>
                  <th className="px-4 py-3">Question</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Mapping</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {riasec.map((q) => (
                  <tr key={q.id} className="align-top hover:bg-slate-50">
                    <td className="whitespace-nowrap px-4 py-4 font-mono text-xs">{q.id}</td>
                    <td className="px-4 py-4 font-black">{q.domain}</td>
                    <td className="px-4 py-4 text-xs text-slate-600">{q.subdomain ?? "—"}</td>
                    <td className="px-4 py-4 text-xs text-slate-600">{q.indicator ?? "—"}</td>
                    <td className="max-w-xl px-4 py-4 leading-6">{q.text}</td>
                    <td className="px-4 py-4"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold">{q.status}</span></td>
                    <td className="px-4 py-4"><span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700">{q.mappingStatus}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {riasec.length === 0 && (
            <div className="mt-6 rounded-2xl bg-amber-50 p-5 text-sm text-amber-800">
              Belum ada RIASEC question yang tersedia di latest PostgreSQL QuestionVersion.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
