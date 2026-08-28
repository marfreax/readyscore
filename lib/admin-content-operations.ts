import { QuestionStatus, MappingStatus, AssessmentConfigurationStatus } from "@prisma/client";
import { prisma } from "./db/prisma";

export type ContentEntityType = "QUESTION_VERSION" | "ASSESSMENT_CONFIGURATION_VERSION";

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
  text: string; domain: string; subdomain?: string | null; indicator?: string | null;
  testTypeId?: string | null; weight?: number; scale?: readonly number[]; scoringKey?: readonly number[];
}) {
  const errors: string[] = [];
  if (!q.testTypeId) errors.push("TEST_TYPE_REQUIRED");
  if (!q.text?.trim()) errors.push("TEXT_REQUIRED");
  if (!q.domain?.trim()) errors.push("DOMAIN_REQUIRED");
  if (!q.subdomain?.trim()) errors.push("SUBDOMAIN_REQUIRED");
  if (!q.indicator?.trim()) errors.push("INDICATOR_REQUIRED");
  if (!(Number(q.weight ?? 0) > 0)) errors.push("WEIGHT_INVALID");
  if (!q.scale || q.scale.length !== 5) errors.push("SCALE_INVALID");
  if (!q.scoringKey || q.scoringKey.length !== 5) errors.push("SCORING_KEY_INVALID");
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
