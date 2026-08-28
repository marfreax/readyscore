import type { Prisma } from "@prisma/client";
import { prisma } from "../db/prisma";

export type DashboardAttempt = {
  id: string;
  assessmentType: "free" | "premium" | "riasec" | "disc" | "eq" | "cognitive";
  status: "IN_PROGRESS" | "COMPLETED" | "ABANDONED" | "EXPIRED";
  startedAt: string;
  completedAt: string | null;
  answered: number;
  total: number;
  resultSummary: { overallScore: number; band: string } | null;
};

function summary(value: Prisma.JsonValue | null): DashboardAttempt["resultSummary"] {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const result = value as Record<string, unknown>;
  const overallScore = Number(result.overallScore);
  const band = typeof result.band === "string" ? result.band : "";
  return Number.isFinite(overallScore) && band ? { overallScore, band } : null;
}

export async function getUserDashboard(userId: string) {
  const attempts = await prisma.assessmentAttempt.findMany({
    where: { userId },
    orderBy: { startedAt: "desc" },
    take: 20,
    include: {
      _count: { select: { questions: true, answers: true } },
      result: { select: { result: true } },
    },
  });

  const mapped: DashboardAttempt[] = attempts.map((attempt) => ({
    id: attempt.id,
    assessmentType: attempt.assessmentType.toLowerCase() as DashboardAttempt["assessmentType"],
    status: attempt.status,
    startedAt: attempt.startedAt.toISOString(),
    completedAt: attempt.completedAt?.toISOString() ?? null,
    answered: attempt._count.answers,
    total: attempt._count.questions,
    resultSummary: summary(attempt.result?.result ?? null),
  }));

  const latest = mapped[0] ?? null;
  const completed = mapped.filter((item) => item.status === "COMPLETED");
  const latestCompleted = completed[0] ?? null;

  return {
    latest,
    latestCompleted,
    attempts: mapped.slice(0, 5),
    stats: {
      totalAssessments: mapped.length,
      completedAssessments: completed.length,
      inProgressAssessments: mapped.filter((item) => item.status === "IN_PROGRESS").length,
    },
  };
}

export async function getUserHistory(userId: string) {
  const attempts = await prisma.assessmentAttempt.findMany({
    where: { userId },
    orderBy: { startedAt: "desc" },
    include: {
      _count: { select: { questions: true, answers: true } },
      result: { select: { result: true } },
    },
  });

  return attempts.map((attempt): DashboardAttempt => ({
    id: attempt.id,
    assessmentType: attempt.assessmentType.toLowerCase() as DashboardAttempt["assessmentType"],
    status: attempt.status,
    startedAt: attempt.startedAt.toISOString(),
    completedAt: attempt.completedAt?.toISOString() ?? null,
    answered: attempt._count.answers,
    total: attempt._count.questions,
    resultSummary: summary(attempt.result?.result ?? null),
  }));
}
