import { scoreRiasec } from "./scoring";
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

const result = scoreRiasec(questions, answers);

if (!result.isComplete) {
  throw new Error("Expected complete RIASEC result.");
}

if (result.coveragePercent !== 100) {
  throw new Error(`Expected 100% coverage, got ${result.coveragePercent}.`);
}

if (result.topCode !== "IRE") {
  throw new Error(`Expected IRE top code, got ${result.topCode}.`);
}

if (result.dimensionScores.find((item) => item.dimension === "I")?.score !== 100) {
  throw new Error("Expected I score of 100.");
}

if (result.dimensionScores.find((item) => item.dimension === "R")?.score !== 75) {
  throw new Error("Expected R score of 75.");
}

if (result.dimensionScores.find((item) => item.dimension === "E")?.score !== 50) {
  throw new Error("Expected E score of 50.");
}

console.log("RIASEC_SCORE_V1 golden test passed.");
