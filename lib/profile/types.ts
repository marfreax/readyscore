export const CROSS_TEST_PROFILE_CONTRACT_VERSION = "CROSS_TEST_PROFILE_V1" as const;
export const CROSS_TEST_PROFILE_ENGINE_VERSION = "CROSS_TEST_PROFILE_ENGINE_V1" as const;

export type ProfileEvidenceStatus = "AVAILABLE" | "PARTIAL" | "INSUFFICIENT";
export type ProfileConfidence = "HIGH" | "MODERATE" | "LIMITED";
export type ProfileDomain =
  | "ABILITY"
  | "EMOTIONAL"
  | "RESILIENCE"
  | "BEHAVIOR"
  | "INTEREST"
  | "STRENGTH"
  | "LEARNING";

export type ProfileSignal = {
  signalId: string;
  domain: ProfileDomain;
  construct: string;
  dimension: string;
  label: string;
  score: number | null;
  scoreScale: "PRESENTATION_0_100" | "CATEGORICAL" | "VECTOR" | "UNKNOWN";
  scoreSemantics: "ABILITY" | "TRAIT" | "INTEREST" | "PREFERENCE" | "PROFILE" | "READINESS";
  status: ProfileEvidenceStatus;
  confidence: ProfileConfidence;
  sourceTestType: string;
  sourceResultAttemptId: string;
  sourceResultContractVersion?: string;
  sourceScoringVersion?: string;
  sourceInterpretationVersion?: string;
};

export type ProfileSource = {
  testType: string;
  attemptId: string;
  status: ProfileEvidenceStatus;
  confidence: ProfileConfidence;
  resultContractVersion?: string;
  scoringVersion?: string;
  interpretationVersion?: string;
  includedSignalCount: number;
  excludedSignalCount: number;
  exclusionReasons: string[];
};

export type CrossTestProfileDomain = {
  domain: ProfileDomain;
  status: "AVAILABLE" | "PARTIAL" | "NOT_AVAILABLE";
  signalCount: number;
  signals: ProfileSignal[];
};

export type CrossTestProfile = {
  contractVersion: typeof CROSS_TEST_PROFILE_CONTRACT_VERSION;
  engineVersion: typeof CROSS_TEST_PROFILE_ENGINE_VERSION;
  profileId: string;
  generatedAt: string;
  status: "COMPLETE" | "PARTIAL" | "INSUFFICIENT";
  confidence: ProfileConfidence;
  completeness: {
    availableDomains: number;
    totalDomains: number;
    percentage: number;
  };
  domains: CrossTestProfileDomain[];
  sources: ProfileSource[];
  synthesis: {
    dominantEvidenceDomains: ProfileDomain[];
    observedPatterns: string[];
    limitations: string[];
  };
  claims: {
    allowed: string[];
    restricted: string[];
    prohibited: string[];
  };
};

export type CrossTestProfileInput = {
  result: {
    attemptId: string;
    assessmentType: string;
    scoringVersion: string;
    status: string;
    interpretation?: {
      contractVersion: string;
      interpretationVersion: string;
      status: string;
      confidence: ProfileConfidence;
      [key: string]: unknown;
    };
  };
  testSpecific?: unknown;
};

export type ProfileSignalAdapter = {
  readonly testType: string;
  extract(input: CrossTestProfileInput): {
    signals: ProfileSignal[];
    source: Omit<ProfileSource, "includedSignalCount" | "excludedSignalCount"> & {
      excludedSignalCount: number;
      exclusionReasons: string[];
    };
  };
};
