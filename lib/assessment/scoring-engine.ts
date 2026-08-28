import type {
  AssessmentResult,
  Answer,
  LikertValue,
  Question,
} from "./types";

const SCORING_VERSION = "SCORING_V1";
const MIN_LIKERT = 1;
const MAX_LIKERT = 5;
const DOMAIN_COUNT = 8;
const COMPLETE_DOMAIN_THRESHOLD = 6;

type ScoringQuestion = Question & {
  reverseScore?: boolean;
  weight?: number;
  domain?: string | null;
  subdomain?: string | null;
  indicator?: string | null;
};

type ScoringAnswer = Answer & {
  questionId: string;
  value: LikertValue;
};

type ResultMetadata = {
  attemptId: string;
  assessmentConfigurationVersion: string;
  questionBankVersion: string;
  taxonomyVersion: string;
  scoringVersion: string;
  completedAt: string;
};

function toLikert(value: unknown): number | null {
  const n = Number(value);
  if (!Number.isInteger(n) || n < MIN_LIKERT || n > MAX_LIKERT) {
    return null;
  }
  return n;
}

function normalizeScore(value: number): number {
  return Number(
    (((value - MIN_LIKERT) / (MAX_LIKERT - MIN_LIKERT)) * 100).toFixed(2),
  );
}

function getWeight(question: ScoringQuestion): number {
  const weight = Number(question.weight ?? 1);
  return Number.isFinite(weight) && weight > 0 ? weight : 1;
}

function scoreQuestion(
  question: ScoringQuestion,
  answer: ScoringAnswer,
): number | null {
  const raw = toLikert(answer.value);
  if (raw === null) return null;

  return question.reverseScore
    ? MAX_LIKERT + MIN_LIKERT - raw
    : raw;
}

type Bucket = {
  domain: string;
  questionCount: number;
  answeredCount: number;
  weightedScore: number;
  weight: number;
};

function calculateDomainScores(
  questions: ScoringQuestion[],
  answers: Map<string, ScoringAnswer>,
) {
  const buckets = new Map<string, Bucket>();

  for (const question of questions) {
    const domain = String(question.domain ?? "").trim();
    if (!domain) continue;

    const bucket =
      buckets.get(domain) ??
      {
        domain,
        questionCount: 0,
        answeredCount: 0,
        weightedScore: 0,
        weight: 0,
      };

    bucket.questionCount += 1;

    const answer = answers.get(question.id);
    if (answer) {
      const score = scoreQuestion(question, answer);
      if (score !== null) {
        const weight = getWeight(question);
        bucket.answeredCount += 1;
        bucket.weightedScore += score * weight;
        bucket.weight += weight;
      }
    }

    buckets.set(domain, bucket);
  }

  return [...buckets.values()]
    .map((bucket) => ({
      domain: bucket.domain,
      questionCount: bucket.questionCount,
      answeredCount: bucket.answeredCount,
      score:
        bucket.weight > 0
          ? normalizeScore(bucket.weightedScore / bucket.weight)
          : null,
    }))
    .sort((a, b) => (b.score ?? -1) - (a.score ?? -1));
}

function calculateSubdomainScores(
  questions: ScoringQuestion[],
  answers: Map<string, ScoringAnswer>,
) {
  const buckets = new Map<
    string,
    {
      domain: string;
      subdomain: string;
      answeredCount: number;
      weightedScore: number;
      weight: number;
    }
  >();

  for (const question of questions) {
    const domain = String(question.domain ?? "").trim();
    const subdomain = String(question.subdomain ?? "").trim();
    if (!domain || !subdomain) continue;

    const answer = answers.get(question.id);
    if (!answer) continue;

    const score = scoreQuestion(question, answer);
    if (score === null) continue;

    const key = `${domain}::${subdomain}`;
    const bucket =
      buckets.get(key) ??
      {
        domain,
        subdomain,
        answeredCount: 0,
        weightedScore: 0,
        weight: 0,
      };

    const weight = getWeight(question);
    bucket.answeredCount += 1;
    bucket.weightedScore += score * weight;
    bucket.weight += weight;
    buckets.set(key, bucket);
  }

  return [...buckets.values()]
    .map((bucket) => ({
      domain: bucket.domain,
      subdomain: bucket.subdomain,
      answeredCount: bucket.answeredCount,
      score: normalizeScore(bucket.weightedScore / bucket.weight),
    }))
    .sort((a, b) => b.score - a.score);
}

function calculateIndicatorScores(
  questions: ScoringQuestion[],
  answers: Map<string, ScoringAnswer>,
) {
  const buckets = new Map<
    string,
    {
      domain: string;
      subdomain: string;
      indicator: string;
      answeredCount: number;
      weightedScore: number;
      weight: number;
    }
  >();

  for (const question of questions) {
    const domain = String(question.domain ?? "").trim();
    const subdomain = String(question.subdomain ?? "").trim();
    const indicator = String(question.indicator ?? "").trim();
    if (!domain || !subdomain || !indicator) continue;

    const answer = answers.get(question.id);
    if (!answer) continue;

    const score = scoreQuestion(question, answer);
    if (score === null) continue;

    const key = `${domain}::${subdomain}::${indicator}`;
    const bucket =
      buckets.get(key) ??
      {
        domain,
        subdomain,
        indicator,
        answeredCount: 0,
        weightedScore: 0,
        weight: 0,
      };

    const weight = getWeight(question);
    bucket.answeredCount += 1;
    bucket.weightedScore += score * weight;
    bucket.weight += weight;
    buckets.set(key, bucket);
  }

  return [...buckets.values()]
    .map((bucket) => ({
      domain: bucket.domain,
      subdomain: bucket.subdomain,
      indicator: bucket.indicator,
      answeredCount: bucket.answeredCount,
      score: normalizeScore(bucket.weightedScore / bucket.weight),
    }))
    .sort((a, b) => b.score - a.score);
}

/**
 * PHASE 2.16.1
 *
 * Keep the existing runtime contract:
 * calculateResult(
 *   questions,
 *   answers,
 *   assessmentType,
 *   metadata
 * )
 *
 * Runtime owns the immutable assessment snapshot and persistence metadata.
 * This function owns scoring and coverage only.
 */
export function calculateResult(
  questions: Question[],
  answers: Answer[],
  assessmentType: string,
  metadata: ResultMetadata,
): AssessmentResult {
  const scoringQuestions = questions as ScoringQuestion[];
  const scoringAnswers = answers as ScoringAnswer[];

  const answersByQuestionId = new Map<string, ScoringAnswer>();

  for (const answer of scoringAnswers) {
    if (!answer?.questionId) continue;
    if (toLikert(answer.value) === null) continue;
    answersByQuestionId.set(answer.questionId, answer);
  }

  let weightedScore = 0;
  let totalWeight = 0;
  let answeredQuestions = 0;

  for (const question of scoringQuestions) {
    const answer = answersByQuestionId.get(question.id);
    if (!answer) continue;

    const score = scoreQuestion(question, answer);
    if (score === null) continue;

    const weight = getWeight(question);
    weightedScore += score * weight;
    totalWeight += weight;
    answeredQuestions += 1;
  }

  const overallScore =
    totalWeight > 0
      ? normalizeScore(weightedScore / totalWeight)
      : 0;

  const domainScores = calculateDomainScores(
    scoringQuestions,
    answersByQuestionId,
  );

  const measuredDomains = domainScores.filter(
    (item) => item.answeredCount > 0 && item.score !== null,
  );

  const coverage = Number(
    ((measuredDomains.length / DOMAIN_COUNT) * 100).toFixed(2),
  );

  const complete =
    measuredDomains.length >= COMPLETE_DOMAIN_THRESHOLD;

  const strongestDomains = measuredDomains
    .slice()
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, 3);

  const developmentDomains = measuredDomains
    .slice()
    .sort((a, b) => (a.score ?? 0) - (b.score ?? 0))
    .slice(0, 3);

  /*
   * The runtime's AssessmentResult type is the persistence/result contract.
   * Metadata is deliberately returned here because runtime-service passes the
   * immutable attempt metadata into calculateResult().
   *
   * The final cast is intentionally isolated at this boundary: the scoring
   * payload contains the runtime contract plus the Phase 2.16.1 analytical
   * fields, while the existing type may contain additional legacy fields.
   */
  const result = {
    attemptId: metadata.attemptId,
    assessmentType,

    assessmentConfigurationVersion:
      metadata.assessmentConfigurationVersion,

    questionBankVersion: metadata.questionBankVersion,
    taxonomyVersion: metadata.taxonomyVersion,
    scoringVersion: metadata.scoringVersion || SCORING_VERSION,
    completedAt: metadata.completedAt,

    score: overallScore,
    overallScore,

    totalQuestions: scoringQuestions.length,
    answeredQuestions,

    domainCount: DOMAIN_COUNT,
    measuredDomainCount: measuredDomains.length,

    coverage,
    coveragePercent: coverage,

    isComplete: complete,
    minimumCompleteDomains: COMPLETE_DOMAIN_THRESHOLD,

    domainScores,
    domains: domainScores,

    subdomainScores: calculateSubdomainScores(
      scoringQuestions,
      answersByQuestionId,
    ),

    indicatorScores: calculateIndicatorScores(
      scoringQuestions,
      answersByQuestionId,
    ),

    strongestDomains,
    developmentDomains,

    quality: {
      scoreableQuestions: answeredQuestions,
      measuredDomains: measuredDomains.length,
      totalDomains: DOMAIN_COUNT,
      coveragePercent: coverage,
      complete,
    },
  } as unknown as AssessmentResult;

  return result;
}

export const SCORING_ENGINE_VERSION = SCORING_VERSION;
export const SCORING_DOMAIN_COUNT = DOMAIN_COUNT;
export const SCORING_COMPLETE_DOMAIN_THRESHOLD =
  COMPLETE_DOMAIN_THRESHOLD;
