import { NextResponse } from "next/server";
import { startAssessment, RuntimeError } from "../../../../lib/assessment/runtime-service";
import type { AssessmentType } from "../../../../lib/assessment-config";
import { getCurrentSession } from "../../../../lib/auth/session";
import { syncUserToDatabase } from "../../../../lib/auth/database-sync";

// Explicit runtime declaration keeps the Prisma-backed API route on the Node.js runtime.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as { type?: AssessmentType };
    if (body.type !== "free" && body.type !== "premium" && body.type !== "riasec" && body.type !== "disc" && body.type !== "eq" && body.type !== "cognitive") {
      return NextResponse.json(
        { ok: false, error: { code: "INVALID_ASSESSMENT_TYPE", message: "Tipe assessment tidak valid." } },
        { status: 400 },
      );
    }

    const current = await getCurrentSession();
    if (current) await syncUserToDatabase(current.user.id);

    const attempt = await startAssessment(body.type, current?.user.id);
    return NextResponse.json({
      ok: true,
      attemptId: attempt.attempt.id,
      status: attempt.attempt.status,
      progress: attempt.progress,
      snapshot: attempt.snapshot,
      questions: attempt.questions.map((question) => ({
        id: question.id,
        code: question.code,
        text: question.text,
        domain: question.domain,
        subdomain: question.subdomain ?? null,
        indicator: question.indicator ?? null,
        difficulty: question.difficulty,
        sequence: question.sequence,
      })),
    });
  } catch (error) {
    if (error instanceof RuntimeError) {
      return NextResponse.json({ ok: false, error: { code: error.code, message: error.message } }, { status: 422 });
    }
    console.error(error);
    return NextResponse.json(
      { ok: false, error: { code: "INTERNAL_ERROR", message: "Gagal memulai assessment." } },
      { status: 500 },
    );
  }
}
