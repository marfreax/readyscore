import type { RiasecResult, RiasecResultV1, RiasecResultV2 } from "./types";

/** Active V8.6 result contract. */
export const RIASEC_RESULT_CONTRACT_VERSION = "RIASEC_RESULT_V2" as const;
/** Historical V1 result contract; retained for immutable legacy payloads. */
export const RIASEC_RESULT_CONTRACT_VERSION_V1 = "RIASEC_RESULT_V1" as const;

export type RiasecResultProvenance = {
  attemptId: string;
  testType: "RIASEC";
  assessmentConfigurationVersion: string;
  questionBankVersion: string;
  scoringVersion: string;
  completedAt: string;
};

export type RiasecPersistableResultV1 = {
  contractVersion: typeof RIASEC_RESULT_CONTRACT_VERSION_V1;
  provenance: RiasecResultProvenance & { scoringVersion: "RIASEC_SCORE_V1" };
  measurement: RiasecResultV1;
};

export type RiasecPersistableResultV2 = {
  contractVersion: typeof RIASEC_RESULT_CONTRACT_VERSION;
  provenance: RiasecResultProvenance & { scoringVersion: "RIASEC_SCORE_V2" };
  measurement: RiasecResultV2;
};

export type RiasecPersistableResult =
  | RiasecPersistableResultV1
  | RiasecPersistableResultV2;

export function createRiasecPersistableResult(
  measurement: RiasecResultV1,
  provenance: RiasecResultProvenance & { scoringVersion: "RIASEC_SCORE_V1" },
): RiasecPersistableResultV1;
export function createRiasecPersistableResult(
  measurement: RiasecResultV2,
  provenance: RiasecResultProvenance & { scoringVersion: "RIASEC_SCORE_V2" },
): RiasecPersistableResultV2;
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

  if (measurement.scoringVersion === "RIASEC_SCORE_V1") {
    return {
      contractVersion: RIASEC_RESULT_CONTRACT_VERSION_V1,
      provenance: provenance as RiasecPersistableResultV1["provenance"],
      measurement,
    };
  }

  return {
    contractVersion: RIASEC_RESULT_CONTRACT_VERSION,
    provenance: provenance as RiasecPersistableResultV2["provenance"],
    measurement,
  };
}
