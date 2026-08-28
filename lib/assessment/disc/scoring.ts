
export const DISC_SCORING_VERSION = "DISC_SCORE_V1" as const;

export type DiscDimension = "D" | "I" | "S" | "C";
export type DiscQuestion = {
  id: string;
  code: string;
  dimension: DiscDimension;
  reverseScore: boolean;
  weight: number;
};
export type DiscAnswer = { questionId: string; value: number };

export type DiscMeasurement = {
  testType: "DISC";
  scoringVersion: typeof DISC_SCORING_VERSION;
  overallScore: number;
  dimensionScores: Array<{
    dimension: DiscDimension;
    score: number;
    answeredCount: number;
    questionCount: number;
  }>;
  primaryPattern: DiscDimension;
  secondaryPattern: DiscDimension;
};

const ORDER: DiscDimension[] = ["D", "I", "S", "C"];

export function scoreDisc(questions: DiscQuestion[], answers: DiscAnswer[]): DiscMeasurement {
  const byId = new Map(answers.map((a) => [a.questionId, a.value]));
  const dimensions = ORDER.map((dimension) => {
    const qs = questions.filter((q) => q.dimension === dimension);
    let weighted = 0;
    let weightTotal = 0;
    for (const q of qs) {
      const raw = byId.get(q.id);
      if (![1,2,3,4,5].includes(raw ?? 0)) throw new Error(`Invalid DISC answer for question ${q.id}.`);
      const scored = q.reverseScore ? 6 - raw! : raw!;
      const weight = q.weight > 0 ? q.weight : 1;
      weighted += scored * weight;
      weightTotal += weight;
    }
    const average = weightTotal ? weighted / weightTotal : 0;
    const score = Math.round(((average - 1) / 4) * 100);
    return { dimension, score: Math.max(0, Math.min(100, score)), answeredCount: qs.filter((q) => byId.has(q.id)).length, questionCount: qs.length };
  });
  const ranked = [...dimensions].sort((a,b) => b.score-a.score || ORDER.indexOf(a.dimension)-ORDER.indexOf(b.dimension));
  const overallScore = Math.round(dimensions.reduce((sum,d)=>sum+d.score,0)/dimensions.length);
  return { testType:"DISC", scoringVersion:DISC_SCORING_VERSION, overallScore, dimensionScores:dimensions, primaryPattern:ranked[0].dimension, secondaryPattern:ranked[1].dimension };
}

export function createDiscPersistableResult(measurement: DiscMeasurement) {
  return {
    contractVersion: "DISC_RESULT_V1" as const,
    measurement: {
      testType: measurement.testType,
      scoringVersion: measurement.scoringVersion,
      primaryPattern: measurement.primaryPattern,
      secondaryPattern: measurement.secondaryPattern,
      dimensionScores: measurement.dimensionScores,
    },
  };
}
