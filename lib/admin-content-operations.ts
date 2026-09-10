import { Prisma, QuestionStatus, MappingStatus, AssessmentConfigurationStatus } from "@prisma/client";
import { prisma } from "./db/prisma";

export type ContentEntityType = "QUESTION_VERSION" | "ASSESSMENT_CONFIGURATION_VERSION" | "QUESTION_PACKAGE_VERSION";

export async function auditContentOperation(input: {
  entityType: ContentEntityType;
  entityId: string;
  action: string;
  fromStatus?: string | null;
  toStatus?: string | null;
  actorUserId: string;
  metadata?: Record<string, unknown>;
}) {
  return prisma.adminContentAuditEvent.create({
    data: {
      entityType: input.entityType,
      entityId: input.entityId,
      action: input.action,
      fromStatus: input.fromStatus ?? null,
      toStatus: input.toStatus ?? null,
      actorUserId: input.actorUserId,
      metadata: input.metadata as object | undefined,
    },
  });
}

export function validateQuestionMetadata(q: {
  text: string;
  domain: string;
  subdomain?: string | null;
  indicator?: string | null;
  testTypeId?: string | null;
  weight?: number;
  scale?: readonly number[];
  scoringKey?: readonly number[];
  answerType?: string | null;
  options?: Prisma.JsonValue;
  correctOption?: number | null;
}) {
  const errors: string[] = [];
  if (!q.testTypeId) errors.push("TEST_TYPE_REQUIRED");
  if (!q.text?.trim()) errors.push("TEXT_REQUIRED");
  if (!q.domain?.trim()) errors.push("DOMAIN_REQUIRED");
  if (!q.subdomain?.trim()) errors.push("SUBDOMAIN_REQUIRED");
  if (!q.indicator?.trim()) errors.push("INDICATOR_REQUIRED");
  if (!(Number(q.weight ?? 0) > 0)) errors.push("WEIGHT_INVALID");

  if (q.answerType === "SINGLE_CHOICE_4") {
    if (!q.scale || q.scale.length !== 4 || !q.scale.every((value, index) => value === index + 1)) {
      errors.push("OBJECTIVE_SCALE_INVALID");
    }
    if (!Array.isArray(q.options) || q.options.length !== 4 || new Set(q.options.map(String)).size !== 4) {
      errors.push("OBJECTIVE_OPTIONS_INVALID");
    }

    // DISC V2 and EQ V2 use the same four-choice transport type as objective items,
    // but neither is objectively right/wrong. DISC maps each option to a behavioral
    // dimension; EQ maps each option to an explicit ordinal score through scoringKey.
    // Keep this validator aligned with the scoring engines rather than forcing the
    // generic objective contract onto EQ.
    const normalizedDomain = q.domain.trim().toUpperCase();
    const isDiscForcedChoice = normalizedDomain === "DISC";
    const isEqOrdinal = [
      "EMOTION_AWARENESS",
      "EMOTION_REGULATION",
      "EMPATHY_SOCIAL_AWARENESS",
      "RELATIONSHIP_SOCIAL_RESPONSE",
    ].includes(normalizedDomain);
    if (isDiscForcedChoice) {
      if (
        !q.scoringKey ||
        q.scoringKey.length !== 4 ||
        !q.scoringKey.every((value) => Number.isInteger(value) && value >= 1 && value <= 4) ||
        new Set(q.scoringKey).size !== 4
      ) {
        errors.push("DISC_FORCED_CHOICE_KEY_INVALID");
      }
      if (q.correctOption !== null && q.correctOption !== undefined) {
        errors.push("DISC_FORCED_CHOICE_MUST_NOT_HAVE_CORRECT_OPTION");
      }
    } else if (isEqOrdinal) {
      if (
        !q.scoringKey ||
        q.scoringKey.length !== 4 ||
        !q.scoringKey.every((value) => Number.isInteger(value) && value >= 1 && value <= 4) ||
        new Set(q.scoringKey).size !== 4
      ) {
        errors.push("EQ_ORDINAL_SCORING_KEY_INVALID");
      }
      if (q.correctOption !== null && q.correctOption !== undefined) {
        errors.push("EQ_ORDINAL_MUST_NOT_HAVE_CORRECT_OPTION");
      }
    } else {
      if (!q.scoringKey || q.scoringKey.length !== 1 || !Number.isInteger(q.scoringKey[0]) || q.scoringKey[0] < 1 || q.scoringKey[0] > 4) {
        errors.push("OBJECTIVE_SCORING_KEY_INVALID");
      }
      if (!Number.isInteger(q.correctOption) || (q.correctOption ?? 0) < 1 || (q.correctOption ?? 0) > 4) {
        errors.push("OBJECTIVE_CORRECT_OPTION_INVALID");
      }
    }
  } else {
    if (!q.scale || q.scale.length !== 5) errors.push("SCALE_INVALID");
    if (!q.scoringKey || q.scoringKey.length !== 5) errors.push("SCORING_KEY_INVALID");
  }
  return errors;
}

export async function findQuestionDuplicate(questionVersionId: string, text: string): Promise<{ id: string; questionId: string; text: string; version: string } | null> {
  const normalized = text.trim().replace(/\s+/g, " ").toLowerCase();
  if (!normalized) return null;
  const rows = await prisma.questionVersion.findMany({
    where: {
      id: { not: questionVersionId },
      status: { in: [QuestionStatus.DRAFT, QuestionStatus.VALIDATED, QuestionStatus.REVIEW_REQUIRED, QuestionStatus.APPROVED, QuestionStatus.PUBLISHED] },
    },
    select: { id: true, questionId: true, text: true, version: true },
    take: 5000,
  });
  return rows.find(r => r.text.trim().replace(/\s+/g, " ").toLowerCase() === normalized) ?? null;
}

export function canSubmitQuestionForReview(status: QuestionStatus) {
  return status === QuestionStatus.DRAFT || status === QuestionStatus.VALIDATED || status === QuestionStatus.MAPPED || status === QuestionStatus.REJECTED;
}

export function canApproveQuestionContent(status: QuestionStatus) {
  return status === QuestionStatus.REVIEW_REQUIRED;
}

export function canPublishQuestion(status: QuestionStatus) {
  return status === QuestionStatus.APPROVED;
}

export function canActivateQuestion(status: QuestionStatus) {
  return status === QuestionStatus.PUBLISHED;
}

export function canArchiveQuestion(status: QuestionStatus) {
  return status === QuestionStatus.PUBLISHED || status === QuestionStatus.APPROVED || status === QuestionStatus.REVIEW_REQUIRED;
}

export function canSubmitConfigurationForReview(status: AssessmentConfigurationStatus) {
  return status === AssessmentConfigurationStatus.DRAFT;
}

export function canApproveConfiguration(status: AssessmentConfigurationStatus) {
  return status === AssessmentConfigurationStatus.REVIEW;
}
