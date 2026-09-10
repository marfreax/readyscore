export const V15_INTERPRETATION_VERSION = "V15_INTERPRETATION_V1" as const;
export const V15_MAJOR_KB_VERSION = "MAJOR_KB_V1" as const;
export const V15_MAJOR_MATCHING_VERSION = "V15_MAJOR_MATCHING_V1" as const;
export const V15_ACTION_PLAN_VERSION = "V15_ACTION_PLAN_V1" as const;
export const V15_REPORT_TEMPLATE_VERSION = "V15_REPORT_TEMPLATE_V9" as const;
export const V15_REPORT_CONTRACT_VERSION = "V15_REPORT_V1" as const;
export const V15_REPORT_PRESENTATION_VERSION = "V15_REPORT_PRESENTATION_V2" as const;

import type { CrossTestProfile, ProfileSignal } from "../profile/types";

export type IntegratedProfile = {
  contractVersion: typeof V15_INTERPRETATION_VERSION;
  profileId: string;
  status: "COMPLETE" | "PARTIAL" | "INSUFFICIENT";
  summary: string;
  dimensions: Array<{
    key: "INTEREST" | "BEHAVIOR" | "EMOTIONAL" | "ABILITY";
    title: string;
    summary: string;
    strongest: { dimension: string; label: string; score: number | null } | null;
    developing: { dimension: string; label: string; score: number | null } | null;
    supportingSignalIds: string[];
  }>;
  strengths: string[];
  developmentAreas: string[];
  learningEnvironment: string[];
  parentGuidance: string[];
  evidenceTrail: string[];
};

export type MajorKnowledgeEntry = {
  id: string;
  name: string;
  category: string;
  description: string;
  studyAreas: string[];
  riaSecAffinity: Partial<Record<string, number>>;
  discAffinity: Partial<Record<string, number>>;
  cognitiveAffinity: Partial<Record<string, number>>;
  eqConsiderations: Partial<Record<string, number>>;
  relatedCareers: string[];
  explanationTemplates: { positive: string[]; caution: string[] };
  cautionSignals: string[];
  explorationActions: string[];
};

export type MajorRecommendation = {
  major: { id: string; name: string; category: string; description: string };
  rank: number;
  matchSignal: string;
  whyItFits: string;
  supportingSignals: Array<{ signalId: string; label: string; sourceTestType: string; score: number | null }>;
  cautionSignals: string[];
  relatedCareers: string[];
  explorationActions: string[];
  score: number;
  evidenceCoverage: number;
};

export type ActionPlan = {
  contractVersion: typeof V15_ACTION_PLAN_VERSION;
  weeks: Array<{ week: number; title: string; objective: string; actions: string[]; parentActions: string[]; linkedMajors: string[] }>;
  successSignals: string[];
  guardrails: string[];
};

export type ReportBlock =
  | { type: "lead"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "metric"; label: string; value: string; note?: string }
  | { type: "callout"; label: string; text: string }
  | { type: "list"; label?: string; items: string[] }
  | { type: "recommendation"; rank: number; title: string; fit: string; description: string; signals: string[]; validation: string[]; careers: string[]; actions: string[] }
  | { type: "week"; week: number; title: string; objective: string; actions: string[]; parentActions: string[]; linkedMajors: string[] }
  | { type: "spacer"; size: "sm" | "md" | "lg" };

export type ReportPage = {
  pageNumber: number;
  section: string;
  title: string;
  body: string[];
  blocks: ReportBlock[];
  personalized: boolean;
};

export type V15ReportDocument = {
  contractVersion: typeof V15_REPORT_CONTRACT_VERSION;
  presentationVersion: typeof V15_REPORT_PRESENTATION_VERSION;
  resultVersion: string[];
  interpretationVersion: typeof V15_INTERPRETATION_VERSION;
  majorKnowledgeVersion: typeof V15_MAJOR_KB_VERSION;
  majorMatchingVersion: typeof V15_MAJOR_MATCHING_VERSION;
  actionPlanVersion: typeof V15_ACTION_PLAN_VERSION;
  templateVersion: typeof V15_REPORT_TEMPLATE_VERSION;
  generatedAt: string;
  profile: IntegratedProfile;
  recommendations: MajorRecommendation[];
  actionPlan: ActionPlan;
  pages: ReportPage[];
  pageCount: number;
  status: "READY" | "QUALIFICATION_REQUIRED";
  qualification?: { reason: string; availableEvidence: string[] };
};

export type V15ProfileContext = { profile: CrossTestProfile; signals: ProfileSignal[] };
