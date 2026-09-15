import type { AssessmentType } from "../assessment-config";
import type { AssessmentResult, Question, Answer } from "./types";
import { getScoringEngine } from "./scoring/engine-v2";
import type { ScoringContext, ScoringModelIdentity } from "./scoring/types";
import { validateAssessmentRuntimeAnswers, validateAssessmentRuntimeQuestions, type AssessmentRuntimeContract, getAssessmentRuntimeContract } from "./runtime-contract";

/**
 * V8.7 unified orchestration contract.
 *
 * This layer standardizes runtime dispatch and provenance validation while
 * deliberately delegating measurement semantics to the assessment-specific
 * scoring engines. It is NOT a universal scoring model.
 */
export type UnifiedAssessmentAdapter = {
  readonly assessmentType: AssessmentType;
  readonly responseModel: "LIKERT_5" | "SINGLE_CHOICE_4" | "FORCED_CHOICE_4";
  readonly questionCount: number;
  readonly scoringEngine: ScoringModelIdentity;
  readonly runtimeContract: AssessmentRuntimeContract;
  readonly score: (context: ScoringContext) => AssessmentResult;
};

const RESPONSE_MODELS: Record<AssessmentType, UnifiedAssessmentAdapter["responseModel"]> = {
  free: "LIKERT_5",
  premium: "LIKERT_5",
  cognitive: "SINGLE_CHOICE_4",
  eq: "SINGLE_CHOICE_4",
  disc: "FORCED_CHOICE_4",
  riasec: "LIKERT_5",
};

const QUESTION_COUNTS: Record<AssessmentType, number> = {
  free: 10,
  premium: 100,
  cognitive: 40,
  eq: 50,
  disc: 80,
  riasec: 60,
};

function assertRuntimeContract(context: ScoringContext, adapter: UnifiedAssessmentAdapter): void {
  if (context.assessmentType !== adapter.assessmentType) {
    throw new Error(
      `Unified assessment type mismatch: context=${context.assessmentType}, adapter=${adapter.assessmentType}`,
    );
  }
  if (context.questions.length !== adapter.questionCount) {
    throw new Error(
      `${adapter.assessmentType} requires exactly ${adapter.questionCount} questions; received ${context.questions.length}.`,
    );
  }
  if (context.metadata.scoringVersion !== adapter.scoringEngine.version) {
    throw new Error(
      `${adapter.assessmentType} scoring version mismatch: configured=${context.metadata.scoringVersion}, engine=${adapter.scoringEngine.version}`,
    );
  }
}

function buildAdapter(assessmentType: AssessmentType): UnifiedAssessmentAdapter {
  const engine = getScoringEngine(assessmentType);
  const adapter: UnifiedAssessmentAdapter = {
    assessmentType,
    responseModel: RESPONSE_MODELS[assessmentType],
    questionCount: QUESTION_COUNTS[assessmentType],
    scoringEngine: { ...engine.identity },
    runtimeContract: getAssessmentRuntimeContract(assessmentType),
    score(context) {
      assertRuntimeContract(context, adapter);
      validateAssessmentRuntimeQuestions(assessmentType, context.questions);
      if (context.metadata.completionMode !== "TIMEOUT") {
        validateAssessmentRuntimeAnswers(assessmentType, context.questions, context.answers);
      }
      return engine.score(context);
    },
  };
  return adapter;
}

const ADAPTERS: ReadonlyMap<AssessmentType, UnifiedAssessmentAdapter> = new Map(
  (["free", "premium", "cognitive", "eq", "disc", "riasec"] as AssessmentType[]).map((type) => [
    type,
    buildAdapter(type),
  ]),
);

export function getUnifiedAssessmentAdapter(assessmentType: AssessmentType): UnifiedAssessmentAdapter {
  const adapter = ADAPTERS.get(assessmentType);
  if (!adapter) throw new Error(`No unified assessment adapter registered for "${assessmentType}".`);
  return adapter;
}

export function calculateUnifiedAssessmentResult(
  assessmentType: AssessmentType,
  questions: Question[],
  answers: Answer[],
  metadata: ScoringContext["metadata"],
): AssessmentResult {
  const adapter = getUnifiedAssessmentAdapter(assessmentType);
  return adapter.score({ assessmentType, questions, answers, metadata });
}

export function listUnifiedAssessmentAdapters(): Array<{
  assessmentType: AssessmentType;
  responseModel: UnifiedAssessmentAdapter["responseModel"];
  questionCount: number;
  scoringEngine: ScoringModelIdentity;
  runtimeContract: AssessmentRuntimeContract;
}> {
  return Array.from(ADAPTERS.values()).map((adapter) => ({
    assessmentType: adapter.assessmentType,
    responseModel: adapter.responseModel,
    questionCount: adapter.questionCount,
    scoringEngine: { ...adapter.scoringEngine },
    runtimeContract: { ...adapter.runtimeContract, scale: [...adapter.runtimeContract.scale] },
  }));
}
