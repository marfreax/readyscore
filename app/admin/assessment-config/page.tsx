import { requireAdmin } from "../../../lib/auth/admin";
import { listAssessmentConfigurations } from "../../../lib/assessment-configuration-repository";
import AssessmentConfigurationWorkspace from "../../../components/admin/AssessmentConfigurationWorkspace";

export default async function AdminAssessmentConfigurationPage() {
  await requireAdmin();
  const configurations = await listAssessmentConfigurations();
  return <main className="rs-page">
    <header className="border-b border-slate-200 bg-white"><div className="rs-container flex min-h-16 items-center justify-between gap-4 py-4">
      <div><p className="rs-eyebrow">ReadyScore Admin</p><h1 className="rs-section-title mt-1 text-2xl">Assessment Administration</h1><p className="rs-subtitle mt-1">Instrument configuration · version-safe runtime contracts</p></div>
      <div className="flex gap-2"><a href="/admin/question-bank" className="rs-button rs-button-secondary">Question Bank</a><a href="/app" className="rs-button rs-button-secondary">Customer App</a></div>
    </div></header>
    <div className="rs-container py-8"><AssessmentConfigurationWorkspace initial={configurations}/></div>
  </main>;
}
