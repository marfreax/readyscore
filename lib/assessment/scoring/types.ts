import type { AssessmentResult, Answer, Question } from "../types";
import type { AssessmentType } from "../../assessment-config";

export type ScoringModelIdentity = {
  testType: string;
  modelId: string;
  version: string;
};

export type ScoringContext = {
  assessmentType: AssessmentType;
  questions: Question[];
  answers: Answer[];
  metadata: {
    attemptId: string;
    assessmentConfigurationVersion: string;
    questionBankVersion: string;
    taxonomyVersion: string;
    scoringVersion: string;
    completedAt: string;
  };
};

export type TestScoringEngine = {
  readonly identity: ScoringModelIdentity;
  score(context: ScoringContext): AssessmentResult;
};

export class ScoringEngineConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ScoringEngineConfigurationError";
  }
}
