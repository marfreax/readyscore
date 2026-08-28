import { NextResponse } from "next/server";
import { getCurrentSession } from "../../../../../lib/auth/session";
import { syncUserToDatabase } from "../../../../../lib/auth/database-sync";
import { startReassessment, RuntimeError } from "../../../../../lib/assessment/runtime-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TYPES = new Set(["riasec", "disc", "eq", "cognitive"]);

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as { type?: string };
    if (!body.type || !TYPES.has(body.type)) {
      return NextResponse.json(
        { ok: false, error: { code: "INVALID_ASSESSMENT_TYPE", message: "Tipe assessment reassessment tidak valid." } },
        { status: 400 },
      );
    }

    const current = await getCurrentSession();
    if (!current) {
      return NextResponse.json(
        { ok: false, error: { code: "AUTH_REQUIRED", message: "Login diperlukan untuk reassessment." } },
        { status: 401 },
      );
    }

    await syncUserToDatabase(current.user.id);
    const attempt = await startReassessment(
      body.type as "riasec" | "disc" | "eq" | "cognitive",
      current.user.id,
    );

    return NextResponse.json({
      ok: true,
      mode: "REASSESSMENT",
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
      return NextResponse.json(
        { ok: false, error: { code: error.code, message: error.message } },
        { status: 422 },
      );
    }
    console.error(error);
    return NextResponse.json(
      { ok: false, error: { code: "INTERNAL_ERROR", message: "Reassessment gagal dimulai." } },
      { status: 500 },
    );
  }
}
