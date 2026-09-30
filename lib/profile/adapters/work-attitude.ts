import type { CrossTestProfileInput, ProfileConfidence, ProfileSignal, ProfileSignalAdapter } from "../types";

type WorkAttitudeDimension = {
  dimension: string;
  score: number;
  answeredCount: number;
  questionCount: number;
};

const LABELS: Record<string, string> = {
  SYSTEMATIKA_KERJA: "Sistematika Kerja",
  POLA_BERPIKIR: "Pola Berpikir",
  PENGAMBILAN_KEPUTUSAN: "Pengambilan Keputusan",
  KERJASAMA: "Kerjasama",
  INTERAKSI_SOSIAL: "Interaksi Sosial",
  PENYESUAIAN_DIRI: "Penyesuaian Diri",
  KEDISIPLINAN: "Kedisiplinan",
};

function confidenceFor(dimensions: WorkAttitudeDimension[]): ProfileConfidence {
  return dimensions.every((item) => item.answeredCount === item.questionCount) ? "MODERATE" : "LIMITED";
}

export const workAttitudeProfileAdapter: ProfileSignalAdapter = {
  testType: "WORK_ATTITUDE",
  extract(input) {
    const payload = input.testSpecific as {
      measurement?: { testType?: string; dimensionScores?: WorkAttitudeDimension[] };
    } | undefined;
    const measurement = payload?.measurement;
    const dimensions = measurement?.dimensionScores;

    if (!measurement || measurement.testType !== "WORK_ATTITUDE" || !Array.isArray(dimensions) || dimensions.length !== 7) {
      return {
        signals: [],
        source: {
          testType: input.result.assessmentType,
          attemptId: input.result.attemptId,
          status: "INSUFFICIENT",
          confidence: "LIMITED",
          resultContractVersion: input.result.interpretation?.contractVersion ?? "TEST_RESULT_V1",
          scoringVersion: input.result.scoringVersion,
          interpretationVersion: input.result.interpretation?.interpretationVersion,
          excludedSignalCount: 0,
          exclusionReasons: ["WORK_ATTITUDE_RESULT_V1 measurement payload is missing or invalid."],
        },
      };
    }

    const confidence = confidenceFor(dimensions);
    const complete = dimensions.filter((item) => item.answeredCount === item.questionCount);
    const available = complete.length > 0;
    const signals: ProfileSignal[] = dimensions.map((item) => ({
      signalId: `work-attitude:${input.result.attemptId}:${item.dimension}`,
      domain: "STRENGTH" as const,
      construct: "Work Attitude Evidence",
      dimension: item.dimension,
      label: LABELS[item.dimension] ?? item.dimension,
      score: item.score,
      scoreScale: "PRESENTATION_0_100" as const,
      scoreSemantics: "PROFILE" as const,
      status: item.answeredCount === item.questionCount ? "AVAILABLE" as const : item.answeredCount > 0 ? "PARTIAL" as const : "INSUFFICIENT" as const,
      confidence,
      sourceTestType: "WORK_ATTITUDE",
      sourceResultAttemptId: input.result.attemptId,
      sourceResultContractVersion: input.result.interpretation?.contractVersion ?? "TEST_RESULT_V1",
      sourceScoringVersion: input.result.scoringVersion,
      sourceInterpretationVersion: input.result.interpretation?.interpretationVersion,
    }));

    // Penyesuaian Diri is exposed separately as resilience-related evidence,
    // while preserving its original Work Attitude construct/provenance.
    const adaptation = dimensions.find((item) => item.dimension === "PENYESUAIAN_DIRI");
    if (adaptation) {
      signals.push({
        signalId: `work-attitude:${input.result.attemptId}:resilience:PENYESUAIAN_DIRI`,
        domain: "RESILIENCE" as const,
        construct: "Adaptation-related Work Attitude Evidence",
        dimension: adaptation.dimension,
        label: LABELS[adaptation.dimension],
        score: adaptation.score,
        scoreScale: "PRESENTATION_0_100" as const,
        scoreSemantics: "PROFILE" as const,
        status: adaptation.answeredCount === adaptation.questionCount ? "AVAILABLE" as const : adaptation.answeredCount > 0 ? "PARTIAL" as const : "INSUFFICIENT" as const,
        confidence,
        sourceTestType: "WORK_ATTITUDE",
        sourceResultAttemptId: input.result.attemptId,
        sourceResultContractVersion: input.result.interpretation?.contractVersion ?? "TEST_RESULT_V1",
        sourceScoringVersion: input.result.scoringVersion,
        sourceInterpretationVersion: input.result.interpretation?.interpretationVersion,
      });
    }

    return {
      signals,
      source: {
        testType: "WORK_ATTITUDE",
        attemptId: input.result.attemptId,
        status: available ? "AVAILABLE" : "PARTIAL",
        confidence,
        resultContractVersion: input.result.interpretation?.contractVersion ?? "TEST_RESULT_V1",
        scoringVersion: input.result.scoringVersion,
        interpretationVersion: input.result.interpretation?.interpretationVersion,
        excludedSignalCount: 0,
        exclusionReasons: [],
      },
    };
  },
};
