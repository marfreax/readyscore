import {
  calculateRuntimeAssessmentResult,
  getScoringEngine,
  listScoringEngines,
} from "../scoring/engine-v2";

export {
  calculateRuntimeAssessmentResult,
  getScoringEngine,
  listScoringEngines,
};

export type RuntimeAssessmentType = "free" | "premium" | "riasec" | "disc" | "eq" | "cognitive";
export type RuntimeScoringMetadata = {
  attemptId: string;
  assessmentConfigurationVersion: string;
  questionBankVersion: string;
  taxonomyVersion: string;
  scoringVersion: string;
  completedAt: string;
};
