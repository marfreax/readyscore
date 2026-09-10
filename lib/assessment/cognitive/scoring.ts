export const COGNITIVE_SCORING_VERSION = "COGNITIVE_SCORE_V2" as const;

export const COGNITIVE_DIMENSIONS = [
  "VERBAL_REASONING",
  "NUMERICAL_REASONING",
  "LOGICAL_REASONING",
  "ABSTRACT_REASONING",
] as const;

export type CognitiveDimension = (typeof COGNITIVE_DIMENSIONS)[number];
export type CognitiveOptionValue = 1 | 2 | 3 | 4;

export type CognitiveQuestion = {
  id: string;
  code: string;
  dimension: CognitiveDimension;
  answerType: "SINGLE_CHOICE_4";
  options: readonly string[];
  correctOption: CognitiveOptionValue;
  weight: number;
};

export type CognitiveAnswer = {
  questionId: string;
  value: CognitiveOptionValue;
};

export type CognitiveMeasurement = {
  testType: "COGNITIVE";
  scoringVersion: typeof COGNITIVE_SCORING_VERSION;
  overallScore: number;
  dimensionScores: Array<{
    dimension: CognitiveDimension;
    score: number;
    answeredCount: number;
    questionCount: number;
    correctCount: number;
  }>;
};

export function scoreCognitive(
  questions: CognitiveQuestion[],
  answers: CognitiveAnswer[],
): CognitiveMeasurement {
  if (questions.length !== 24 && questions.length !== 40) {
    throw new Error(`Cognitive supports 24-item legacy and 40-item production forms; received ${questions.length}.`);
  }
  const questionIds = new Set(questions.map((q) => q.id));
  if (questionIds.size !== questions.length) {
    throw new Error("Cognitive question identities must be unique.");
  }
  const answerIds = new Set(answers.map((a) => a.questionId));
  if (answerIds.size !== answers.length) {
    throw new Error("Cognitive answers must not contain duplicate question IDs.");
  }
  for (const answer of answers) {
    if (!questionIds.has(answer.questionId)) {
      throw new Error(`Cognitive answer references unknown question ${answer.questionId}.`);
    }
    if (answer.value < 1 || answer.value > 4) {
      throw new Error(`Invalid Cognitive answer for question ${answer.questionId}.`);
    }
  }
  // Normal submission is complete-answer only. Timeout scoring may score the
  // answered subset; unanswered items are not synthesized as incorrect.
  // The caller enforces the normal-submit requirement via completion mode.
  if (answers.length > questions.length) {
    throw new Error(`Cognitive cannot receive more answers than questions; received ${answers.length}.`);
  }

  const byId = new Map(answers.map((a) => [a.questionId, a.value]));
  const dimensionScores = COGNITIVE_DIMENSIONS.map((dimension) => {
    const qs = questions.filter((q) => q.dimension === dimension);
    const requiredCount = questions.length === 40 ? 10 : 6;
    if (qs.length !== requiredCount) throw new Error(`Cognitive dimension "${dimension}" requires exactly ${requiredCount} questions; received ${qs.length}.`);
    let correctCount = 0;
    let answeredCount = 0;
    let weightTotal = 0;
    let weightedCorrect = 0;
    for (const q of qs) {
      if (q.options.length !== 4) throw new Error(`Cognitive question ${q.id} requires exactly 4 options.`);
      if (q.correctOption < 1 || q.correctOption > 4) throw new Error(`Cognitive question ${q.id} has an invalid correct option.`);
      const raw = byId.get(q.id);
      const weight = q.weight > 0 ? q.weight : 1;
      if (raw === undefined) continue;
      answeredCount += 1;
      weightTotal += weight;
      if (raw === q.correctOption) {
        correctCount += 1;
        weightedCorrect += weight;
      }
    }
    const score = weightTotal ? Math.round((weightedCorrect / weightTotal) * 100) : 0;
    return { dimension, score, answeredCount, questionCount: qs.length, correctCount };
  });
  const overallScore = Math.round(
    dimensionScores.reduce((sum, item) => sum + item.score, 0) / dimensionScores.length,
  );
  return { testType: "COGNITIVE", scoringVersion: COGNITIVE_SCORING_VERSION, overallScore, dimensionScores };
}

export function createCognitivePersistableResult(measurement: CognitiveMeasurement) {
  return { contractVersion: "COGNITIVE_RESULT_V2" as const, measurement };
}
