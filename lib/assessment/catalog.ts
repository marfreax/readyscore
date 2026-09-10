import { ASSESSMENT_CONFIG, type AssessmentType } from "../assessment-config";

export type CustomerAssessmentCatalogItem = {
  type: Exclude<AssessmentType, "free" | "premium">;
  label: string;
  eyebrow: string;
  description: string;
  measures: string[];
  responseModel: string;
  questionCount: number;
  duration: string;
};

export const CUSTOMER_ASSESSMENT_CATALOG: readonly CustomerAssessmentCatalogItem[] = [
  {
    type: "cognitive",
    label: "Cognitive",
    eyebrow: "COGNITIVE",
    description: "Assessment objektif untuk melihat pola penalaran pada beberapa domain kognitif.",
    measures: ["Verbal Reasoning", "Numerical Reasoning", "Logical Reasoning", "Abstract Reasoning"],
    responseModel: "Pilihan jawaban objektif",
    questionCount: ASSESSMENT_CONFIG.cognitive.questionCount,
    duration: "20 menit",
  },
  {
    type: "eq",
    label: "Emotional Intelligence",
    eyebrow: "EQ",
    description: "Assessment berbasis skenario untuk melihat pola respons emosional dan sosial.",
    measures: ["Emotion Awareness", "Emotion Regulation", "Empathy / Social Awareness", "Relationship / Social Response"],
    responseModel: "Situational judgment",
    questionCount: ASSESSMENT_CONFIG.eq.questionCount,
    duration: "20 menit",
  },
  {
    type: "disc",
    label: "DISC",
    eyebrow: "DISC",
    description: "Assessment untuk memetakan kecenderungan pola perilaku pada empat dimensi DISC.",
    measures: ["Dominance", "Influence", "Steadiness", "Conscientiousness"],
    responseModel: "Pilihan respons behavioral",
    questionCount: ASSESSMENT_CONFIG.disc.questionCount,
    duration: "20 menit",
  },
  {
    type: "riasec",
    label: "RIASEC",
    eyebrow: "RIASEC",
    description: "Assessment untuk memetakan pola minat pada enam dimensi vocational interest.",
    measures: ["Realistic", "Investigative", "Artistic", "Social", "Enterprising", "Conventional"],
    responseModel: "Preference / Likert 5",
    questionCount: ASSESSMENT_CONFIG.riasec.questionCount,
    duration: "20 menit",
  },
] as const;
