import { prisma } from "../db/prisma";
import { hasFeatureAccess } from "../commercial/entitlement-service";
import { buildCrossTestProfile } from "./engine-v1";
import type { CrossTestProfileInput } from "./types";

export const PROFILE_TYPES = ["RIASEC", "DISC", "EQ", "COGNITIVE"] as const;
export const CROSS_TEST_PROFILE_SERVICE_VERSION = "V5_L10_CROSS_TEST_PROFILING_V1" as const;

export class CrossTestProfileAccessError extends Error {
  constructor(public readonly code: "AUTH_REQUIRED" | "PROFILE_ACCESS_REQUIRED") {
    super(code);
    this.name = "CrossTestProfileAccessError";
  }
}

function normalizeInput(attempt: {
  id: string;
  assessmentType: string;
  scoringVersion: string;
  status: string;
  result: { result: unknown } | null;
}): CrossTestProfileInput | null {
  if (!attempt.result || attempt.status !== "COMPLETED") return null;
  const persisted = attempt.result.result as Record<string, unknown>;
  const key = attempt.assessmentType.toLowerCase();
  const testSpecific = persisted[key];
  if (!testSpecific || typeof testSpecific !== "object") return null;

  const interpretation = persisted.interpretation;
  const interpretationRecord = interpretation && typeof interpretation === "object"
    ? interpretation as Record<string, unknown>
    : undefined;

  return {
    result: {
      attemptId: attempt.id,
      assessmentType: attempt.assessmentType,
      scoringVersion: attempt.scoringVersion,
      status: attempt.status,
      interpretation: interpretationRecord
        ? {
            contractVersion: String(interpretationRecord.contractVersion ?? "TEST_RESULT_V1"),
            interpretationVersion: String(interpretationRecord.interpretationVersion ?? "UNKNOWN"),
            status: String(interpretationRecord.status ?? "COMPLETE"),
            confidence:
              interpretationRecord.confidence === "HIGH" ||
              interpretationRecord.confidence === "MODERATE" ||
              interpretationRecord.confidence === "LIMITED"
                ? interpretationRecord.confidence
                : "LIMITED",
          }
        : undefined,
    },
    testSpecific,
  };
}

export async function getCrossTestProfile(userId: string) {
  const hasAccess = await hasFeatureAccess(userId, "PROFILE_ACCESS", "CROSS_TEST_PROFILE_V1");
  if (!hasAccess) throw new CrossTestProfileAccessError("PROFILE_ACCESS_REQUIRED");

  const attempts = await prisma.assessmentAttempt.findMany({
    where: {
      userId,
      status: "COMPLETED",
      assessmentType: { in: [...PROFILE_TYPES] },
    },
    orderBy: [{ completedAt: "desc" }, { updatedAt: "desc" }],
    select: {
      id: true,
      assessmentType: true,
      scoringVersion: true,
      status: true,
      completedAt: true,
      result: { select: { result: true } },
    },
  });

  const latest = new Map<string, CrossTestProfileInput>();
  for (const attempt of attempts) {
    if (latest.has(attempt.assessmentType)) continue;
    const normalized = normalizeInput(attempt);
    if (normalized) latest.set(attempt.assessmentType, normalized);
  }

  const profile = buildCrossTestProfile([...latest.values()]);
  return {
    serviceVersion: CROSS_TEST_PROFILE_SERVICE_VERSION,
    profile,
    sourceCount: latest.size,
    latestAttemptIds: [...latest.values()].map((item) => item.result.attemptId),
  };
}
