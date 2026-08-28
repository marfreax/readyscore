export const MAJOR_FIT_CONTRACT_VERSION = "MAJOR_FIT_V1" as const;
export const MAJOR_FIT_ENGINE_VERSION = "MAJOR_FIT_ENGINE_V1" as const;

export type MajorFitStatus = "STRONG_FIT" | "POTENTIAL_FIT" | "WORTH_EXPLORING" | "LIMITED_EVIDENCE";
export type MajorFitEvidenceStatus = "AVAILABLE" | "PARTIAL" | "INSUFFICIENT";

export type StudyDirectionInput = {
  contractVersion: string;
  directionId: string;
  label: string;
  studyAreas: string[];
  evidenceSignalIds: string[];
  status?: string;
};

export type MajorProfileRequirement = {
  requirementId: string;
  label: string;
  domain: string;
  construct?: string;
  dimension?: string;
  weight?: number;
  required?: boolean;
  acceptedSignalIds?: string[];
};

export type MajorProfile = {
  majorId: string;
  majorCode?: string;
  name: string;
  studyAreas: string[];
  requirements: MajorProfileRequirement[];
  version: string;
};

export type MajorFitEvidence = {
  requirementId: string;
  requirementLabel: string;
  status: MajorFitEvidenceStatus;
  supportingSignalIds: string[];
  sourceTestTypes: string[];
  rationale: string;
};

export type MajorFitResult = {
  contractVersion: typeof MAJOR_FIT_CONTRACT_VERSION;
  engineVersion: typeof MAJOR_FIT_ENGINE_VERSION;
  majorId: string;
  majorProfileVersion: string;
  studyDirectionId: string;
  studyDirectionContractVersion: string;
  status: MajorFitStatus;
  evidenceStatus: MajorFitEvidenceStatus;
  evidence: MajorFitEvidence[];
  matchedRequirementCount: number;
  requiredRequirementCount: number;
  completeness: {
    percentage: number;
  };
  synthesis: {
    alignedStudyAreas: string[];
    supportingEvidence: string[];
    areasToStrengthen: string[];
    limitations: string[];
  };
  claims: {
    allowed: string[];
    restricted: string[];
    prohibited: string[];
  };
};
