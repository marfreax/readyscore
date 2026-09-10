import { NextResponse } from "next/server";
import { requireAdminApi } from "../../../../lib/auth/admin";
import { getReviewStats, listReviewQueuePaginated, inspectReviewItem, performReviewAction, bulkAdvanceQuestionsToPublished, getAuditTrail, getReviewImpactPreview } from "../../../../lib/admin-review-repository";

export const runtime = "nodejs";

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "ADMIN_REVIEW_ERROR";
  const status = message === "UNAUTHENTICATED" ? 401 : message === "FORBIDDEN" ? 403 : message.includes("NOT_FOUND") ? 404 : 400;
  return NextResponse.json({ ok:false, error:{code:message} }, {status});
}

export async function GET(request: Request) {
  try {
    await requireAdminApi();
    const url = new URL(request.url);
    const questionId = url.searchParams.get("questionId");
    const impactAction = url.searchParams.get("impactAction");
    if (url.searchParams.get("bulk") === "1") {
      const queue = await listReviewQueuePaginated({
        search: url.searchParams.get("search") ?? undefined,
        status: url.searchParams.get("status") ?? undefined,
        page: 1,
        pageSize: 100,
      });
      return NextResponse.json({ok:true, questionIds:queue.items.map(item => item.questionId), total:queue.pagination.totalItems});
    }
    if (questionId && impactAction) {
      return NextResponse.json({ok:true, impact:await getReviewImpactPreview(questionId, impactAction as any)});
    }
    if (questionId) {
      return NextResponse.json({ok:true, item:await inspectReviewItem(questionId)});
    }
    const [queue, stats, audit] = await Promise.all([
      listReviewQueuePaginated({
        search: url.searchParams.get("search") ?? undefined,
        status: url.searchParams.get("status") ?? undefined,
        page: Number(url.searchParams.get("page") ?? 1),
        pageSize: Number(url.searchParams.get("pageSize") ?? 25),
      }),
      getReviewStats(),
      getAuditTrail("QUESTION_VERSION"),
    ]);
    return NextResponse.json({ok:true, items:queue.items, pagination:queue.pagination, stats, audit});
  } catch (error) { return errorResponse(error); }
}

export async function POST(request: Request) {
  try {
    const actor = await requireAdminApi();
    const body = await request.json();
    const action = String(body.action ?? "").toUpperCase();
    const questionId = String(body.questionId ?? "");
    if (action === "BULK_TO_PUBLISHED") {
      const questionIds = Array.isArray(body.questionIds) ? body.questionIds.map(String) : [];
      const result = await bulkAdvanceQuestionsToPublished(questionIds, actor.id, { confirmed: body.confirmed === true });
      return NextResponse.json({ok:true, action, result});
    }
    if (!questionId) throw new Error("QUESTION_ID_REQUIRED");
    const question = await performReviewAction(action, questionId, actor.id, { confirmed: body.confirmed === true, reason: typeof body.reason === "string" ? body.reason : undefined });
    return NextResponse.json({ok:true, action, question});
  } catch (error) { return errorResponse(error); }
}
