import { requireAdmin } from "../../../lib/auth/admin";
import { normalizeAdminPagination } from "../../../lib/admin-pagination";
import {
  getAdminQuestionsPaginated,
  getQuestionBankStats,
  getQuestionBankTestTypes,
  normalizeQuestionBankFilterGroup,
  normalizeQuestionBankFilterStatus,
  normalizeQuestionBankSearch,
  normalizeQuestionBankSort,
  normalizeQuestionBankSortDirection,
} from "../../../lib/question-bank-repository";
import UnifiedQuestionBankWorkspace from "../../../components/admin/UnifiedQuestionBankWorkspace";

export default async function AdminQuestionBankPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();

  const params = await searchParams;
  const get = (key: string) => {
    const value = params?.[key];
    return Array.isArray(value) ? value[0] : value;
  };
  const group = normalizeQuestionBankFilterGroup(get("group") ?? "DISC");
  const status = normalizeQuestionBankFilterStatus(get("status"));
  const search = normalizeQuestionBankSearch(get("search")) ?? "";
  const sort = normalizeQuestionBankSort(get("sort"));
  const direction = normalizeQuestionBankSortDirection(get("direction"));
  const pagination = normalizeAdminPagination({
    page: Number(get("page") ?? 1),
    pageSize: Number(get("pageSize") ?? 25),
  });
  const workspaceGroup = group === "ALL" ? "DISC" : group;

  const [questions, stats, testTypes] = await Promise.all([
    getAdminQuestionsPaginated({
      page: pagination.page,
      pageSize: pagination.pageSize,
      group: workspaceGroup,
      status,
      search,
      sort,
      direction,
    }),
    getQuestionBankStats({ group: workspaceGroup, status, search }),
    getQuestionBankTestTypes(),
  ]);

  return (
    <section className="rs-container py-8 sm:py-10">
      <div className="mb-8">
        <p className="rs-eyebrow">Content</p>
        <h1 className="rs-section-title mt-1 text-3xl">Question Bank</h1>
        <p className="rs-subtitle mt-2">DISC · RIASEC · IQ & Cognitive · EQ</p>
      </div>
      <div className="mb-6 rounded-2xl border border-indigo-100 bg-indigo-50 p-5 text-sm text-indigo-900">
        <b>Version-safe content management.</b> Logical Question and Question Version are separate. Editing creates a new assessment-facing version; historical versions are never overwritten.
      </div>
      <UnifiedQuestionBankWorkspace
        initialQuestions={questions.items}
        initialPagination={{...questions.pagination,pageSize: questions.pagination.pageSize as 10 | 25 | 50 | 100}}
        initialStats={stats}
        testTypes={testTypes}
        initialWorkspaceState={{
          group: workspaceGroup,
          search,
          status,
          sort,
          direction,
          page: pagination.page,
          pageSize: pagination.pageSize as 10 | 25 | 50 | 100,
        }}
      />
    </section>
  );
}
