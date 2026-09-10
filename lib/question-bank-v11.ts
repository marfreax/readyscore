export const QUESTION_GROUPS = ["DISC", "RIASEC", "IQ_COGNITIVE", "EQ"] as const;
export type QuestionGroup = typeof QUESTION_GROUPS[number];

export const QUESTION_GROUP_LABELS: Record<QuestionGroup, string> = {
  DISC: "DISC",
  RIASEC: "RIASEC",
  IQ_COGNITIVE: "IQ & Cognitive",
  EQ: "EQ",
};

export function normalizeQuestionGroup(value: string | null | undefined): QuestionGroup {
  const normalized = String(value ?? "").trim().toUpperCase().replace(/[\s-]+/g, "_");
  if (normalized === "COGNITIVE" || normalized === "IQ" || normalized === "IQ_COGNITIVE") return "IQ_COGNITIVE";
  if (normalized === "DISC" || normalized === "RIASEC" || normalized === "EQ") return normalized;
  throw new Error("INVALID_QUESTION_GROUP");
}

export function testTypeCodeForGroup(group: QuestionGroup): "DISC" | "RIASEC" | "COGNITIVE" | "EQ" {
  return group === "IQ_COGNITIVE" ? "COGNITIVE" : group;
}

export function questionGroupFromTestTypeCode(code: string | null | undefined): QuestionGroup | null {
  const normalized = String(code ?? "").trim().toUpperCase();
  if (normalized === "COGNITIVE") return "IQ_COGNITIVE";
  if (normalized === "DISC" || normalized === "RIASEC" || normalized === "EQ") return normalized;
  return null;
}

export function questionContractForGroup(group: QuestionGroup) {
  switch (group) {
    case "RIASEC":
      return { answerType: "LIKERT_5", type: "PREFERENCE", scale: [1, 2, 3, 4, 5] as const };
    case "DISC":
      return { answerType: "SINGLE_CHOICE_4", type: "SCENARIO", scale: [1, 2, 3, 4] as const };
    case "EQ":
      return { answerType: "SINGLE_CHOICE_4", type: "SCENARIO", scale: [1, 2, 3, 4] as const };
    case "IQ_COGNITIVE":
      return { answerType: "SINGLE_CHOICE_4", type: "SINGLE_CHOICE", scale: [1, 2, 3, 4] as const };
  }
}
