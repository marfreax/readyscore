import { prisma } from "../db/prisma";
import { hasFeatureAccess } from "../commercial/entitlement-service";
import { generateV15Report } from "./service";
import type { V15ReportDocument } from "./types";

const REQUIRED_TYPES = ["RIASEC", "DISC", "EQ", "COGNITIVE"] as const;

export type V15CustomerReportState = {
  access: boolean;
  readiness: "READY" | "NOT_READY";
  completedTypes: string[];
  missingTypes: string[];
  report: { id: string; document: V15ReportDocument } | null;
};

export async function getV15CustomerReportState(userId: string): Promise<V15CustomerReportState> {
  const access = await hasFeatureAccess(userId, "REPORT_ACCESS", "ADVANCED_REPORT_V1");
  if (!access) {
    return { access: false, readiness: "NOT_READY", completedTypes: [], missingTypes: [...REQUIRED_TYPES], report: null };
  }

  const attempts = await prisma.assessmentAttempt.findMany({
    where: { userId, status: "COMPLETED", assessmentType: { in: [...REQUIRED_TYPES] }, result: { isNot: null } },
    select: { assessmentType: true },
  });
  const completedTypes: string[] = [...new Set(attempts.map((a) => String(a.assessmentType).toUpperCase()))];
  const missingTypes = REQUIRED_TYPES.filter((type) => !completedTypes.includes(type));

  if (missingTypes.length > 0) {
    return { access: true, readiness: "NOT_READY", completedTypes, missingTypes, report: null };
  }

  const generated = await generateV15Report(userId);
  return {
    access: true,
    readiness: generated.report.status === "READY" ? "READY" : "NOT_READY",
    completedTypes,
    missingTypes,
    report: { id: generated.id, document: generated.report },
  };
}
