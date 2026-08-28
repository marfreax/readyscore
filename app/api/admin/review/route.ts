import { NextResponse } from "next/server";
import { requireAdminApi } from "../../../../lib/auth/admin";
import { getReviewStats, listReviewQueue, inspectReviewItem, performReviewAction, getAuditTrail } from "../../../../lib/admin-review-repository";

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
    if (questionId) {
      return NextResponse.json({ok:true, item:await inspectReviewItem(questionId)});
    }
    const [items, stats, audit] = await Promise.all([listReviewQueue(), getReviewStats(), getAuditTrail("QUESTION_VERSION")]);
    return NextResponse.json({ok:true, items, stats, audit});
  } catch (error) { return errorResponse(error); }
}

export async function POST(request: Request) {
  try {
    const actor = await requireAdminApi();
    const body = await request.json();
    const action = String(body.action ?? "").toUpperCase();
    const questionId = String(body.questionId ?? "");
    if (!questionId) throw new Error("QUESTION_ID_REQUIRED");
    const question = await performReviewAction(action, questionId, actor.id);
    return NextResponse.json({ok:true, action, question});
  } catch (error) { return errorResponse(error); }
}
