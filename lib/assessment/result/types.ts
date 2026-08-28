import type { AssessmentResult } from "../types";

export const TEST_RESULT_CONTRACT_VERSION = "TEST_RESULT_V1" as const;

export type ResultInterpretationStatus = "COMPLETE" | "PARTIAL" | "INSUFFICIENT";
export type ResultDimensionLevel = "LOW" | "MEDIUM" | "HIGH";

export type ResultInterpretation = {
  contractVersion: typeof TEST_RESULT_CONTRACT_VERSION;
  interpretationVersion: string;
  status: ResultInterpretationStatus;
  summary: string;
  confidence: "HIGH" | "MODERATE" | "LIMITED";
  claims: {
    allowed: string[];
    restricted: string[];
    prohibited: string[];
  };
};

export type TestResultEnvelope = AssessmentResult & {
  interpretation?: ResultInterpretation;
  [key: string]: unknown;
};
