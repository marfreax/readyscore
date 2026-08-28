import {
  REPORT_CONTRACT_VERSION,
  REPORT_ENGINE_VERSION,
  type ReportAssessment,
  type ReportSummary,
} from "./types";

export type ReportInput = {
  ownerUserId: string;
  attempts: Array<{
    id: string;
    assessmentType: string;
    status: string;
    completedAt: Date | null;
    result: unknown | null;
  }>;
};

function contractVersionFromResult(result: unknown): string | undefined {
  if (!result || typeof result !== "object") return undefined;
  const value = (result as Record<string, unknown>).contractVersion;
  return typeof value === "string" ? value : undefined;
}

function scoringVersionFromResult(result: unknown): string | undefined {
  if (!result || typeof result !== "object") return undefined;
  const value = (result as Record<string, unknown>).scoringVersion;
  return typeof value === "string" ? value : undefined;
}

export function buildReportSummary(input: ReportInput, generatedAt = new Date().toISOString()): ReportSummary {
  if (!input.ownerUserId) throw new Error("REPORT_OWNER_REQUIRED");
  if (!Array.isArray(input.attempts)) throw new Error("REPORT_ATTEMPTS_REQUIRED");

  const assessments: ReportAssessment[] = input.attempts.map((attempt) => ({
    attemptId: attempt.id,
    assessmentType: attempt.assessmentType,
    status: attempt.status,
    completedAt: attempt.completedAt?.toISOString() ?? null,
    resultAvailable: Boolean(attempt.result),
    resultContractVersion: contractVersionFromResult(attempt.result),
    scoringVersion: scoringVersionFromResult(attempt.result),
  }));

  const completedAssessmentCount = assessments.filter(
    (item) => item.status === "COMPLETED" && item.resultAvailable,
  ).length;

  return {
    contractVersion: REPORT_CONTRACT_VERSION,
    engineVersion: REPORT_ENGINE_VERSION,
    reportId: `report-${input.ownerUserId}`,
    generatedAt,
    ownerUserId: input.ownerUserId,
    status: completedAssessmentCount > 0 ? "AVAILABLE" : "LIMITED",
    assessmentCount: assessments.length,
    completedAssessmentCount,
    assessments,
    parentView: {
      title: "ReadyScore Parent Report",
      purpose: "Read-only summary of completed assessment activity and available result contracts.",
      audience: "PARENT",
      guidance: [
        "Use this report to understand which assessments have been completed and which results are available.",
        "Read each assessment result within its own measurement semantics.",
        "Do not treat scores from different instruments as a single overall score.",
        "Use the report as a discussion aid, not as a deterministic decision about study, major, or career.",
      ],
    },
    claims: {
      allowed: [
        "summary of completed assessment activity",
        "presentation of available test-specific result contracts",
        "parent-facing discussion prompts based on available evidence",
      ],
      restricted: [
        "interpretation beyond the underlying test-specific result contract",
        "cross-test conclusions when evidence is incomplete",
        "academic, major, or career conclusions without the downstream engines and sufficient evidence",
      ],
      prohibited: [
        "universal overall score across assessments",
        "deterministic study, major, or career assignment",
        "guaranteed academic or career outcomes",
        "diagnostic or psychometric claims not supported by the underlying instrument",
      ],
    },
  };
}
