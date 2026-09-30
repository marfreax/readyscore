import { NextResponse } from "next/server";
import { getCurrentSession } from "../../../../../lib/auth/session";
import { assertAttemptBelongsToActiveSubject } from "../../../../../lib/assessment/runtime-service";
import { RuntimeError, submitAssessment } from "../../../../../lib/assessment/runtime-service";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ attemptId: string }> },
) {
  try {
    const session = await getCurrentSession();
    if (!session) return NextResponse.json({ ok: false, error: { code: "AUTH_REQUIRED", message: "Login diperlukan." } }, { status: 401 });
    const { attemptId } = await params;
    await assertAttemptBelongsToActiveSubject(session.user.id, attemptId);
    const result = await submitAssessment(attemptId);
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    if (error instanceof RuntimeError) {
      return NextResponse.json(
        { ok: false, error: { code: error.code, message: error.message } },
        { status: 422 },
      );
    }
    console.error(error);
    return NextResponse.json(
      { ok: false, error: { code: "INTERNAL_ERROR", message: "Assessment gagal disubmit." } },
      { status: 500 },
    );
  }
}
