import { requireAdmin } from "../../../lib/auth/admin";
import { listQuestionPackages } from "../../../lib/question-package-repository";
import QuestionPackageWorkspace from "../../../components/admin/QuestionPackageWorkspace";

export default async function AdminQuestionPackagesPage() {
  await requireAdmin();
  const packages = await listQuestionPackages();
  return (
    <section className="rs-container py-8 sm:py-10">
      <div className="mb-8">
        <p className="rs-eyebrow">Content</p>
        <h1 className="rs-section-title mt-1 text-3xl">Question Packages</h1>
        <p className="rs-subtitle mt-2 max-w-3xl">V13.1 · validated assessment delivery forms · package configuration only</p>
      </div>
      <QuestionPackageWorkspace initial={packages} />
    </section>
  );
}
