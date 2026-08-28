import { NextResponse } from "next/server";
import {
  activateQuestion,
  archiveQuestion,
  approveMapping,
  approveQuestion,
  createLogicalQuestion,
  createQuestionVersion,
  duplicateQuestion,
  getQuestionBankStats,
  getQuestionBankTestTypes,
  getQuestions,
  publishQuestion,
  unpublishQuestion,
} from "../../../../lib/question-bank-repository";
import { requireAdminApi } from "../../../../lib/auth/admin";

export const runtime = "nodejs";

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "ADMIN_QUESTION_BANK_ERROR";
  const status =
    message === "UNAUTHENTICATED" ? 401 :
    message === "FORBIDDEN" ? 403 :
    message.includes("NOT_FOUND") ? 404 : 400;
  return NextResponse.json({ ok: false, error: { code: message } }, { status });
}

export async function GET(request: Request) {
  try {
    await requireAdminApi();
    const url = new URL(request.url);
    const [questions, stats, testTypes] = await Promise.all([
      getQuestions({
        search: url.searchParams.get("search") ?? undefined,
        status: url.searchParams.get("status") ?? undefined,
        limit: Math.min(5000, Number(url.searchParams.get("limit") ?? 5000)),
        offset: Number(url.searchParams.get("offset") ?? 0),
      }),
      getQuestionBankStats(),
      getQuestionBankTestTypes(),
    ]);
    return NextResponse.json({ ok: true, questions, stats, testTypes });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireAdminApi();
    const body = await request.json();
    const action = String(body.action ?? "").toUpperCase();
    let question;
    switch (action) {
      case "CREATE":
        question = await createLogicalQuestion(body.input);
        break;
      case "EDIT":
        question = await createQuestionVersion(String(body.questionId), body.input);
        break;
      case "DUPLICATE":
        question = await duplicateQuestion(String(body.questionId), String(body.newCode ?? ""));
        break;
      case "APPROVE_MAPPING":
        question = await approveMapping(String(body.questionId));
        break;
      case "APPROVE":
        question = await approveQuestion(String(body.questionId));
        break;
      case "ACTIVATE":
        question = await activateQuestion(String(body.questionId));
        break;
      case "ARCHIVE":
        question = await archiveQuestion(String(body.questionId));
        break;
      case "UNPUBLISH":
        question = await unpublishQuestion(String(body.questionId));
        break;
      case "PUBLISH":
        question = await publishQuestion(String(body.questionId));
        break;
      default:
        throw new Error("INVALID_ADMIN_ACTION");
    }
    return NextResponse.json({ ok: true, question });
  } catch (error) {
    return errorResponse(error);
  }
}
