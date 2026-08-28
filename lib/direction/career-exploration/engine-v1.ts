import {
  CAREER_EXPLORATION_CONTRACT_VERSION,
  CAREER_EXPLORATION_ENGINE_VERSION,
  type CareerExplorationEvidence,
  type CareerExplorationInput,
  type CareerExplorationResult,
  type CareerProfile,
} from "./types";

export class CareerExplorationConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CareerExplorationConfigurationError";
  }
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function evidenceStatus(available: number, total: number): CareerExplorationResult["evidenceStatus"] {
  if (total === 0 || available === 0) return "INSUFFICIENT";
  if (available === total) return "AVAILABLE";
  return "PARTIAL";
}

function statusFor(available: number, required: number): CareerExplorationResult["status"] {
  if (required === 0 || available === 0) return "LIMITED_EVIDENCE";
  if (available === required) return "STRONG_EXPLORATION";
  if (available >= Math.ceil(required / 2)) return "POTENTIAL_EXPLORATION";
  return "WORTH_EXPLORING";
}

export function buildCareerExploration(
  input: CareerExplorationInput,
  career: CareerProfile,
): CareerExplorationResult {
  if (!input?.profile?.profileId) throw new CareerExplorationConfigurationError("Cross-Test Profile is required.");
  if (!input.profile.contractVersion) throw new CareerExplorationConfigurationError("Cross-Test Profile contract version is required.");
  if (!input.direction?.directionId) throw new CareerExplorationConfigurationError("Study Direction must have a directionId.");
  if (!input.majorFit?.majorId) throw new CareerExplorationConfigurationError("Major Fit must have a majorId.");
  if (!career?.careerId) throw new CareerExplorationConfigurationError("Career profile must have a careerId.");
  if (!career.version) throw new CareerExplorationConfigurationError("Career profile version is required.");
  if (!Array.isArray(career.requirements)) throw new CareerExplorationConfigurationError("Career profile requirements must be an array.");

  const signalMap = new Map(input.profile.signals.map((signal) => [signal.signalId, signal]));
  const directionAreas = new Set(input.direction.studyAreas);
  const evidence: CareerExplorationEvidence[] = career.requirements.map((requirement) => {
    const accepted = requirement.acceptedSignalIds?.length
      ? requirement.acceptedSignalIds
      : input.profile.signals.map((signal) => signal.signalId);

    const supporting = unique(accepted.filter((id) => signalMap.get(id)?.status === "AVAILABLE"));
    const partial = unique(accepted.filter((id) => signalMap.get(id)?.status === "PARTIAL"));
    const sourceTestTypes = unique(
      [...supporting, ...partial].map((id) => signalMap.get(id)?.sourceTestType ?? ""),
    );
    const status: CareerExplorationEvidence["status"] =
      supporting.length > 0 ? "AVAILABLE" : partial.length > 0 ? "PARTIAL" : "INSUFFICIENT";

    return {
      requirementId: requirement.requirementId,
      requirementLabel: requirement.label,
      status,
      supportingSignalIds: supporting,
      sourceTestTypes,
      rationale:
        status === "AVAILABLE"
          ? `Evidence from ${sourceTestTypes.join(", ")} is relevant to this career exploration requirement.`
          : status === "PARTIAL"
            ? "Some relevant evidence exists, but it is incomplete for this exploration requirement."
            : "No eligible evidence is currently available for this exploration requirement.",
    };
  });

  const required = career.requirements.filter((requirement) => requirement.required !== false).length;
  const matched = evidence.filter(
    (item) =>
      item.status === "AVAILABLE" &&
      career.requirements.find((requirement) => requirement.requirementId === item.requirementId)?.required !== false,
  ).length;

  const alignedStudyAreas = unique(career.studyAreas.filter((area) => directionAreas.has(area)));
  const alignedMajors = input.majorFit.majorId && (career.majorIds ?? []).includes(input.majorFit.majorId)
    ? [input.majorFit.majorId]
    : [];

  const supportingEvidence = evidence
    .filter((item) => item.status === "AVAILABLE")
    .map((item) => item.requirementLabel);

  const areasToStrengthen = evidence
    .filter((item) => item.status !== "AVAILABLE")
    .map((item) => item.requirementLabel);

  const explorationNotes: string[] = [];
  if (alignedStudyAreas.length > 0) {
    explorationNotes.push(`Career family is connected to the supplied Study Direction: ${input.direction.label}.`);
  }
  if (alignedMajors.length > 0) {
    explorationNotes.push("The selected career profile explicitly includes the supplied Major profile.");
  }
  if (input.majorFit.status === "LIMITED_EVIDENCE") {
    explorationNotes.push("Major Fit evidence is limited; career exploration should remain exploratory.");
  }

  const limitations: string[] = [];
  if (input.profile.status === "INSUFFICIENT") {
    limitations.push("Cross-Test Profile evidence is insufficient; career exploration cannot be established.");
  }
  if (alignedStudyAreas.length === 0) {
    limitations.push("The career is not explicitly aligned to the supplied Study Direction study areas.");
  }
  if (alignedMajors.length === 0) {
    limitations.push("The career profile does not explicitly include the supplied Major profile.");
  }
  if (required < career.requirements.length) {
    limitations.push("Optional career requirements are not used to inflate the required-evidence denominator.");
  }
  limitations.push("Career exploration expresses evidence-based exploration opportunities; it is not a deterministic career assignment or outcome prediction.");

  const completeness = required === 0 ? 0 : Math.round((matched / required) * 100);

  return {
    contractVersion: CAREER_EXPLORATION_CONTRACT_VERSION,
    engineVersion: CAREER_EXPLORATION_ENGINE_VERSION,
    careerId: career.careerId,
    careerProfileVersion: career.version,
    studyDirectionId: input.direction.directionId,
    studyDirectionContractVersion: input.direction.contractVersion,
    majorId: input.majorFit.majorId,
    majorFitContractVersion: input.majorFit.contractVersion,
    status: statusFor(matched, required),
    evidenceStatus: evidenceStatus(matched, required),
    evidence,
    matchedRequirementCount: matched,
    requiredRequirementCount: required,
    completeness: { percentage: completeness },
    exploration: {
      careerFamily: career.family,
      alignedStudyAreas,
      alignedMajors,
      supportingEvidence,
      areasToStrengthen,
      explorationNotes,
      limitations: unique(limitations),
    },
    claims: {
      allowed: [
        "career exploration based on Cross-Test Profile, Study Direction, Major Fit, and a defined career profile",
        "career families and roles worth exploring when relevant evidence is available",
        "areas to strengthen and evidence gaps that may inform further exploration",
      ],
      restricted: [
        "career comparisons without a defined common career-profile model",
        "career exploration when required evidence is insufficient",
        "claims extending beyond the supplied profile, Study Direction, Major Fit, and career profile",
      ],
      prohibited: [
        "deterministic career assignment",
        "guaranteed employment",
        "guaranteed career success",
        "guaranteed income or promotion",
        "probability of career success presented as a measurement",
        "one-test-only deterministic career recommendation",
        "raw averaging of heterogeneous assessment scores",
      ],
    },
  };
}
