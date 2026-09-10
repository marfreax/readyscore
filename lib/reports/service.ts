import { prisma } from "../db/prisma";
import { hasFeatureAccess } from "../commercial/entitlement-service";
import { buildReportSummary } from "./engine-v1";
import type { ReportSummary } from "./types";

export class ReportAccessError extends Error {
  constructor(
    public readonly code: "UNAUTHENTICATED" | "REPORT_ACCESS_REQUIRED" | "REPORT_NOT_FOUND",
    message: string,
  ) {
    super(message);
    this.name = "ReportAccessError";
  }
}

async function buildUserReport(userId: string, statusOverride?: ReportSummary["status"]): Promise<ReportSummary> {
  const attempts = await prisma.assessmentAttempt.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      assessmentType: true,
      status: true,
      completedAt: true,
      result: { select: { result: true } },
    },
  });

  const report = buildReportSummary({
    ownerUserId: userId,
    attempts: attempts.map((attempt) => ({
      id: attempt.id,
      assessmentType: attempt.assessmentType,
      status: attempt.status,
      completedAt: attempt.completedAt,
      result: attempt.result?.result ?? null,
    })),
  });

  return statusOverride ? { ...report, status: statusOverride } : report;
}

export async function getUserReport(userId: string): Promise<ReportSummary> {
  const allowed = await hasFeatureAccess(userId, "REPORT_ACCESS", "ADVANCED_REPORT_V1");
  if (!allowed) {
    throw new ReportAccessError(
      "REPORT_ACCESS_REQUIRED",
      "Report belum tersedia untuk entitlement akun ini.",
    );
  }

  return buildUserReport(userId);
}

export async function getUserReportOverview(userId: string): Promise<{
  report: ReportSummary;
  reportAccess: boolean;
}> {
  const allowed = await hasFeatureAccess(userId, "REPORT_ACCESS", "ADVANCED_REPORT_V1");
  const report = await buildUserReport(userId, allowed ? "AVAILABLE" : "LIMITED");
  return { report, reportAccess: allowed };
}

export async function getParentReport(userId: string, attemptId: string) {
  const allowed = await hasFeatureAccess(userId, "REPORT_ACCESS", "ADVANCED_REPORT_V1");
  if (!allowed) {
    throw new ReportAccessError(
      "REPORT_ACCESS_REQUIRED",
      "Report belum tersedia untuk entitlement akun ini.",
    );
  }

  const attempt = await prisma.assessmentAttempt.findFirst({
    where: { id: attemptId, userId },
    select: {
      id: true,
      assessmentType: true,
      status: true,
      completedAt: true,
      result: { select: { result: true } },
    },
  });

  if (!attempt) {
    throw new ReportAccessError("REPORT_NOT_FOUND", "Report assessment tidak ditemukan.");
  }

  const report = buildReportSummary({
    ownerUserId: userId,
    attempts: [{
      id: attempt.id,
      assessmentType: attempt.assessmentType,
      status: attempt.status,
      completedAt: attempt.completedAt,
      result: attempt.result?.result ?? null,
    }],
  });

  return report;
}
