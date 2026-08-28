import {
  MAJOR_FIT_CONTRACT_VERSION,
  MAJOR_FIT_ENGINE_VERSION,
  type MajorFitEvidence,
  type MajorFitEvidenceStatus,
  type MajorFitResult,
  type MajorProfile,
  type StudyDirectionInput,
} from "./types";
import type { ProfileSignal } from "../../profile/types";

export class MajorFitConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MajorFitConfigurationError";
  }
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function evidenceStatus(available: number, total: number): MajorFitResult["evidenceStatus"] {
  if (total === 0 || available === 0) return "INSUFFICIENT";
  if (available === total) return "AVAILABLE";
  return "PARTIAL";
}

function statusFor(available: number, required: number): MajorFitResult["status"] {
  if (required === 0 || available === 0) return "LIMITED_EVIDENCE";
  if (available === required) return "STRONG_FIT";
  if (available >= Math.ceil(required / 2)) return "POTENTIAL_FIT";
  return "WORTH_EXPLORING";
}

export function buildMajorFit(
  direction: StudyDirectionInput,
  major: MajorProfile,
  signals: ProfileSignal[],
): MajorFitResult {
  if (!direction?.directionId) throw new MajorFitConfigurationError("Study Direction must have a directionId.");
  if (!major?.majorId) throw new MajorFitConfigurationError("Major profile must have a majorId.");
  if (!major.version) throw new MajorFitConfigurationError("Major profile version is required.");
  if (!Array.isArray(major.requirements)) throw new MajorFitConfigurationError("Major profile requirements must be an array.");

  const signalMap = new Map(signals.map((signal) => [signal.signalId, signal]));
  const directionSignals = new Set(direction.evidenceSignalIds);
  const evidence: MajorFitEvidence[] = major.requirements.map((requirement) => {
    const accepted = requirement.acceptedSignalIds?.length
      ? requirement.acceptedSignalIds
      : [...directionSignals];
    const supporting = unique(accepted.filter((id) => {
      const signal = signalMap.get(id);
      return !!signal && signal.status === "AVAILABLE";
    }));
    const partial = accepted.filter((id) => signalMap.get(id)?.status === "PARTIAL");
    const sourceTestTypes = unique(
      [...supporting, ...partial].map((id) => signalMap.get(id)?.sourceTestType ?? ""),
    );
    const status: MajorFitEvidenceStatus = supporting.length > 0 ? "AVAILABLE" : partial.length > 0 ? "PARTIAL" : "INSUFFICIENT";
    return {
      requirementId: requirement.requirementId,
      requirementLabel: requirement.label,
      status,
      supportingSignalIds: supporting,
      sourceTestTypes,
      rationale:
        status === "AVAILABLE"
          ? `Evidence from ${sourceTestTypes.join(", ")} corresponds to this major requirement.`
          : status === "PARTIAL"
            ? "Some relevant evidence exists, but it is incomplete for this requirement."
            : "No eligible evidence is currently available for this requirement.",
    };
  });

  const required = major.requirements.filter((r) => r.required !== false).length;
  const matched = evidence.filter((item) => item.status === "AVAILABLE" && major.requirements.find((r) => r.requirementId === item.requirementId)?.required !== false).length;
  const alignedStudyAreas = unique(direction.studyAreas.filter((area) => major.studyAreas.includes(area)));
  const areasToStrengthen = evidence.filter((item) => item.status !== "AVAILABLE").map((item) => item.requirementLabel);
  const supportingEvidence = evidence.filter((item) => item.status === "AVAILABLE").map((item) => item.requirementLabel);
  const limitations: string[] = [];
  if (signals.length === 0) limitations.push("No cross-test evidence was supplied; major fit cannot be established.");
  if (alignedStudyAreas.length === 0) limitations.push("The major is not explicitly aligned to the supplied Study Direction study areas.");
  if (required < major.requirements.length) limitations.push("Optional major requirements are not used to inflate the required-evidence denominator.");
  limitations.push("Major fit expresses correspondence to the defined major profile; it is not a guarantee of academic success or outcome.");

  const completeness = required === 0 ? 0 : Math.round((matched / required) * 100);
  return {
    contractVersion: MAJOR_FIT_CONTRACT_VERSION,
    engineVersion: MAJOR_FIT_ENGINE_VERSION,
    majorId: major.majorId,
    majorProfileVersion: major.version,
    studyDirectionId: direction.directionId,
    studyDirectionContractVersion: direction.contractVersion,
    status: statusFor(matched, required),
    evidenceStatus: evidenceStatus(matched, required),
    evidence,
    matchedRequirementCount: matched,
    requiredRequirementCount: required,
    completeness: { percentage: completeness },
    synthesis: { alignedStudyAreas, supportingEvidence, areasToStrengthen, limitations: unique(limitations) },
    claims: {
      allowed: [
        "major fit as correspondence between Study Direction, relevant evidence, and a defined major profile",
        "potential fit and areas to strengthen when evidence is partial",
        "major exploration based on explicit evidence requirements",
      ],
      restricted: [
        "comparisons between majors without a defined common major-profile model",
        "fit interpretation when required evidence is insufficient",
        "claims that extend beyond the supplied Study Direction and major profile",
      ],
      prohibited: [
        "guaranteed academic success",
        "guaranteed graduation or employment",
        "deterministic major assignment",
        "raw averaging of heterogeneous assessment scores",
        "one-test-only deterministic major recommendation",
      ],
    },
  };
}
