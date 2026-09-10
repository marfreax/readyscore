import { requireAdminApi } from "../../../../../lib/auth/admin";
import { normalizeQuestionGroup } from "../../../../../lib/question-bank-v11";
import { questionBankTemplate } from "../../../../../lib/question-bank-csv";
export const runtime = "nodejs";
export async function GET(request: Request) {
  try {
    await requireAdminApi();
    const group = normalizeQuestionGroup(new URL(request.url).searchParams.get("group"));
    return new Response(questionBankTemplate(group), { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="${group.toLowerCase()}-question-bank-template.csv"`, "cache-control": "no-store" } });
  } catch (error) { return Response.json({ ok: false, error: { code: error instanceof Error ? error.message : "TEMPLATE_ERROR" } }, { status: 400 }); }
}
