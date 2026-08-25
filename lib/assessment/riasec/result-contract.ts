import type { RiasecResult } from "./types";

/**
 * PHASE 3.0-D.1-F.7
 *
 * RIASEC-specific result contract.
 *
 * IMPORTANT:
 * This contract is intentionally independent from the legacy/generic
 * AssessmentResult type. It prevents test-specific measurement fields from
 * being forced into the v2 result contract before the v3 result architecture
 * is formally introduced.
 */

export const RIASEC_RESULT_CONTRACT_VERSION = "RIASEC_RESULT_V1";

export type RiasecResultProvenance = {
  attemptId: string;
  testType: "RIASEC";
  assessmentConfigurationVersion: string;
  questionBankVersion: string;
  scoringVersion: string;
  completedAt: string;
};

export type RiasecPersistableResult = {
  contractVersion: typeof RIASEC_RESULT_CONTRACT_VERSION;
  provenance: RiasecResultProvenance;
  measurement: RiasecResult;
};

export function createRiasecPersistableResult(
  measurement: RiasecResult,
  provenance: RiasecResultProvenance,
): RiasecPersistableResult {
  if (measurement.testType !== "RIASEC") {
    throw new Error("RIASEC result contract received a non-RIASEC result.");
  }

  if (measurement.scoringVersion !== provenance.scoringVersion) {
    throw new Error(
      `RIASEC scoring version mismatch: result=${measurement.scoringVersion}, provenance=${provenance.scoringVersion}`,
    );
  }

  if (provenance.testType !== "RIASEC") {
    throw new Error("RIASEC result provenance has an invalid test type.");
  }

  if (!provenance.attemptId.trim()) {
    throw new Error("RIASEC result provenance requires attemptId.");
  }

  return {
    contractVersion: RIASEC_RESULT_CONTRACT_VERSION,
    provenance,
    measurement,
  };
}
