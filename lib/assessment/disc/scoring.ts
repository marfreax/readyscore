export const DISC_SCORING_VERSION = "DISC_SCORE_V2" as const;

export type DiscDimension = "D" | "I" | "S" | "C";
export const DISC_DIMENSIONS: readonly DiscDimension[] = ["D", "I", "S", "C"] as const;

export type DiscQuestion = {
  id: string;
  code: string;
  dimension: "DISC";
  subdomain?: string | null;
  reverseScore: boolean;
  weight: number;
  answerType?: "SINGLE_CHOICE_4" | string;
  options?: readonly string[];
  /** Option-position -> DISC dimension code: 1=D, 2=I, 3=S, 4=C. */
  scoringKey: readonly number[];
};

export type DiscAnswer = { questionId: string; value: 1 | 2 | 3 | 4 };

export type DiscMeasurement = {
  testType: "DISC";
  scoringVersion: typeof DISC_SCORING_VERSION;
  /** Compatibility field only. It is NOT a customer-facing overall score. */
  overallScore: number;
  dimensionScores: Array<{
    dimension: DiscDimension;
    score: number;
    selectedCount: number;
    answeredCount: number;
    questionCount: number;
  }>;
  primaryPattern: DiscDimension;
  secondaryPattern: DiscDimension;
  profileModel: "IPSATIVE_FORCED_CHOICE";
  scoreMeaning: "SHARE_OF_FORCED_CHOICES";
};

function assertPermutation(key: readonly number[], questionId: string) {
  if (
    key.length !== 4 ||
    !key.every((value) => Number.isInteger(value) && value >= 1 && value <= 4) ||
    new Set(key).size !== 4
  ) {
    throw new Error(`DISC question ${questionId} requires a four-value dimension mapping permutation.`);
  }
}

function validateQuestion(question: DiscQuestion) {
  if (question.dimension !== "DISC") {
    throw new Error(`DISC question ${question.id} must use domain DISC.`);
  }
  if (question.answerType !== "SINGLE_CHOICE_4") {
    throw new Error(`DISC question ${question.id} must use SINGLE_CHOICE_4.`);
  }
  if (!Array.isArray(question.options) || question.options.length !== 4) {
    throw new Error(`DISC question ${question.id} requires exactly four options.`);
  }
  if (new Set(question.options).size !== 4) {
    throw new Error(`DISC question ${question.id} requires four unique options.`);
  }
  assertPermutation(question.scoringKey, question.id);
  if (question.reverseScore) {
    throw new Error(`DISC V2 question ${question.id} must not use reverse scoring.`);
  }
  if (!(question.weight > 0)) {
    throw new Error(`DISC question ${question.id} must have a positive weight.`);
  }
}

export function scoreDisc(
  questions: DiscQuestion[],
  answers: DiscAnswer[],
): DiscMeasurement {
  if (questions.length !== 24 && questions.length !== 80) {
    throw new Error(`DISC V2 supports 24-item legacy and 80-item production forms; received ${questions.length}.`);
  }

  for (const question of questions) validateQuestion(question);

  const ids = new Set(questions.map((q) => q.id));
  if (ids.size !== questions.length) throw new Error("DISC question IDs must be unique.");

  const answerMap = new Map<string, DiscAnswer["value"]>();
  for (const answer of answers) {
    if (!ids.has(answer.questionId)) throw new Error(`DISC answer references unknown question ${answer.questionId}.`);
    if (![1, 2, 3, 4].includes(answer.value)) throw new Error(`Invalid DISC answer for question ${answer.questionId}.`);
    if (answerMap.has(answer.questionId)) throw new Error(`Duplicate DISC answer for question ${answer.questionId}.`);
    answerMap.set(answer.questionId, answer.value);
  }

  const answeredCount = answerMap.size;
  const counts = Object.fromEntries(DISC_DIMENSIONS.map((d) => [d, 0])) as Record<DiscDimension, number>;

  for (const question of questions) {
    const raw = answerMap.get(question.id);
    if (raw == null) continue;
    const dimensionCode = question.scoringKey[raw - 1];
    const dimension = DISC_DIMENSIONS[dimensionCode - 1];
    if (!dimension) throw new Error(`Invalid DISC dimension mapping for question ${question.id}.`);
    counts[dimension] += 1;
  }

  // V2 is ipsative forced-choice: each response contributes to exactly one
  // DISC dimension, so dimension scores represent the share of choices.
  const dimensionScores = DISC_DIMENSIONS.map((dimension) => {
    const selectedCount = counts[dimension];
    const score = answeredCount > 0 ? Math.round((selectedCount / answeredCount) * 100) : 0;
    return {
      dimension,
      score,
      selectedCount,
      answeredCount,
      questionCount: questions.length,
    };
  });

  const ranked = [...dimensionScores].sort(
    (a, b) =>
      b.selectedCount - a.selectedCount ||
      DISC_DIMENSIONS.indexOf(a.dimension) - DISC_DIMENSIONS.indexOf(b.dimension),
  );

  return {
    testType: "DISC",
    scoringVersion: DISC_SCORING_VERSION,
    // Compatibility-only legacy envelope field. V2 customer semantics use
    // primaryPattern + dimensionScores, never this field.
    overallScore: ranked[0].score,
    dimensionScores,
    primaryPattern: ranked[0].dimension,
    secondaryPattern: ranked[1].dimension,
    profileModel: "IPSATIVE_FORCED_CHOICE",
    scoreMeaning: "SHARE_OF_FORCED_CHOICES",
  };
}

export function createDiscPersistableResult(measurement: DiscMeasurement) {
  return {
    contractVersion: "DISC_RESULT_V2" as const,
    measurement: {
      testType: measurement.testType,
      scoringVersion: measurement.scoringVersion,
      primaryPattern: measurement.primaryPattern,
      secondaryPattern: measurement.secondaryPattern,
      dimensionScores: measurement.dimensionScores,
      profileModel: measurement.profileModel,
      scoreMeaning: measurement.scoreMeaning,
    },
  };
}
