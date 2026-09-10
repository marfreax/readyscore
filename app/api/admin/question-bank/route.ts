import { NextResponse } from "next/server";
import { requireAdminApi } from "../../../../lib/auth/admin";
import { parseQuestionCsvForGroup, questionBankTemplate } from "../../../../lib/question-bank-csv";
import { normalizeQuestionGroup, questionGroupFromTestTypeCode } from "../../../../lib/question-bank-v11";
import { activateQuestion, archiveQuestion, approveMapping, approveQuestion, createLogicalQuestion, createQuestionVersion, duplicateQuestion, analyzeQuestionBankImportDuplicates, getAdminQuestionsPaginated, getQuestionBankGroupStats, getQuestionBankStats, getQuestionBankTestTypes, importAdminQuestions, publishQuestion, unpublishQuestion } from "../../../../lib/question-bank-repository";

export const runtime = "nodejs";
function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "ADMIN_QUESTION_BANK_ERROR";
  const status = message === "UNAUTHENTICATED" ? 401 : message === "FORBIDDEN" ? 403 : message.includes("NOT_FOUND") ? 404 : 400;
  return NextResponse.json({ ok: false, error: { code: message } }, { status });
}
export async function GET(request: Request) {
  try {
    await requireAdminApi();
    const url = new URL(request.url);
    const [questions, stats, testTypes, groups] = await Promise.all([
      getAdminQuestionsPaginated({
        search: url.searchParams.get("search") ?? undefined,
        group: url.searchParams.get("group") ?? undefined,
        status: url.searchParams.get("status") ?? undefined,
        sort: url.searchParams.get("sort") ?? undefined,
        direction: url.searchParams.get("direction") ?? undefined,
        page: Number(url.searchParams.get("page") ?? 1),
        pageSize: Number(url.searchParams.get("pageSize") ?? 25),
      }),
      getQuestionBankStats({
        group: url.searchParams.get("group") ?? undefined,
        status: url.searchParams.get("status") ?? undefined,
        search: url.searchParams.get("search") ?? undefined,
      }), getQuestionBankTestTypes(), getQuestionBankGroupStats(),
    ]);
    return NextResponse.json({ ok: true, questions: questions.items, pagination: questions.pagination, stats, testTypes, groups });
  } catch (error) { return errorResponse(error); }
}
export async function POST(request: Request) {
  try {
    const admin = await requireAdminApi();
    const contentType = request.headers.get("content-type") ?? "";
    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      const action = String(form.get("action") ?? "").toUpperCase();
      const group = normalizeQuestionGroup(String(form.get("group") ?? ""));
      const file = form.get("file");
      if (!(file instanceof File)) throw new Error("IMPORT_FILE_REQUIRED");
      const text = await file.text();
      const parsed = parseQuestionCsvForGroup(text, file.name, group);
      const testTypes = await getQuestionBankTestTypes();
      const testTypeCode = group === "IQ_COGNITIVE" ? "COGNITIVE" : group;
      const testType = testTypes.find(t => t.code === testTypeCode);
      if (!testType) throw new Error(`TEST_TYPE_NOT_FOUND:${testTypeCode}`);
      const questions = parsed.map(q => ({ ...q, questionGroup: group, questionId: q.id, questionVersionId: "IMPORT", version: "v1", testTypeCode, testTypeName: testType.name } as any));
      if (action === "PREVIEW") {
        const duplicateAnalysis = await analyzeQuestionBankImportDuplicates(questions.map((q) => q.id));
        return NextResponse.json({ ok: true, preview: questions, count: questions.length, group, duplicateAnalysis });
      }
      if (action !== "IMPORT") throw new Error("INVALID_IMPORT_ACTION");
      const result = await importAdminQuestions(questions, "append", admin.id, group);
      return NextResponse.json({ ok: true, imported: result });
    }
    const body = await request.json();
    const action = String(body.action ?? "").toUpperCase();
    let question;
    switch (action) {
      case "CREATE": question = await createLogicalQuestion(body.input); break;
      case "EDIT": question = await createQuestionVersion(String(body.questionId), body.input); break;
      case "DUPLICATE": question = await duplicateQuestion(String(body.questionId), String(body.newCode ?? "")); break;
      case "APPROVE_MAPPING": question = await approveMapping(String(body.questionId)); break;
      case "APPROVE": question = await approveQuestion(String(body.questionId)); break;
      case "ACTIVATE": question = await activateQuestion(String(body.questionId)); break;
      case "ARCHIVE": question = await archiveQuestion(String(body.questionId)); break;
      case "UNPUBLISH": question = await unpublishQuestion(String(body.questionId)); break;
      case "PUBLISH": question = await publishQuestion(String(body.questionId)); break;
      default: throw new Error("INVALID_ADMIN_ACTION");
    }
    return NextResponse.json({ ok: true, question });
  } catch (error) { return errorResponse(error); }
}
