import { calculateResult } from "../scoring-engine";
import { scoreRiasec } from "../riasec/scoring";
import { toAssessmentResult } from "../riasec/result-adapter";
import { createRiasecPersistableResult } from "../riasec/result-contract";
import {
  RIASEC_SCORING_VERSION,
  type RiasecAnswer,
  type RiasecQuestion,
} from "../riasec/types";
import type { AssessmentResult } from "../types";
import { EQ_SCORING_VERSION, EQ_DIMENSIONS, scoreEq, createEqPersistableResult, type EqDimension, type EqQuestion, type EqAnswer } from "../eq/scoring";
import {
  DISC_SCORING_VERSION,
  scoreDisc,
  createDiscPersistableResult,
} from "../disc/scoring";
import {
  COGNITIVE_SCORING_VERSION,
  COGNITIVE_DIMENSIONS,
  scoreCognitive,
  createCognitivePersistableResult,
  type CognitiveDimension,
  type CognitiveQuestion,
  type CognitiveAnswer,
} from "../cognitive/scoring";

import {
  ScoringEngineConfigurationError,
  type ScoringContext,
  type ScoringModelIdentity,
  type TestScoringEngine,
} from "./types";

const RIASEC_DIMENSIONS = new Set(["R", "I", "A", "S", "E", "C"]);

type EqRuntimeQuestion = {
  id: string;
  code: string;
  dimension: EqDimension;
  reverseScore: boolean;
  weight: number;
  answerType: "SINGLE_CHOICE_4";
  options: readonly string[];
  scoringKey: readonly number[];
};

function createRiasecEngine(): TestScoringEngine {
  const identity: ScoringModelIdentity = {
    testType: "RIASEC",
    modelId: "RIASEC_SCORE",
    version: RIASEC_SCORING_VERSION,
  };

  return {
    identity,
    score(context) {
      if (context.metadata.scoringVersion !== identity.version) {
        throw new ScoringEngineConfigurationError(
          `RIASEC scoring version mismatch: configured=${context.metadata.scoringVersion}, engine=${identity.version}`,
        );
      }

      if (context.questions.length !== 60) {
        throw new Error(
          `RIASEC requires exactly 60 questions; received ${context.questions.length}.`,
        );
      }

      const questions: RiasecQuestion[] = context.questions.map((question) => {
        const dimension = String(question.domain ?? "").trim().toUpperCase();
        if (!RIASEC_DIMENSIONS.has(dimension)) {
          throw new Error(
            `RIASEC question ${question.id} has invalid dimension "${question.domain}".`,
          );
        }

        return {
          id: question.id,
          code: question.code,
          dimension: dimension as RiasecQuestion["dimension"],
          reverseScore: Boolean(question.reverseScore),
          weight: Number(question.weight) > 0 ? Number(question.weight) : 1,
        };
      });

      for (const dimension of RIASEC_DIMENSIONS) {
        const count = questions.filter((question) => question.dimension === dimension).length;
        if (count !== 10) {
          throw new Error(
            `RIASEC dimension "${dimension}" requires exactly 10 questions; received ${count}.`,
          );
        }
      }

      const answers: RiasecAnswer[] = context.answers.map((answer) => {
        if (![1, 2, 3, 4, 5].includes(answer.value)) {
          throw new Error(`Invalid RIASEC answer for question ${answer.questionId}.`);
        }
        return { questionId: answer.questionId, value: answer.value as RiasecAnswer["value"] };
      });

      if (answers.length !== questions.length && context.metadata.completionMode !== "TIMEOUT") {
        throw new Error(
          `RIASEC requires ${questions.length} answers; received ${answers.length}.`,
        );
      }

      const measurement = scoreRiasec(questions, answers);
      const genericResult = toAssessmentResult(measurement, {
        attemptId: context.metadata.attemptId,
        assessmentConfigurationVersion:
          context.metadata.assessmentConfigurationVersion,
        questionBankVersion: context.metadata.questionBankVersion,
        taxonomyVersion: context.metadata.taxonomyVersion,
        scoringVersion: context.metadata.scoringVersion,
        completedAt: context.metadata.completedAt,
      });

      const persistedRiasec = createRiasecPersistableResult(measurement, {
        attemptId: context.metadata.attemptId,
        testType: "RIASEC",
        assessmentConfigurationVersion:
          context.metadata.assessmentConfigurationVersion,
        questionBankVersion: context.metadata.questionBankVersion,
        scoringVersion: RIASEC_SCORING_VERSION,
        completedAt: context.metadata.completedAt,
      });

      return {
        ...genericResult,
        riasec: persistedRiasec,
      } as AssessmentResult & { riasec: typeof persistedRiasec };
    },
  };
}


function createDiscEngine(): TestScoringEngine {
  const identity: ScoringModelIdentity = {
    testType: "DISC",
    modelId: "DISC_SCORE",
    version: DISC_SCORING_VERSION,
  };

  return {
    identity,
    score(context) {
      if (context.metadata.scoringVersion !== identity.version) {
        throw new ScoringEngineConfigurationError(
          `DISC scoring version mismatch: configured=${context.metadata.scoringVersion}, engine=${identity.version}`,
        );
      }
      if (context.questions.length !== 24 && context.questions.length !== 80) {
        throw new Error(`DISC V2 supports 24-item legacy and 80-item production forms; received ${context.questions.length}.`);
      }

      const questions = context.questions.map((question) => ({
        id: question.id,
        code: question.code,
        dimension: String(question.domain ?? "").trim().toUpperCase() as "DISC",
        subdomain: question.subdomain,
        reverseScore: Boolean(question.reverseScore),
        weight: Number(question.weight) > 0 ? Number(question.weight) : 1,
        answerType: question.answerType,
        options: question.options,
        scoringKey: question.scoringKey,
      }));

      if (questions.some((question) => question.dimension !== "DISC")) {
        throw new Error("DISC V2 requires domain DISC on every active item.");
      }

      const answers = context.answers.map((answer) => ({
        questionId: answer.questionId,
        value: answer.value as 1 | 2 | 3 | 4,
      }));

      const measurement = scoreDisc(questions, answers);

      const genericResult = {
        attemptId: context.metadata.attemptId,
        assessmentType: "DISC",
        assessmentConfigurationVersion: context.metadata.assessmentConfigurationVersion,
        questionBankVersion: context.metadata.questionBankVersion,
        taxonomyVersion: context.metadata.taxonomyVersion,
        scoringVersion: context.metadata.scoringVersion,

        // Compatibility envelope only. Customer semantics must use the DISC
        // profile below rather than treating this as an overall ability score.
        overallScore: measurement.overallScore,
        score: measurement.overallScore,

        totalQuestions: context.questions.length,
        answeredQuestions: answers.length,
        domainCount: 4,
        measuredDomainCount: 4,
        coverage: context.metadata.completionMode === "TIMEOUT" ? Number(((answers.length / context.questions.length) * 100).toFixed(2)) : 100,
        coveragePercent: context.metadata.completionMode === "TIMEOUT" ? Number(((answers.length / context.questions.length) * 100).toFixed(2)) : 100,
        isComplete: context.metadata.completionMode !== "TIMEOUT",
        minimumCompleteDomains: 4,

        domainScores: measurement.dimensionScores.map((d) => ({
          domainId: d.dimension,
          score: d.score,
          questionCount: d.questionCount,
          weightTotal: d.questionCount,
          scoredSubdomainCount: 0,
          totalSubdomainCount: 0,
          sufficient: true,
        })),
        domains: measurement.dimensionScores.map((d) => ({
          domainId: d.dimension,
          score: d.score,
          questionCount: d.questionCount,
          weightTotal: d.questionCount,
          sufficient: true,
        })),
        subdomainScores: [],
        indicatorScores: [],
        strongestDomains: [measurement.primaryPattern, measurement.secondaryPattern],
        developmentDomains: measurement.dimensionScores
          .filter((d) => d.dimension !== measurement.primaryPattern && d.dimension !== measurement.secondaryPattern)
          .sort((a, b) => a.score - b.score)
          .map((d) => d.dimension),
        quality: {
          scoreableQuestions: answers.length,
          measuredDomains: 4,
          totalDomains: 4,
          coveragePercent: context.metadata.completionMode === "TIMEOUT" ? Number(((answers.length / context.questions.length) * 100).toFixed(2)) : 100,
          complete: context.metadata.completionMode !== "TIMEOUT",
        },
        completedAt: context.metadata.completedAt,
        disc: createDiscPersistableResult(measurement),
      } as unknown as AssessmentResult;

      return genericResult;
    },
  };
}


function createEqEngine(): TestScoringEngine {
  const identity: ScoringModelIdentity = {
    testType: "EQ",
    modelId: "EQ_SCORE",
    version: EQ_SCORING_VERSION,
  };

  return {
    identity,
    score(context) {
      if (context.metadata.scoringVersion !== identity.version) {
        throw new ScoringEngineConfigurationError(
          `EQ scoring version mismatch: configured=${context.metadata.scoringVersion}, engine=${identity.version}`,
        );
      }
      if (context.questions.length !== 24 && context.questions.length !== 50) {
        throw new Error(`EQ supports 24-item legacy and 50-item production forms; received ${context.questions.length}.`);
      }

      const questions: EqRuntimeQuestion[] = context.questions.map((question): EqRuntimeQuestion => {
        const dimension = String(question.domain ?? "").trim().toUpperCase();
        if (!EQ_DIMENSIONS.includes(dimension as EqDimension)) {
          throw new Error(`EQ question ${question.id} has invalid dimension "${question.domain}".`);
        }
        if (question.answerType !== "SINGLE_CHOICE_4" || !Array.isArray(question.options) || question.options.length !== 4) {
          throw new Error(`EQ question ${question.id} must use SINGLE_CHOICE_4 with four options.`);
        }
        if (!Array.isArray(question.scoringKey) || question.scoringKey.length !== 4 ||
            !question.scoringKey.every((value) => Number.isInteger(value) && value >= 1 && value <= 4) ||
            new Set(question.scoringKey).size !== 4) {
          throw new Error(`EQ question ${question.id} requires a valid explicit ordinal scoring key.`);
        }
        return {
          id: question.id,
          code: question.code,
          dimension: dimension as EqDimension,
          reverseScore: false,
          weight: Number(question.weight) > 0 ? Number(question.weight) : 1,
          answerType: "SINGLE_CHOICE_4",
          options: question.options,
          scoringKey: question.scoringKey,
        };
      });

      for (const dimension of EQ_DIMENSIONS) {
        const count = questions.filter((q) => q.dimension === dimension).length;
        const requiredCount = context.questions.length === 50
          ? ({ EMOTION_AWARENESS: 13, EMOTION_REGULATION: 13, EMPATHY_SOCIAL_AWARENESS: 12, RELATIONSHIP_SOCIAL_RESPONSE: 12 } as Record<EqDimension, number>)[dimension as EqDimension]
          : 6;
        if (count !== requiredCount) throw new Error(`EQ dimension "${dimension}" requires exactly ${requiredCount} questions; received ${count}.`);
      }

      const answers: EqAnswer[] = context.answers.map((answer) => {
        if (![1,2,3,4].includes(answer.value)) {
          throw new Error(`Invalid EQ answer for question ${answer.questionId}.`);
        }
        return { questionId: answer.questionId, value: answer.value as 1|2|3|4 };
      });
      if (answers.length !== questions.length && context.metadata.completionMode !== "TIMEOUT") {
        throw new Error(`EQ requires ${questions.length} answers; received ${answers.length}.`);
      }

      const measurement = scoreEq(questions as EqQuestion[], answers);
      const genericResult = {
        attemptId: context.metadata.attemptId,
        assessmentType: "EQ",
        assessmentConfigurationVersion: context.metadata.assessmentConfigurationVersion,
        questionBankVersion: context.metadata.questionBankVersion,
        taxonomyVersion: context.metadata.taxonomyVersion,
        scoringVersion: context.metadata.scoringVersion,
        overallScore: measurement.overallScore,
        score: measurement.overallScore,
        totalQuestions: context.questions.length,
        answeredQuestions: answers.length,
        domainCount: 4,
        measuredDomainCount: 4,
        coverage: context.metadata.completionMode === "TIMEOUT" ? Number(((answers.length / context.questions.length) * 100).toFixed(2)) : 100,
        coveragePercent: context.metadata.completionMode === "TIMEOUT" ? Number(((answers.length / context.questions.length) * 100).toFixed(2)) : 100,
        isComplete: context.metadata.completionMode !== "TIMEOUT",
        minimumCompleteDomains: 4,
        domainScores: measurement.dimensionScores.map((d) => ({
          domainId: d.dimension, score: d.score, questionCount: d.questionCount,
          weightTotal: d.questionCount, scoredSubdomainCount: 0, totalSubdomainCount: 0, sufficient: true,
        })),
        domains: measurement.dimensionScores.map((d) => ({
          domainId: d.dimension, score: d.score, questionCount: d.questionCount, weightTotal: d.questionCount, sufficient: true,
        })),
        subdomainScores: [],
        indicatorScores: [],
        strongestDomains: measurement.dimensionScores.slice().sort((a,b)=>b.score-a.score).slice(0,2).map((d)=>d.dimension),
        developmentDomains: measurement.dimensionScores.slice().sort((a,b)=>a.score-b.score).slice(0,2).map((d)=>d.dimension),
        quality: { scoreableQuestions: answers.length, measuredDomains: 4, totalDomains: 4, coveragePercent: context.metadata.completionMode === "TIMEOUT" ? Number(((answers.length / context.questions.length) * 100).toFixed(2)) : 100, complete: context.metadata.completionMode !== "TIMEOUT" },
        completedAt: context.metadata.completedAt,
        eq: createEqPersistableResult(measurement),
      } as unknown as AssessmentResult;
      return genericResult;
    },
  };
}

function createCognitiveEngine(): TestScoringEngine {
  const identity: ScoringModelIdentity = {
    testType: "COGNITIVE",
    modelId: "COGNITIVE_OBJECTIVE_SCORE",
    version: COGNITIVE_SCORING_VERSION,
  };

  return {
    identity,
    score(context) {
      if (context.metadata.scoringVersion !== identity.version) {
        throw new ScoringEngineConfigurationError(
          `Cognitive scoring version mismatch: configured=${context.metadata.scoringVersion}, engine=${identity.version}`,
        );
      }
      if (context.questions.length !== 24 && context.questions.length !== 40) {
        throw new Error(`Cognitive supports 24-item legacy and 40-item production forms; received ${context.questions.length}.`);
      }
      const questions: CognitiveQuestion[] = context.questions.map((question): CognitiveQuestion => {
        const dimension = String(question.domain ?? "").trim().toUpperCase();
        if (!COGNITIVE_DIMENSIONS.includes(dimension as CognitiveDimension)) {
          throw new Error(`Cognitive question ${question.id} has invalid dimension "${question.domain}".`);
        }
        if (question.answerType !== "SINGLE_CHOICE_4" || !Array.isArray(question.options) || question.options.length !== 4) {
          throw new Error(`Cognitive question ${question.id} must use SINGLE_CHOICE_4 with four options.`);
        }
        const correctOption = question.correctOption;
        if (typeof correctOption !== "number" || !Number.isInteger(correctOption) || correctOption < 1 || correctOption > 4) {
          throw new Error(`Cognitive question ${question.id} requires a valid objective answer key.`);
        }
        return {
          id: question.id,
          code: question.code,
          dimension: dimension as CognitiveDimension,
          answerType: "SINGLE_CHOICE_4",
          options: question.options,
          correctOption: correctOption as 1|2|3|4,
          weight: Number(question.weight) > 0 ? Number(question.weight) : 1,
        };
      });
      for (const dimension of COGNITIVE_DIMENSIONS) {
        const count = questions.filter((q) => q.dimension === dimension).length;
        const requiredCount = context.questions.length === 40 ? 10 : 6;
        if (count !== requiredCount) {
          throw new Error(`Cognitive dimension "${dimension}" requires exactly ${requiredCount} questions; received ${count}.`);
        }
      }
      const answers: CognitiveAnswer[] = context.answers.map((answer) => {
        if (![1,2,3,4].includes(answer.value)) {
          throw new Error(`Invalid Cognitive answer for question ${answer.questionId}.`);
        }
        return { questionId: answer.questionId, value: answer.value as 1|2|3|4 };
      });
      if (answers.length !== questions.length && context.metadata.completionMode !== "TIMEOUT") {
        throw new Error(`Cognitive requires ${questions.length} answers; received ${answers.length}.`);
      }
      const measurement = scoreCognitive(questions, answers);
      return {
        attemptId: context.metadata.attemptId,
        assessmentType: "COGNITIVE",
        assessmentConfigurationVersion: context.metadata.assessmentConfigurationVersion,
        questionBankVersion: context.metadata.questionBankVersion,
        taxonomyVersion: context.metadata.taxonomyVersion,
        scoringVersion: context.metadata.scoringVersion,
        overallScore: measurement.overallScore,
        score: measurement.overallScore,
        totalQuestions: context.questions.length,
        answeredQuestions: answers.length,
        domainCount: 4,
        measuredDomainCount: 4,
        coverage: context.metadata.completionMode === "TIMEOUT" ? Number(((answers.length / context.questions.length) * 100).toFixed(2)) : 100,
        coveragePercent: context.metadata.completionMode === "TIMEOUT" ? Number(((answers.length / context.questions.length) * 100).toFixed(2)) : 100,
        isComplete: context.metadata.completionMode !== "TIMEOUT",
        minimumCompleteDomains: 4,
        domainScores: measurement.dimensionScores.map((d) => ({ domainId: d.dimension, score: d.score, questionCount: d.questionCount, weightTotal: d.questionCount, scoredSubdomainCount: 0, totalSubdomainCount: 0, sufficient: true })),
        domains: measurement.dimensionScores.map((d) => ({ domainId: d.dimension, score: d.score, questionCount: d.questionCount, weightTotal: d.questionCount, sufficient: true })),
        subdomainScores: [],
        indicatorScores: [],
        strongestDomains: measurement.dimensionScores.slice().sort((a,b)=>b.score-a.score).slice(0,2).map(d=>d.dimension),
        developmentDomains: measurement.dimensionScores.slice().sort((a,b)=>a.score-b.score).slice(0,2).map(d=>d.dimension),
        quality: { scoreableQuestions: answers.length, measuredDomains: 4, totalDomains: 4, coveragePercent: context.metadata.completionMode === "TIMEOUT" ? Number(((answers.length / context.questions.length) * 100).toFixed(2)) : 100, complete: context.metadata.completionMode !== "TIMEOUT" },
        completedAt: context.metadata.completedAt,
        cognitive: createCognitivePersistableResult(measurement),
      } as unknown as AssessmentResult;
    },
  };
}

function createLegacyEngine(testType: "free" | "premium"): TestScoringEngine {
  const identity: ScoringModelIdentity = {
    testType: testType.toUpperCase(),
    modelId: "LEGACY_GENERIC_SCORE",
    version: "SCORING_V1",
  };

  return {
    identity,
    score(context) {
      if (context.metadata.scoringVersion !== identity.version) {
        throw new ScoringEngineConfigurationError(
          `${testType} scoring version mismatch: configured=${context.metadata.scoringVersion}, engine=${identity.version}`,
        );
      }

      return calculateResult(
        context.questions,
        context.answers,
        context.assessmentType,
        context.metadata,
      );
    },
  };
}

const ENGINES = [
  createLegacyEngine("free"),
  createLegacyEngine("premium"),
  createDiscEngine(),
  createEqEngine(),
  createCognitiveEngine(),
  createRiasecEngine(),
] as const;

const REGISTRY = new Map<string, TestScoringEngine>(
  ENGINES.map((engine) => [engine.identity.testType.toLowerCase(), engine]),
);

export function getScoringEngine(assessmentType: ScoringContext["assessmentType"]): TestScoringEngine {
  const engine = REGISTRY.get(assessmentType);
  if (!engine) {
    throw new ScoringEngineConfigurationError(
      `No scoring engine registered for assessment type "${assessmentType}".`,
    );
  }
  return engine;
}

export function calculateRuntimeAssessmentResult(
  assessmentType: ScoringContext["assessmentType"],
  questions: ScoringContext["questions"],
  answers: ScoringContext["answers"],
  metadata: ScoringContext["metadata"],
): AssessmentResult {
  const engine = getScoringEngine(assessmentType);
  return engine.score({
    assessmentType,
    questions,
    answers,
    metadata,
  });
}

export function listScoringEngines(): ScoringModelIdentity[] {
  return ENGINES.map((engine) => ({ ...engine.identity }));
}
