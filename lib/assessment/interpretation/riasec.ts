import type { AssessmentResult } from "../types";
import {
  TEST_RESULT_CONTRACT_VERSION,
  type ResultDimensionLevel,
  type ResultInterpretationStatus,
} from "../result/types";
import type { InterpretationContext, TestInterpretationEngine } from "./types";
import type { RiasecResult } from "../riasec/types";

export const RIASEC_INTERPRETATION_VERSION = "RIASEC_INTERPRETATION_V2" as const;

const DIMENSIONS = {
  R: {
    name: "Realistic",
    description: "kecenderungan menikmati aktivitas praktis, konkret, teknis, atau hands-on.",
  },
  I: {
    name: "Investigative",
    description: "kecenderungan menikmati analisis, penyelidikan, pemecahan masalah, dan pencarian penjelasan.",
  },
  A: {
    name: "Artistic",
    description: "kecenderungan menikmati kreativitas, ekspresi, ide, dan cara kerja yang tidak terlalu terstruktur.",
  },
  S: {
    name: "Social",
    description: "kecenderungan menikmati membantu, mengajar, berinteraksi, dan mendukung perkembangan orang lain.",
  },
  E: {
    name: "Enterprising",
    description: "kecenderungan menikmati persuasi, inisiatif, kepemimpinan, dan penggerakan orang atau aktivitas.",
  },
  C: {
    name: "Conventional",
    description: "kecenderungan menikmati struktur, ketelitian, keteraturan, data, dan prosedur yang jelas.",
  },
} as const;

type DimensionKey = keyof typeof DIMENSIONS;

function levelFor(score: number | null): ResultDimensionLevel {
  if (score === null) return "LOW";
  // Presentation classification only. It is not a norm, percentile, or psychometric claim.
  if (score >= 70) return "HIGH";
  if (score >= 40) return "MEDIUM";
  return "LOW";
}

function statusFor(measurement: RiasecResult): ResultInterpretationStatus {
  if (measurement.isComplete) return "COMPLETE";
  if (measurement.measuredDimensionCount > 0) return "PARTIAL";
  return "INSUFFICIENT";
}

function confidenceFor(status: ResultInterpretationStatus, coverage: number): "HIGH" | "MODERATE" | "LIMITED" {
  if (status === "COMPLETE" && coverage >= 100) return "HIGH";
  if (status !== "INSUFFICIENT" && coverage >= 80) return "MODERATE";
  return "LIMITED";
}

function getMeasurement(context: InterpretationContext): RiasecResult {
  const result = context.testSpecific as { measurement?: RiasecResult } | undefined;
  const measurement = result?.measurement;
  if (!measurement || measurement.testType !== "RIASEC") {
    throw new Error("RIASEC interpretation requires the RIASEC_RESULT_V2 measurement payload.");
  }
  return measurement;
}

export const riasecInterpretationEngine: TestInterpretationEngine = {
  testType: "RIASEC",
  interpretationVersion: RIASEC_INTERPRETATION_VERSION,
  interpret(context) {
    const measurement = getMeasurement(context);
    const status = statusFor(measurement);
    const confidence = confidenceFor(status, measurement.coveragePercent);
    const topCode = measurement.topCode;

    const dimensions = measurement.dimensionScores.map((item) => {
      const key = item.dimension as DimensionKey;
      const definition = DIMENSIONS[key];
      return {
        dimension: item.dimension,
        name: definition.name,
        description: definition.description,
        score: item.score,
        level: levelFor(item.score),
        answeredCount: item.answeredCount,
        questionCount: item.questionCount,
        sufficient: item.sufficient,
      };
    });

    const topDimensions = measurement.rankedDimensions
      .filter((item) => item.score !== null)
      .slice(0, 3)
      .map((item) => {
        const definition = DIMENSIONS[item.dimension as DimensionKey];
        return {
          dimension: item.dimension,
          name: definition.name,
          score: item.score,
          level: levelFor(item.score),
        };
      });

    let summary: string;
    if (status === "INSUFFICIENT") {
      summary = "Data yang tersedia belum cukup untuk membentuk profil minat RIASEC yang bermakna.";
    } else if (status === "PARTIAL") {
      summary = "Profil minat RIASEC sementara tersedia, tetapi beberapa dimensi belum terukur secara memadai.";
    } else if (topCode) {
      const names = topDimensions.map((item) => item.name).join(", ");
      summary = `Pola minat teratas Anda adalah ${topCode}, dengan dimensi ${names} sebagai area yang paling menonjol dalam hasil ini.`;
    } else {
      summary = "Profil minat RIASEC lengkap telah tersedia.";
    }

    return {
      contractVersion: TEST_RESULT_CONTRACT_VERSION,
      interpretationVersion: RIASEC_INTERPRETATION_VERSION,
      status,
      summary,
      confidence,
      claims: {
        allowed: [
          "vocational interest profile",
          "study/career exploration",
          "relative interest pattern across RIASEC dimensions",
        ],
        restricted: [
          "ability or aptitude claims",
          "personality claims",
          "major/career suitability claims without downstream synthesis",
        ],
        prohibited: [
          "career outcome certainty claims",
          "major suitability certainty claims",
          "ability or intelligence claims from RIASEC scores",
        ],
      },
      riasec: {
        profileStatus: status,
        coveragePercent: measurement.coveragePercent,
        topCode,
        topDimensions,
        dimensions,
        interpretationNotes: [
          "RIASEC describes vocational interest tendencies, not ability or intelligence.",
          "Dimension levels are presentation classifications for this result contract and are not percentiles or psychometric norms.",
          "Study, major, and career recommendations are downstream synthesis and are outside Phase 3.5.",
        ],
      },
    };
  },
};

export function assertRiasecInterpretation(result: AssessmentResult, interpretation: ReturnType<typeof riasecInterpretationEngine.interpret>): void {
  if (result.assessmentType !== "RIASEC") throw new Error("Expected RIASEC result.");
  if (interpretation.interpretationVersion !== RIASEC_INTERPRETATION_VERSION) throw new Error("Unexpected RIASEC interpretation version.");
  const riasecPayload = interpretation.riasec as { dimensions?: unknown } | undefined;
  if (!Array.isArray(riasecPayload?.dimensions) || riasecPayload.dimensions.length !== 6) {
    throw new Error("RIASEC interpretation must expose six dimensions.");
  }
}
