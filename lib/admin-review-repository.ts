import { AssessmentConfigurationStatus, MappingStatus, QuestionStatus } from "@prisma/client";
import { prisma } from "./db/prisma";
import {
  validateQuestionForReview,
  submitQuestionForReview,
  approveQuestionForReview,
  publishQuestionForOperations,
  activateQuestionForOperations,
  archiveQuestionForOperations,
  getQuestionVersionHistory,
} from "./question-bank-repository";
import { auditContentOperation, findQuestionDuplicate, validateQuestionMetadata } from "./admin-content-operations";

const CONTENT_VALIDATION_FAILED = "CONTENT_VALIDATION_FAILED";
const DUPLICATE_CONTENT = "DUPLICATE_CONTENT";

export async function listReviewQueue() {
  const questions = await prisma.questionVersion.findMany({
    where: { status: { in: [QuestionStatus.DRAFT, QuestionStatus.VALIDATED, QuestionStatus.REVIEW_REQUIRED, QuestionStatus.APPROVED, QuestionStatus.PUBLISHED] } },
    include: { question: true, testType: true },
    orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
    take: 5000,
  });
  const latest = new Map<string, typeof questions[number]>();
  for (const q of questions) if (!latest.has(q.questionId)) latest.set(q.questionId, q);
  return [...latest.values()].map(q => {
    const validationErrors = validateQuestionMetadata(q);
    return {
      questionId: q.questionId, questionVersionId: q.id, code: q.question.code, version: q.version,
      testTypeCode: q.testType?.code ?? null, testTypeName: q.testType?.name ?? null,
      text: q.text, domain: q.domain, subdomain: q.subdomain, indicator: q.indicator,
      status: q.status, mappingStatus: q.mappingStatus,
      validationErrors,
      updatedAt: q.updatedAt.toISOString(), createdAt: q.createdAt.toISOString(),
    };
  });
}

export async function inspectReviewItem(questionId: string) {
  const current = await prisma.questionVersion.findFirst({
    where: { questionId },
    include: { question: true, testType: true },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
  });
  if (!current) throw new Error("QUESTION_NOT_FOUND");
  const [versions, audits] = await Promise.all([
    getQuestionVersionHistory(questionId),
    prisma.adminContentAuditEvent.findMany({
      where: { entityType: "QUESTION_VERSION", entityId: { in: (await prisma.questionVersion.findMany({where:{questionId},select:{id:true}})).map(v=>v.id) } },
      orderBy: [{createdAt:"desc"}], take:100,
    }),
  ]);
  const duplicate = await findQuestionDuplicate(current.id, current.text);
  void DUPLICATE_CONTENT;
  return {
    current: { id: current.id, questionId: current.questionId, code: current.question.code, version: current.version, status: current.status, mappingStatus: current.mappingStatus, text: current.text, domain: current.domain, subdomain: current.subdomain, indicator: current.indicator, testTypeCode: current.testType?.code ?? null },
    validationErrors: validateQuestionMetadata(current),
    duplicate: duplicate ? { questionId: duplicate.questionId, questionVersionId: duplicate.id, version: duplicate.version } : null,
    versions: versions.map(v => ({id:v.id,version:v.version,status:v.status,mappingStatus:v.mappingStatus,text:v.text,updatedAt:v.updatedAt.toISOString()})),
    audits: audits.map(a => ({id:a.id,action:a.action,fromStatus:a.fromStatus,toStatus:a.toStatus,actorUserId:a.actorUserId,createdAt:a.createdAt.toISOString()})),
  };
}

export async function getReviewStats() {
  const rows = await listReviewQueue();
  const count=(s:string)=>rows.filter(r=>r.status===s).length;
  void CONTENT_VALIDATION_FAILED;
  return { total:rows.length, draft:count("DRAFT"), validated:count("VALIDATED"), review:count("REVIEW_REQUIRED"), approved:count("APPROVED"), published:count("PUBLISHED"), invalid:rows.filter(r=>r.validationErrors.length>0).length };
}

export async function performReviewAction(action: string, questionId: string, actorUserId: string) {
  switch (action) {
    case "VALIDATE": return validateQuestionForReview(questionId, actorUserId);
    case "SUBMIT_REVIEW": return submitQuestionForReview(questionId, actorUserId);
    case "APPROVE": return approveQuestionForReview(questionId, actorUserId);
    case "PUBLISH": {
      const current = await prisma.questionVersion.findFirst({
        where: { questionId },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      });
      if (!current) throw new Error("QUESTION_NOT_FOUND");
      if (current.status !== QuestionStatus.APPROVED) throw new Error("QUESTION_NOT_APPROVED");
      if (current.mappingStatus !== MappingStatus.APPROVED) throw new Error("MAPPING_NOT_APPROVED");
      return publishQuestionForOperations(questionId, actorUserId);
    }
    case "ACTIVATE": return activateQuestionForOperations(questionId, actorUserId);
    case "ARCHIVE": return archiveQuestionForOperations(questionId, actorUserId);
    default: throw new Error("INVALID_REVIEW_ACTION");
  }
}

export async function getAuditTrail(entityType?: string) {
  return prisma.adminContentAuditEvent.findMany({
    where: entityType ? { entityType } : undefined,
    orderBy: [{ createdAt: "desc" }],
    take: 200,
  });
}
