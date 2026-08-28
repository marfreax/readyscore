export const CAREER_EXPLORATION_CONTRACT_VERSION = "CAREER_EXPLORATION_V1" as const;
export const CAREER_EXPLORATION_ENGINE_VERSION = "CAREER_EXPLORATION_ENGINE_V1" as const;

export type CareerExplorationStatus =
  | "STRONG_EXPLORATION"
  | "POTENTIAL_EXPLORATION"
  | "WORTH_EXPLORING"
  | "LIMITED_EVIDENCE";

export type CareerEvidenceStatus = "AVAILABLE" | "PARTIAL" | "INSUFFICIENT";

export type CareerProfileRequirement = {
  requirementId: string;
  label: string;
  domain: string;
  dimension?: string;
  required?: boolean;
  acceptedSignalIds?: string[];
};

export type CareerProfile = {
  careerId: string;
  careerCode?: string;
  name: string;
  family: string;
  studyAreas: string[];
  majorIds?: string[];
  requirements: CareerProfileRequirement[];
  version: string;
  description?: string;
};

export type CareerExplorationEvidence = {
  requirementId: string;
  requirementLabel: string;
  status: CareerEvidenceStatus;
  supportingSignalIds: string[];
  sourceTestTypes: string[];
  rationale: string;
};

export type CareerExplorationResult = {
  contractVersion: typeof CAREER_EXPLORATION_CONTRACT_VERSION;
  engineVersion: typeof CAREER_EXPLORATION_ENGINE_VERSION;
  careerId: string;
  careerProfileVersion: string;
  studyDirectionId: string;
  studyDirectionContractVersion: string;
  majorId: string;
  majorFitContractVersion: string;
  status: CareerExplorationStatus;
  evidenceStatus: CareerEvidenceStatus;
  evidence: CareerExplorationEvidence[];
  matchedRequirementCount: number;
  requiredRequirementCount: number;
  completeness: { percentage: number };
  exploration: {
    careerFamily: string;
    alignedStudyAreas: string[];
    alignedMajors: string[];
    supportingEvidence: string[];
    areasToStrengthen: string[];
    explorationNotes: string[];
    limitations: string[];
  };
  claims: {
    allowed: string[];
    restricted: string[];
    prohibited: string[];
  };
};

export type CareerExplorationInput = {
  profile: {
    profileId: string;
    contractVersion: string;
    status: string;
    signals: ProfileSignalLike[];
  };
  direction: {
    contractVersion: string;
    directionId: string;
    label: string;
    studyAreas: string[];
  };
  majorFit: {
    contractVersion: string;
    majorId: string;
    status: string;
  };
};

export type ProfileSignalLike = {
  signalId: string;
  domain: string;
  dimension: string;
  label: string;
  status: CareerEvidenceStatus;
  sourceTestType: string;
};
