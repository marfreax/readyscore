import { scoreRiasec } from "./scoring";
import type {
  RiasecAnswer,
  RiasecQuestion,
  RiasecResult,
  RiasecResultV2,
} from "./types";

/**
 * PHASE 3.0-D.1-F.5
 *
 * Adapter boundary between the RIASEC measurement scorer and the
 * generic assessment runtime.
 *
 * This module deliberately does not modify:
 * - lib/assessment/scoring-engine.ts
 * - AssessmentResult persistence
 * - commercial entitlement
 * - interpretation
 * - study/career mapping
 *
 * Its responsibility is only to:
 * 1. validate/normalize the RIASEC scoring input;
 * 2. invoke RIASEC_SCORE_V2;
 * 3. return the test-specific measurement result.
 */

export type RiasecScoringInput = {
  questions: RiasecQuestion[];
  answers: RiasecAnswer[];
};

export type RiasecScoringIntegrationResult = {
  testType: "RIASEC";
  scoringVersion: "RIASEC_SCORE_V2";
  result: RiasecResultV2;
};

export function calculateRiasecResult(
  input: RiasecScoringInput,
): RiasecScoringIntegrationResult {
  if (!Array.isArray(input.questions)) {
    throw new Error("RIASEC scoring requires a questions array.");
  }

  if (!Array.isArray(input.answers)) {
    throw new Error("RIASEC scoring requires an answers array.");
  }

  for (const question of input.questions) {
    if (!question.id) {
      throw new Error("RIASEC question is missing id.");
    }

    if (!question.code) {
      throw new Error(
        `RIASEC question ${question.id} is missing code.`,
      );
    }

    if (!question.dimension) {
      throw new Error(
        `RIASEC question ${question.id} is missing dimension.`,
      );
    }
  }

  const result = scoreRiasec(input.questions, input.answers);

  return {
    testType: "RIASEC",
    scoringVersion: "RIASEC_SCORE_V2",
    result,
  };
}
