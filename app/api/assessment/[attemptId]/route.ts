import { NextResponse } from "next/server";
import { getCurrentSession } from "../../../../lib/auth/session";
import { assertAttemptBelongsToActiveSubject } from "../../../../lib/assessment/runtime-service";
import { getAttemptView, RuntimeError } from "../../../../lib/assessment/runtime-service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ attemptId: string }> },
) {
  try {
    const session = await getCurrentSession();
    if (!session) return NextResponse.json({ ok: false, error: { code: "AUTH_REQUIRED", message: "Login diperlukan." } }, { status: 401 });
    const { attemptId } = await params;
    await assertAttemptBelongsToActiveSubject(session.user.id, attemptId);
    const view = await getAttemptView(attemptId);
    return NextResponse.json({ ok: true, ...view });
  } catch (error) {
    if (error instanceof RuntimeError) {
      return NextResponse.json(
        { ok: false, error: { code: error.code, message: error.message } },
        { status: 404 },
      );
    }
    console.error(error);
    return NextResponse.json(
      { ok: false, error: { code: "INTERNAL_ERROR", message: "Attempt tidak dapat dimuat." } },
      { status: 500 },
    );
  }
}
