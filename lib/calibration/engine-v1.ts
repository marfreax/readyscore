import type {
  CalibrationDataset,
  CalibrationDimensionMetric,
  CalibrationItemMetric,
  CalibrationReport,
} from "./types";
import { cronbachAlpha, mean, pearsonCorrelation, standardDeviation } from "./statistics";

function scoreValue(value: number, minValue: number, maxValue: number, reverseScore: boolean): number {
  if (!reverseScore) return value;
  return maxValue + minValue - value;
}

function responseFrequency(values: number[]): Record<string, number> {
  return values.reduce<Record<string, number>>((result, value) => {
    const key = String(value);
    result[key] = (result[key] ?? 0) + 1;
    return result;
  }, {});
}

function dimensionMatrix(
  dataset: CalibrationDataset,
  dimensionId: string,
): Array<{ respondentId: string; values: number[]; questionIds: string[] }> {
  const items = dataset.items.filter((item) => item.dimensionId === dimensionId);

  return dataset.responses
    .map((response) => {
      const values: number[] = [];
      const questionIds: string[] = [];

      for (const item of items) {
        const raw = response.answers[item.questionId];
        if (typeof raw !== "number") return null;
        values.push(scoreValue(raw, item.minValue, item.maxValue, Boolean(item.reverseScore)));
        questionIds.push(item.questionId);
      }

      return { respondentId: response.respondentId, values, questionIds };
    })
    .filter((row): row is { respondentId: string; values: number[]; questionIds: string[] } => row !== null);
}

function itemRestCorrelation(
  dataset: CalibrationDataset,
  questionId: string,
  dimensionId: string,
): number | null {
  const items = dataset.items.filter((item) => item.dimensionId === dimensionId);
  if (items.length < 2) return null;

  const target = dataset.items.find((item) => item.questionId === questionId);
  if (!target) return null;

  const pairs: Array<{ item: number; rest: number }> = [];
  for (const response of dataset.responses) {
    const raw = response.answers[questionId];
    if (typeof raw !== "number") continue;

    const itemValue = scoreValue(raw, target.minValue, target.maxValue, Boolean(target.reverseScore));
    const restValues = items
      .filter((item) => item.questionId !== questionId)
      .map((item) => {
        const value = response.answers[item.questionId];
        return typeof value === "number"
          ? scoreValue(value, item.minValue, item.maxValue, Boolean(item.reverseScore))
          : null;
      });

    if (restValues.some((value) => value === null)) continue;
    pairs.push({ item: itemValue, rest: (restValues as number[]).reduce((sum, value) => sum + value, 0) });
  }

  return pearsonCorrelation(
    pairs.map((pair) => pair.item),
    pairs.map((pair) => pair.rest),
  );
}

function buildItemMetric(dataset: CalibrationDataset, questionId: string): CalibrationItemMetric {
  const spec = dataset.items.find((item) => item.questionId === questionId);
  if (!spec) throw new Error(`Unknown calibration item "${questionId}".`);

  const values = dataset.responses
    .map((response) => response.answers[questionId])
    .filter((value): value is number => typeof value === "number")
    .map((value) => scoreValue(value, spec.minValue, spec.maxValue, Boolean(spec.reverseScore)));

  const missingCount = dataset.responses.length - values.length;
  const missingRate = dataset.responses.length === 0 ? 0 : missingCount / dataset.responses.length;
  const flags: string[] = [];

  if (values.length < 3) flags.push("INSUFFICIENT_ITEM_SAMPLE");
  if (values.length > 0 && new Set(values).size === 1) flags.push("ZERO_OBSERVED_VARIANCE");
  if (missingCount > 0) flags.push("MISSING_RESPONSES");

  return {
    questionId,
    dimensionId: spec.dimensionId,
    sampleSize: dataset.responses.length,
    answeredCount: values.length,
    missingCount,
    missingRate,
    mean: mean(values),
    standardDeviation: standardDeviation(values),
    minObserved: values.length ? Math.min(...values) : null,
    maxObserved: values.length ? Math.max(...values) : null,
    responseFrequencies: responseFrequency(values),
    itemRestCorrelation: itemRestCorrelation(dataset, questionId, spec.dimensionId),
    flags,
  };
}

function buildDimensionMetric(dataset: CalibrationDataset, dimensionId: string): CalibrationDimensionMetric {
  const items = dataset.items.filter((item) => item.dimensionId === dimensionId);
  const rows = dimensionMatrix(dataset, dimensionId);
  const totals = rows.map((row) => row.values.reduce((sum, value) => sum + value, 0));
  const flags: string[] = [];

  if (items.length < 2) flags.push("SINGLE_ITEM_DIMENSION");
  if (rows.length < 3) flags.push("INSUFFICIENT_COMPLETE_RESPONSES");
  if (rows.length > 0 && new Set(totals).size === 1) flags.push("ZERO_TOTAL_VARIANCE");

  return {
    dimensionId,
    itemCount: items.length,
    sampleSize: dataset.responses.length,
    completeResponseCount: rows.length,
    mean: mean(totals),
    standardDeviation: standardDeviation(totals),
    cronbachAlpha: cronbachAlpha(rows.map((row) => row.values)),
    itemRestCorrelations: items.map((item) => ({
      questionId: item.questionId,
      value: itemRestCorrelation(dataset, item.questionId, dimensionId),
    })),
    flags,
  };
}

export function calibrateMeasurement(dataset: CalibrationDataset): CalibrationReport {
  if (!dataset.datasetId.trim()) throw new Error("datasetId is required.");
  if (!dataset.testType.trim()) throw new Error("testType is required.");
  if (!dataset.scoringVersion.trim()) throw new Error("scoringVersion is required.");
  if (dataset.items.length === 0) throw new Error("Calibration dataset must contain at least one item.");
  if (dataset.responses.length === 0) throw new Error("Calibration dataset must contain at least one respondent.");

  const ids = new Set<string>();
  for (const item of dataset.items) {
    if (ids.has(item.questionId)) throw new Error(`Duplicate calibration item "${item.questionId}".`);
    ids.add(item.questionId);
    if (item.minValue >= item.maxValue) throw new Error(`Invalid scale bounds for "${item.questionId}".`);
  }

  const itemMetrics = dataset.items.map((item) => buildItemMetric(dataset, item.questionId));
  const dimensionIds = [...new Set(dataset.items.map((item) => item.dimensionId))];
  const dimensionMetrics = dimensionIds.map((dimensionId) => buildDimensionMetric(dataset, dimensionId));

  const hasInsufficientEvidence = itemMetrics.some((item) =>
    item.flags.includes("INSUFFICIENT_ITEM_SAMPLE"),
  ) || dimensionMetrics.some((dimension) =>
    dimension.flags.includes("INSUFFICIENT_COMPLETE_RESPONSES"),
  );

  const hasReviewFlags = itemMetrics.some((item) => item.flags.length > 0) ||
    dimensionMetrics.some((dimension) => dimension.flags.length > 0);

  return {
    contractVersion: "MEASUREMENT_CALIBRATION_V1",
    reportVersion: "CALIBRATION_REPORT_V1",
    datasetId: dataset.datasetId,
    testType: dataset.testType,
    scoringVersion: dataset.scoringVersion,
    status: hasInsufficientEvidence
      ? "INSUFFICIENT_EVIDENCE"
      : hasReviewFlags
        ? "REVIEW_REQUIRED"
        : "DESCRIPTIVE_ONLY",
    sampleSize: dataset.responses.length,
    itemMetrics,
    dimensionMetrics,
    governance: {
      productionMutation: false,
      scoringMutation: false,
      questionPublicationMutation: false,
      normingPerformed: false,
      validityClaim: false,
    },
    limitations: [
      "Calibration V1 produces diagnostic statistics only; it does not alter production scoring.",
      "Reliability statistics are descriptive evidence and are not a psychometric validation decision.",
      "No norming, equating, cutoff optimization, construct-validity, or population-validity claim is produced.",
      "Production question publication remains governed by the existing question lifecycle.",
    ],
  };
}
