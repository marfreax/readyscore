import { requireAdmin } from "../../../lib/auth/admin";
import { listAssessmentConfigurations } from "../../../lib/assessment-configuration-repository";
import AssessmentConfigurationWorkspace from "../../../components/admin/AssessmentConfigurationWorkspace";

export default async function AdminAssessmentConfigurationPage() {
  await requireAdmin();
  const configurations = await listAssessmentConfigurations();
  return (
    <section className="rs-container py-8 sm:py-10">
      <div className="mb-8">
        <p className="rs-eyebrow">Content</p>
        <h1 className="rs-section-title mt-1 text-3xl">Assessment Configuration</h1>
        <p className="rs-subtitle mt-2">Instrument configuration · version-safe runtime contracts</p>
      </div>
      <AssessmentConfigurationWorkspace initial={configurations} />
    </section>
  );
}
