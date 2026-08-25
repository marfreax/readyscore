import {
  calculateRiasecResult,
  type RiasecScoringInput,
} from "./integration";
import type { RiasecAnswer, RiasecQuestion } from "./types";

const dimensions = ["R", "I", "A", "S", "E", "C"] as const;

const questions: RiasecQuestion[] = dimensions.flatMap((dimension) =>
  Array.from({ length: 10 }, (_, index) => ({
    id: `${dimension}-${index + 1}`,
    code: `RIASEC-${dimension}-${String(index + 1).padStart(3, "0")}`,
    dimension,
    reverseScore: false,
    weight: 1,
  })),
);

const answers: RiasecAnswer[] = questions.map((question) => ({
  questionId: question.id,
  value:
    question.dimension === "I"
      ? 5
      : question.dimension === "R"
        ? 4
        : question.dimension === "E"
          ? 3
          : 2,
}));

const input: RiasecScoringInput = {
  questions,
  answers,
};

const integrated = calculateRiasecResult(input);

if (integrated.testType !== "RIASEC") {
  throw new Error("Expected RIASEC test type.");
}

if (integrated.scoringVersion !== "RIASEC_SCORE_V1") {
  throw new Error("Expected RIASEC_SCORE_V1.");
}

if (integrated.result.topCode !== "IRE") {
  throw new Error(
    `Expected IRE top code, got ${integrated.result.topCode}.`,
  );
}

if (integrated.result.coveragePercent !== 100) {
  throw new Error(
    `Expected 100% coverage, got ${integrated.result.coveragePercent}.`,
  );
}

if (!integrated.result.isComplete) {
  throw new Error("Expected complete RIASEC result.");
}

console.log("RIASEC_F5_INTEGRATION_TEST passed.");
