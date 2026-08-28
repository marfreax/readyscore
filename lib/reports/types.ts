export const REPORT_CONTRACT_VERSION = "REPORT_V1" as const;
export const REPORT_ENGINE_VERSION = "REPORT_ENGINE_V1" as const;

export type ReportStatus = "AVAILABLE" | "LIMITED";

export type ReportAssessment = {
  attemptId: string;
  assessmentType: string;
  status: string;
  completedAt: string | null;
  resultAvailable: boolean;
  resultContractVersion?: string;
  scoringVersion?: string;
};

export type ReportSummary = {
  contractVersion: typeof REPORT_CONTRACT_VERSION;
  engineVersion: typeof REPORT_ENGINE_VERSION;
  reportId: string;
  generatedAt: string;
  ownerUserId: string;
  status: ReportStatus;
  assessmentCount: number;
  completedAssessmentCount: number;
  assessments: ReportAssessment[];
  parentView: {
    title: string;
    purpose: string;
    audience: "PARENT";
    guidance: string[];
  };
  claims: {
    allowed: string[];
    restricted: string[];
    prohibited: string[];
  };
};
