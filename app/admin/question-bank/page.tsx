import { requireAdmin } from "../../../lib/auth/admin";
import { getQuestionBankStats, getQuestionBankTestTypes, getQuestions } from "../../../lib/question-bank-repository";
import UnifiedQuestionBankWorkspace from "../../../components/admin/UnifiedQuestionBankWorkspace";

export default async function AdminQuestionBankPage() {
  await requireAdmin();
  const [questions, stats, testTypes] = await Promise.all([
    getQuestions({ limit: 5000 }),
    getQuestionBankStats(),
    getQuestionBankTestTypes(),
  ]);
  return (
    <main className="rs-page">
      <header className="border-b border-slate-200 bg-white">
        <div className="rs-container flex min-h-16 items-center justify-between gap-4 py-4">
          <div><p className="rs-eyebrow">ReadyScore Admin</p><h1 className="rs-section-title mt-1 text-2xl">Unified Question Bank</h1><p className="rs-subtitle mt-1">RIASEC · DISC · EQ · Cognitive</p></div>
          <div className="flex gap-2"><a href="/admin/assessment-config" className="rs-button rs-button-secondary">Assessment Config</a><a href="/app" className="rs-button rs-button-secondary">Customer App</a></div>
        </div>
      </header>
      <div className="rs-container py-8">
        <div className="mb-6 rounded-2xl border border-indigo-100 bg-indigo-50 p-5 text-sm text-indigo-900">
          <b>Version-safe content management.</b> Logical Question and Question Version are separate. Editing creates a new assessment-facing version; historical versions are never overwritten.
        </div>
        <UnifiedQuestionBankWorkspace initialQuestions={questions} initialStats={stats} testTypes={testTypes} />
      </div>
    </main>
  );
}
