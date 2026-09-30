import { prisma } from "../db/prisma";
import { hasFeatureAccess } from "../commercial/entitlement-service";
import { buildReportSummary } from "./engine-v1";
import type { ReportSummary } from "./types";
import { getActiveSubject } from "../subjects/service";

export class ReportAccessError extends Error {
  constructor(
    public readonly code: "UNAUTHENTICATED" | "REPORT_ACCESS_REQUIRED" | "REPORT_NOT_FOUND",
    message: string,
  ) {
    super(message);
    this.name = "ReportAccessError";
  }
}

async function buildUserReport(userId: string, statusOverride?: ReportSummary["status"], subjectId?: string): Promise<ReportSummary> {
  const owner = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
  if (!owner) throw new ReportAccessError("REPORT_NOT_FOUND", "Account owner tidak ditemukan.");
  const subject = await getActiveSubject(userId, subjectId);

  const attempts = await prisma.assessmentAttempt.findMany({
    where: { userId, subjectId: subject.id },
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
    participantName: subject.name,
    accountOwnerName: owner.name,
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
  const subject = await getActiveSubject(userId);
  const allowed = await hasFeatureAccess(userId, "REPORT_ACCESS", "ADVANCED_REPORT_V1", new Date(), subject.id);
  if (!allowed) {
    throw new ReportAccessError(
      "REPORT_ACCESS_REQUIRED",
      "Report belum tersedia untuk entitlement akun ini.",
    );
  }

  return buildUserReport(userId, undefined, subject.id);
}

export async function getUserReportOverview(userId: string): Promise<{
  report: ReportSummary;
  reportAccess: boolean;
}> {
  const subject = await getActiveSubject(userId);
  const allowed = await hasFeatureAccess(userId, "REPORT_ACCESS", "ADVANCED_REPORT_V1", new Date(), subject.id);
  const report = await buildUserReport(userId, allowed ? "AVAILABLE" : "LIMITED", subject.id);
  return { report, reportAccess: allowed };
}

export async function getParentReport(userId: string, attemptId: string, subjectId?: string) {
  const subject = await getActiveSubject(userId, subjectId);
  const allowed = await hasFeatureAccess(userId, "REPORT_ACCESS", "ADVANCED_REPORT_V1", new Date(), subject.id);
  if (!allowed) {
    throw new ReportAccessError(
      "REPORT_ACCESS_REQUIRED",
      "Report belum tersedia untuk entitlement akun ini.",
    );
  }

  const owner = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
  if (!owner) throw new ReportAccessError("REPORT_NOT_FOUND", "Account owner tidak ditemukan.");

  const attempt = await prisma.assessmentAttempt.findFirst({
    where: { id: attemptId, userId, subjectId: subject.id },
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
    participantName: subject.name,
    accountOwnerName: owner.name,
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

import { buildAssessmentReportV19_3, type AssessmentReportV19_3 } from "./v19-3-engine";

export async function getAssessmentReportV19_3(userId: string, attemptId: string, subjectId?: string): Promise<AssessmentReportV19_3> {
  const subject = await getActiveSubject(userId, subjectId);
  const allowed = await hasFeatureAccess(userId, "REPORT_ACCESS", "ADVANCED_REPORT_V1", new Date(), subject.id);
  if (!allowed) throw new ReportAccessError("REPORT_ACCESS_REQUIRED", "Report belum tersedia untuk entitlement akun ini.");
  const owner = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
  if (!owner) throw new ReportAccessError("REPORT_NOT_FOUND", "Account owner tidak ditemukan.");
  const attempt = await prisma.assessmentAttempt.findFirst({
    where: { id: attemptId, userId, subjectId: subject.id },
    select: { id: true, assessmentType: true, status: true, completedAt: true, result: { select: { result: true } } },
  });
  if (!attempt || attempt.status !== "COMPLETED" || !attempt.result?.result) throw new ReportAccessError("REPORT_NOT_FOUND", "Result assessment belum tersedia untuk report.");
  return buildAssessmentReportV19_3({ participantName: subject.name, accountOwnerName: owner.name, attemptId: attempt.id, assessmentType: attempt.assessmentType, completedAt: attempt.completedAt, result: attempt.result.result });
}
