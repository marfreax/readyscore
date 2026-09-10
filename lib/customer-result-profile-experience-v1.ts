export const CUSTOMER_RESULT_PROFILE_EXPERIENCE_VERSION =
  "V8.11_CUSTOMER_RESULT_PROFILE_EXPERIENCE_V1" as const;

export type CustomerAssessmentType = "COGNITIVE" | "EQ" | "DISC" | "RIASEC";

export type CustomerResultExperience = {
  readonly assessmentType: CustomerAssessmentType;
  readonly resultTitle: string;
  readonly resultDescription: string;
  readonly mainResultLabel: string;
  readonly profileLabel: string;
  readonly nextAction: string;
  readonly prohibitedClaims: readonly string[];
};

const EXPERIENCE: Readonly<Record<CustomerAssessmentType, CustomerResultExperience>> = {
  COGNITIVE: {
    assessmentType: "COGNITIVE",
    resultTitle: "Cognitive Reasoning Profile",
    resultDescription:
      "Pola performa relatif pada empat dimensi penalaran dalam assessment ini.",
    mainResultLabel: "Cognitive Score",
    profileLabel: "Cognitive Dimensions",
    nextAction:
      "Gunakan hasil untuk refleksi terhadap pola penalaran dan eksplorasi pengembangan yang relevan.",
    prohibitedClaims: ["IQ", "diagnosis", "guaranteed academic outcome", "guaranteed career outcome"],
  },
  EQ: {
    assessmentType: "EQ",
    resultTitle: "EQ Profile",
    resultDescription:
      "Pola respons relatif pada empat dimensi EQ dalam situasi yang disajikan.",
    mainResultLabel: "EQ Score",
    profileLabel: "EQ Dimensions",
    nextAction:
      "Gunakan hasil sebagai bahan refleksi dan pengembangan kemampuan emosional dalam konteks nyata.",
    prohibitedClaims: ["clinical diagnosis", "standardized population norm", "guaranteed academic outcome", "guaranteed career outcome"],
  },
  DISC: {
    assessmentType: "DISC",
    resultTitle: "Behavioral Profile",
    resultDescription:
      "Pola relatif D/I/S/C dari respons forced-choice pada situasi yang disajikan.",
    mainResultLabel: "Primary Behavioral Pattern",
    profileLabel: "D / I / S / C Profile",
    nextAction:
      "Gunakan hasil untuk merefleksikan pola interaksi dan cara bekerja dalam konteks yang berbeda.",
    prohibitedClaims: ["aptitude", "intelligence", "clinical diagnosis", "universal score"],
  },
  RIASEC: {
    assessmentType: "RIASEC",
    resultTitle: "RIASEC Interest Profile",
    resultDescription:
      "Pola preferensi relatif pada enam dimensi vocational interest.",
    mainResultLabel: "Top Interest Pattern",
    profileLabel: "Six Interest Dimensions",
    nextAction:
      "Gunakan hasil sebagai bahan eksplorasi minat; pertimbangkan konteks, pengalaman, dan informasi lain sebelum mengambil keputusan.",
    prohibitedClaims: ["ability", "intelligence", "guaranteed career fit", "guaranteed major suitability", "universal score"],
  },
} as const;

export function getCustomerResultExperience(
  assessmentType: string,
): CustomerResultExperience {
  const key = assessmentType.trim().toUpperCase() as CustomerAssessmentType;
  const experience = EXPERIENCE[key];
  if (!experience) throw new Error(`Unsupported assessment type: ${assessmentType}`);
  return experience;
}

export function assertCustomerResultProfileSafety(): void {
  for (const experience of Object.values(EXPERIENCE)) {
    if (experience.prohibitedClaims.length === 0) {
      throw new Error(`${experience.assessmentType} must define prohibited claims.`);
    }
  }
}
