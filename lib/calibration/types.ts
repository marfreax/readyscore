export type CalibrationResponse = number | null;

export type CalibrationItemSpec = {
  questionId: string;
  dimensionId: string;
  minValue: number;
  maxValue: number;
  reverseScore?: boolean;
};

export type CalibrationDataset = {
  datasetId: string;
  testType: string;
  scoringVersion: string;
  items: CalibrationItemSpec[];
  responses: Array<{
    respondentId: string;
    answers: Record<string, CalibrationResponse>;
  }>;
};

export type CalibrationItemMetric = {
  questionId: string;
  dimensionId: string;
  sampleSize: number;
  answeredCount: number;
  missingCount: number;
  missingRate: number;
  mean: number | null;
  standardDeviation: number | null;
  minObserved: number | null;
  maxObserved: number | null;
  responseFrequencies: Record<string, number>;
  itemRestCorrelation: number | null;
  flags: string[];
};

export type CalibrationDimensionMetric = {
  dimensionId: string;
  itemCount: number;
  sampleSize: number;
  completeResponseCount: number;
  mean: number | null;
  standardDeviation: number | null;
  cronbachAlpha: number | null;
  itemRestCorrelations: Array<{ questionId: string; value: number | null }>;
  flags: string[];
};

export type CalibrationReport = {
  contractVersion: "MEASUREMENT_CALIBRATION_V1";
  reportVersion: "CALIBRATION_REPORT_V1";
  datasetId: string;
  testType: string;
  scoringVersion: string;
  status: "DESCRIPTIVE_ONLY" | "REVIEW_REQUIRED" | "INSUFFICIENT_EVIDENCE";
  sampleSize: number;
  itemMetrics: CalibrationItemMetric[];
  dimensionMetrics: CalibrationDimensionMetric[];
  governance: {
    productionMutation: false;
    scoringMutation: false;
    questionPublicationMutation: false;
    normingPerformed: false;
    validityClaim: false;
  };
  limitations: string[];
};
