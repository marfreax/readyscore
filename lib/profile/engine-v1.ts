import { cognitiveProfileAdapter } from "./adapters/cognitive";
import { discProfileAdapter } from "./adapters/disc";
import { eqProfileAdapter } from "./adapters/eq";
import { riasecProfileAdapter } from "./adapters/riasec";
import {
  CROSS_TEST_PROFILE_CONTRACT_VERSION,
  CROSS_TEST_PROFILE_ENGINE_VERSION,
  type CrossTestProfile,
  type CrossTestProfileInput,
  type ProfileDomain,
  type ProfileSignalAdapter,
  type ProfileConfidence,
} from "./types";

export const PROFILE_DOMAINS: readonly ProfileDomain[] = [
  "ABILITY",
  "EMOTIONAL",
  "RESILIENCE",
  "BEHAVIOR",
  "INTEREST",
  "STRENGTH",
  "LEARNING",
];

const ADAPTERS: ProfileSignalAdapter[] = [
  cognitiveProfileAdapter,
  discProfileAdapter,
  eqProfileAdapter,
  riasecProfileAdapter,
];
const REGISTRY = new Map(ADAPTERS.map((adapter) => [adapter.testType.toUpperCase(), adapter]));

export class CrossTestProfileConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CrossTestProfileConfigurationError";
  }
}

export function registerProfileAdapter(adapter: ProfileSignalAdapter): void {
  const key = adapter.testType.trim().toUpperCase();
  if (!key) throw new CrossTestProfileConfigurationError("Profile adapter testType cannot be empty.");
  if (REGISTRY.has(key)) throw new CrossTestProfileConfigurationError(`Profile adapter already registered for test type "${adapter.testType}".`);
  REGISTRY.set(key, adapter);
}

export function listProfileAdapters(): string[] {
  return [...REGISTRY.keys()].sort();
}

function confidenceRank(value: ProfileConfidence): number {
  return value === "HIGH" ? 3 : value === "MODERATE" ? 2 : 1;
}

function combineConfidence(values: ProfileConfidence[]): ProfileConfidence {
  if (values.length === 0) return "LIMITED";
  const average = values.reduce((sum, value) => sum + confidenceRank(value), 0) / values.length;
  if (average >= 2.7) return "HIGH";
  if (average >= 1.8) return "MODERATE";
  return "LIMITED";
}

function profileStatus(availableDomains: number, totalDomains: number): CrossTestProfile["status"] {
  if (availableDomains === 0) return "INSUFFICIENT";
  if (availableDomains === totalDomains) return "COMPLETE";
  return "PARTIAL";
}

function stableProfileId(inputs: CrossTestProfileInput[]): string {
  const identity = inputs
    .map((input) => `${input.result.assessmentType}:${input.result.attemptId}`)
    .sort()
    .join("|");
  return `ctp-${identity || "empty"}`;
}

export function buildCrossTestProfile(
  inputs: CrossTestProfileInput[],
  generatedAt = new Date().toISOString(),
): CrossTestProfile {
  if (!Array.isArray(inputs)) throw new CrossTestProfileConfigurationError("Cross-Test Profile inputs must be an array.");

  const domains = new Map<ProfileDomain, CrossTestProfile["domains"][number]>(
    PROFILE_DOMAINS.map((domain) => [domain, { domain, status: "NOT_AVAILABLE", signalCount: 0, signals: [] }]),
  );
  const sources: CrossTestProfile["sources"] = [];
  const limitations: string[] = [];

  for (const input of inputs) {
    const key = input.result.assessmentType.trim().toUpperCase();
    const adapter = REGISTRY.get(key);
    if (!adapter) {
      sources.push({
        testType: input.result.assessmentType,
        attemptId: input.result.attemptId,
        status: "INSUFFICIENT",
        confidence: "LIMITED",
        resultContractVersion: input.result.interpretation?.contractVersion,
        scoringVersion: input.result.scoringVersion,
        interpretationVersion: input.result.interpretation?.interpretationVersion,
        includedSignalCount: 0,
        excludedSignalCount: 0,
        exclusionReasons: [`No Cross-Test Profile adapter is registered for ${input.result.assessmentType}.`],
      });
      limitations.push(`${input.result.assessmentType} result was not included because no synthesis adapter is registered.`);
      continue;
    }

    const extracted = adapter.extract(input);
    for (const signal of extracted.signals) {
      const bucket = domains.get(signal.domain);
      if (!bucket) continue;
      bucket.signals.push(signal);
      bucket.signalCount += 1;
      bucket.status = bucket.signals.some((item) => item.status === "AVAILABLE") ? "AVAILABLE" : "PARTIAL";
    }
    sources.push({ ...extracted.source, includedSignalCount: extracted.signals.length });
    limitations.push(...extracted.source.exclusionReasons);
  }

  const domainList = PROFILE_DOMAINS.map((domain) => domains.get(domain)!);
  const availableDomains = domainList.filter((domain) => domain.status === "AVAILABLE").length;
  const confidence = combineConfidence(sources.map((source) => source.confidence));
  const observedPatterns: string[] = [];

  const availableDomainNames = domainList.filter((domain) => domain.status === "AVAILABLE").map((domain) => domain.domain);
  if (availableDomainNames.length) {
    observedPatterns.push(`Evidence is available across ${availableDomainNames.length} profile domains: ${availableDomainNames.join(", ")}.`);
  }
  if (availableDomains === 1) {
    const limitation = "Current cross-test evidence is limited to one profile domain; no cross-test conclusion is generated.";
    observedPatterns.push(limitation);
    limitations.push(limitation);
  }

  const interest = domains.get("INTEREST")!;
  const availableInterest = interest.signals.filter((signal) => signal.score !== null).sort((a, b) => (b.score ?? -1) - (a.score ?? -1));
  if (availableInterest.length >= 2) {
    observedPatterns.push(`Interest evidence is available across ${availableInterest.length} RIASEC dimensions; the relative pattern is preserved without collapsing it into a universal score.`);
  }

  return {
    contractVersion: CROSS_TEST_PROFILE_CONTRACT_VERSION,
    engineVersion: CROSS_TEST_PROFILE_ENGINE_VERSION,
    profileId: stableProfileId(inputs),
    generatedAt,
    status: profileStatus(availableDomains, PROFILE_DOMAINS.length),
    confidence,
    completeness: {
      availableDomains,
      totalDomains: PROFILE_DOMAINS.length,
      percentage: Math.round((availableDomains / PROFILE_DOMAINS.length) * 100),
    },
    domains: domainList,
    sources,
    synthesis: {
      dominantEvidenceDomains: domainList
        .filter((domain) => domain.status === "AVAILABLE")
        .sort((a, b) => b.signalCount - a.signalCount)
        .map((domain) => domain.domain),
      observedPatterns,
      limitations: [...new Set(limitations)],
    },
    claims: {
      allowed: [
        "cross-test profile as a synthesis of available assessment evidence",
        "evidence-weighted profile observations when the relevant instruments are available",
        "relative patterns within each test-specific measurement domain",
      ],
      restricted: [
        "major or career suitability claims without Phase 3.8/3.9 engines",
        "readiness claims without a defined readiness construct",
        "comparisons between incompatible score scales",
      ],
      prohibited: [
        "universal overall intelligence/personality/suitability score",
        "raw averaging of unrelated test scores",
        "guaranteed study, major, or career outcomes",
      ],
    },
  };
}
