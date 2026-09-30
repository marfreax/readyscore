import type { AssessmentResult } from "../types";
export const LEARNING_PREFERENCE_INTERPRETATION_VERSION = "LEARNING_PREFERENCE_INTERPRETATION_V1" as const;
const NAMES = { VISUAL: "Visual", AUDITORY: "Auditory", KINESTHETIC: "Kinesthetic" } as const;
export function interpretLearningPreference(result: AssessmentResult) {
  const dims = result.learningPreference?.measurement.dimensionScores ?? result.domainScores.map(d=>({dimension:d.domainId,score:d.score,percentage:d.score,answeredCount:d.questionCount,questionCount:d.questionCount}));
  const ranked = [...dims].sort((a,b)=>b.score-a.score || String(a.dimension).localeCompare(String(b.dimension)));
  const dominantScore = ranked[0]?.score ?? 0;
  const dominant = ranked.filter(d=>d.score===dominantScore).map(d=>NAMES[d.dimension as keyof typeof NAMES] ?? d.dimension);
  const summary = ranked.length ? `Profil Learning Preference menunjukkan kecenderungan relatif pada ${dominant.join(" dan ")}. Hasil ini menggambarkan preferensi dalam konteks assessment, bukan batas kemampuan belajar.` : "Data Learning Preference belum cukup untuk membentuk ringkasan.";
  return { contractVersion:"TEST_RESULT_V1", interpretationVersion:LEARNING_PREFERENCE_INTERPRETATION_VERSION, status: result.status === "COMPLETE" ? "COMPLETE" : "PARTIAL", summary, confidence: result.status === "COMPLETE" ? "MODERATE" : "LIMITED", claims:{allowed:["relative learning preferences","self-reflection on learning approaches"],restricted:["learning strategy suggestions","educational context exploration"],prohibited:["absolute learning-style label","learning ability diagnosis","deterministic educational or career decision"]}, dimensions:dims.map(d=>({code:d.dimension,name:NAMES[d.dimension as keyof typeof NAMES] ?? d.dimension,score:d.score,percentage:d.percentage})), dominant, development:[...ranked].reverse().slice(0,2).map(d=>NAMES[d.dimension as keyof typeof NAMES] ?? d.dimension)};
}
