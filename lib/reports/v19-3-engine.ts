import { buildAssessmentSummaryV19_3 } from "../result-summary-v19-3";

export const V19_3_REPORT_CONTRACT_VERSION = "REPORT_V19_3_V1" as const;
export const V19_3_REPORT_ENGINE_VERSION = "REPORT_ADJUSTMENT_ENGINE_V1" as const;

export const V19_3_ASSESSMENTS = [
  "RIASEC",
  "DISC",
  "EQ",
  "COGNITIVE",
  "WORK_ATTITUDE",
  "LEARNING_PREFERENCE",
] as const;

export type V19_3_AssessmentType = typeof V19_3_ASSESSMENTS[number];
export type ReportDimension = { code: string; label: string; score: number | null; description: string };

export type AssessmentReportV19_3 = {
  contractVersion: typeof V19_3_REPORT_CONTRACT_VERSION;
  engineVersion: typeof V19_3_REPORT_ENGINE_VERSION;
  attemptId: string;
  participantName: string;
  accountOwnerName: string;
  assessmentType: V19_3_AssessmentType;
  title: string;
  completedAt: string | null;
  interpretation: { summary: string; status: string; confidence: string };
  assessmentSummary: { title: string; reading: string; strengths: string[]; areasToWatch: string[] };
  dimensions: ReportDimension[];
  visualization: { type: "RADAR" | "BARS" | "PROFILE"; dimensions: ReportDimension[] };
  recommendations: string[];
  limitations: string[];
};

const TITLES: Record<V19_3_AssessmentType, string> = {
  RIASEC: "RIASEC — Minat Karier",
  DISC: "DISC — Kecenderungan Perilaku",
  EQ: "Emotional Intelligence — Kecenderungan Emosional",
  COGNITIVE: "Cognitive — Kemampuan Kognitif",
  WORK_ATTITUDE: "Work Attitude — Kecenderungan Sikap Kerja",
  LEARNING_PREFERENCE: "Learning Preference — Preferensi Belajar",
};

const LABELS: Record<string, string> = {
  R: "Realistic", I: "Investigative", A: "Artistic", S: "Social", E: "Enterprising", C: "Conventional",
  D: "Dominance", IFL: "Influence", ST: "Steadiness", CND: "Conscientiousness",
  EMOTION_AWARENESS: "Emotion Awareness", EMOTION_REGULATION: "Emotion Regulation",
  EMPATHY_SOCIAL_AWARENESS: "Empathy / Social Awareness", RELATIONSHIP_SOCIAL_RESPONSE: "Relationship / Social Response",
  VERBAL_REASONING: "Verbal Reasoning", NUMERICAL_REASONING: "Numerical Reasoning", LOGICAL_REASONING: "Logical Reasoning", ABSTRACT_REASONING: "Abstract Reasoning",
  SYSTEMATIKA_KERJA: "Sistematika Kerja", POLA_BERPIKIR: "Pola Berpikir", PENGAMBILAN_KEPUTUSAN: "Pengambilan Keputusan", KERJASAMA: "Kerjasama", INTERAKSI_SOSIAL: "Interaksi Sosial", PENYESUAIAN_DIRI: "Penyesuaian Diri", KEDISIPLINAN: "Kedisiplinan",
  VISUAL: "Visual", AUDITORY: "Auditory", KINESTHETIC: "Kinesthetic",
};

const DESCRIPTIONS: Record<string, string> = {
  R: "Praktis, konkret, teknis, dan hands-on.", I: "Analitis, ingin tahu, dan senang memecahkan masalah.", A: "Kreatif, ekspresif, dan terbuka pada ide.", S: "Membantu, mengajar, berinteraksi, dan mendukung orang lain.", E: "Inisiatif, persuasi, kepemimpinan, dan penggerakan.", C: "Terstruktur, teliti, teratur, dan nyaman dengan prosedur.",
  D: "Langsung, tegas, berorientasi pada hasil dan keputusan.", IFL: "Ekspresif, persuasif, energik, dan berorientasi pada interaksi.", ST: "Stabil, kooperatif, suportif, dan menghargai konsistensi.", CND: "Teliti, sistematis, hati-hati, dan memperhatikan standar.",
  VISUAL: "Kecenderungan nyaman menggunakan representasi visual untuk memahami informasi.", AUDITORY: "Kecenderungan nyaman menggunakan penjelasan, diskusi, atau informasi berbasis suara.", KINESTHETIC: "Kecenderungan nyaman memahami melalui praktik, simulasi, atau keterlibatan langsung.",
};

function normalizeType(value: string): V19_3_AssessmentType {
  const normalized = value.trim().toUpperCase().replace(/-/g, "_");
  if ((V19_3_ASSESSMENTS as readonly string[]).includes(normalized)) return normalized as V19_3_AssessmentType;
  throw new Error(`REPORT_V19_3_UNSUPPORTED_ASSESSMENT:${value}`);
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? value as Record<string, unknown> : {};
}

function numberValue(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function extractDimensions(result: unknown): ReportDimension[] {
  const root = record(result);
  const specificKeys = ["riasec", "disc", "eq", "cognitive", "workAttitude", "learningPreference"];
  for (const key of specificKeys) {
    const specific = record(root[key]);
    const measurement = record(specific.measurement);
    const raw = Array.isArray(measurement.dimensionScores) ? measurement.dimensionScores : [];
    if (raw.length) return raw.map((item) => {
      const row = record(item);
      const code = typeof row.dimension === "string" ? row.dimension : "UNKNOWN";
      const labelKey = code === "I" && root.assessmentType === "DISC" ? "IFL" : code === "S" && root.assessmentType === "DISC" ? "ST" : code === "C" && root.assessmentType === "DISC" ? "CND" : code;
      return { code, label: LABELS[labelKey] ?? code, score: numberValue(row.score), description: DESCRIPTIONS[labelKey] ?? "Dimensi dalam assessment ini." };
    });
  }
  const domainScores = Array.isArray(root.domainScores) ? root.domainScores : [];
  return domainScores.map((item) => {
    const row = record(item);
    const code = typeof row.domainId === "string" ? row.domainId : "UNKNOWN";
    return { code, label: LABELS[code] ?? code, score: numberValue(row.score), description: DESCRIPTIONS[code] ?? "Dimensi dalam assessment ini." };
  });
}

function recommendations(type: V19_3_AssessmentType, dimensions: ReportDimension[]): string[] {
  const top = [...dimensions].filter((d) => d.score !== null).sort((a, b) => (b.score ?? 0) - (a.score ?? 0)).slice(0, 3);
  if (!top.length) return ["Lengkapi assessment agar rekomendasi berbasis hasil dapat ditampilkan."];
  if (type === "LEARNING_PREFERENCE") return top.map((d) => `Eksplorasi strategi belajar yang memberi ruang pada preferensi ${d.label.toLowerCase()}, tanpa menganggapnya sebagai batas kemampuan belajar.`);
  if (type === "RIASEC") return top.map((d) => `Eksplorasi aktivitas yang selaras dengan pola ${d.label} sebagai titik awal, lalu bandingkan dengan minat dan pengalaman nyata.`);
  if (type === "DISC") return top.map((d) => `Gunakan kecenderungan ${d.label} sebagai bahan refleksi komunikasi, kolaborasi, dan cara merespons situasi kerja.`);
  if (type === "WORK_ATTITUDE") return top.map((d) => `Gunakan area ${d.label} sebagai bahan refleksi cara bekerja dan situasi kerja yang ingin dikembangkan.`);
  if (type === "EQ") return top.map((d) => `Gunakan area ${d.label} sebagai bahan refleksi pengelolaan emosi dan interaksi sosial.`);
  return top.map((d) => `Gunakan area ${d.label} sebagai bahan eksplorasi strategi pemecahan masalah; hasil ini tidak disetarakan dengan skor assessment lain.`);
}

export function buildAssessmentReportV19_3(input: { attemptId: string; participantName: string; accountOwnerName: string; assessmentType: string; completedAt: Date | string | null; result: unknown }): AssessmentReportV19_3 {
  const type = normalizeType(input.assessmentType);
  const root = record(input.result);
  const interpretation = record(root.interpretation);
  const dimensions = extractDimensions(input.result);
  const assessmentSummary = buildAssessmentSummaryV19_3({
    assessmentType: type,
    interpretationSummary: typeof interpretation.summary === "string" ? interpretation.summary : null,
    dimensions: dimensions.map((dimension) => ({
      code: dimension.code,
      name: dimension.label,
      description: dimension.description,
      score: dimension.score,
    })),
    primary: record(record(root.disc).measurement).primaryPattern as string | undefined,
    secondary: record(record(root.disc).measurement).secondaryPattern as string | undefined,
    dominant: Array.isArray(record(record(root.learningPreference).measurement).dominantPreferences) ? record(record(root.learningPreference).measurement).dominantPreferences as string[] : undefined,
  });
  return {
    contractVersion: V19_3_REPORT_CONTRACT_VERSION,
    engineVersion: V19_3_REPORT_ENGINE_VERSION,
    attemptId: input.attemptId,
    participantName: input.participantName,
    accountOwnerName: input.accountOwnerName,
    assessmentType: type,
    title: TITLES[type],
    completedAt: input.completedAt instanceof Date ? input.completedAt.toISOString() : input.completedAt,
    interpretation: {
      summary: typeof interpretation.summary === "string" ? interpretation.summary : "Interpretasi mengikuti semantic contract assessment asal.",
      status: typeof interpretation.status === "string" ? interpretation.status : String(root.status ?? "UNKNOWN"),
      confidence: typeof interpretation.confidence === "string" ? interpretation.confidence : "LIMITED",
    },
    assessmentSummary,
    dimensions,
    visualization: { type: dimensions.length >= 3 ? "RADAR" : "PROFILE", dimensions },
    recommendations: recommendations(type, dimensions),
    limitations: [
      "Report tidak membuat universal score dan tidak melakukan raw averaging antar-assessment.",
      "Interpretasi tetap mengikuti semantic contract assessment asal.",
      type === "LEARNING_PREFERENCE" ? "Learning Preference dibaca sebagai kecenderungan/preferensi, bukan batas kemampuan belajar." : "Gunakan hasil sebagai bahan eksplorasi, bukan keputusan deterministik.",
    ],
  };
}
