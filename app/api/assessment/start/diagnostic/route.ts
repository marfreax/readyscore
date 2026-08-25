import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/db/prisma";
import { selectQuestions } from "../../../../../lib/assessment/question-engine";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const seed = typeof body?.seed === "string" && body.seed.length > 0
      ? body.seed
      : `F10-C2-E1-${Date.now()}`;

    const selected = await selectQuestions("riasec", seed);
    const byDomain = Object.fromEntries(
      ["R", "I", "A", "S", "E", "C"].map((d) => [
        d,
        selected.filter((q) => q.domain.trim().toUpperCase() === d).length,
      ]),
    );

    const databaseIds = selected.map((q) => q.questionRecordId);
    const versionIds = selected.map((q) => q.questionVersionId);

    const [questionCount, versionCount] = await Promise.all([
      prisma.question.count({ where: { id: { in: databaseIds } } }),
      prisma.questionVersion.count({ where: { id: { in: versionIds } } }),
    ]);

    return NextResponse.json({
      ok: true,
      phase: "F.10-C.2-E.1",
      mutation: "NONE",
      selectedCount: selected.length,
      domainDistribution: byDomain,
      questionRowsResolved: questionCount,
      questionVersionRowsResolved: versionCount,
      linkage: questionCount === 60 && versionCount === 60 ? "PASS" : "FAIL",
    });
  } catch (error: unknown) {
    const e = error as { name?: string; message?: string; code?: string; meta?: unknown };
    console.error("[F.10-C.2-E.1]", error);
    return NextResponse.json({
      ok: false,
      phase: "F.10-C.2-E.1",
      mutation: "NONE",
      error: {
        name: e?.name ?? "UnknownError",
        message: e?.message ?? String(error),
        code: e?.code ?? null,
        meta: e?.meta ?? null,
      },
    }, { status: 500 });
  }
}
