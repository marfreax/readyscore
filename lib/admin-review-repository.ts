import { MappingStatus, Prisma, QuestionStatus, UserRole } from "@prisma/client";
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
import { listAdminAuditEvents, type AdminAuditEntityType } from "./admin-audit-repository";
import { createAdminPaginatedResult, normalizeAdminPagination, type AdminPaginationInput, type AdminPaginatedResult } from "./admin-pagination";

const CONTENT_VALIDATION_FAILED = "CONTENT_VALIDATION_FAILED";
const DUPLICATE_CONTENT = "DUPLICATE_CONTENT";

export type AdminReviewListItem = {
  questionId: string;
  questionVersionId: string;
  code: string;
  version: string;
  testTypeCode: string | null;
  testTypeName: string | null;
  text: string;
  domain: string;
  subdomain: string | null;
  indicator: string | null;
  status: QuestionStatus;
  mappingStatus: MappingStatus;
  validationErrors: string[];
  updatedAt: string;
  createdAt: string;
  taxonomyNodeCode: string | null;
  taxonomyNodeName: string | null;
  taxonomyNodeType: string | null;
};

export type AdminReviewPaginatedParams = AdminPaginationInput & {
  search?: string;
  status?: string;
};

type AdminReviewRawRow = {
  questionId: string;
  code: string;
  questionVersionId: string;
  version: string;
  testTypeId: string | null;
  testTypeCode: string | null;
  testTypeName: string | null;
  taxonomyVersion: string | null;
  text: string;
  domain: string;
  subdomain: string | null;
  indicator: string | null;
  status: string;
  mappingStatus: string;
  weight: number;
  scale: number[];
  scoringKey: number[];
  answerType: string;
  options: unknown;
  correctOption: number | null;
  updatedAt: Date;
  createdAt: Date;
  taxonomyNodeCode?: string | null;
  taxonomyNodeName?: string | null;
  taxonomyNodeType?: string | null;
};

function reviewRawToItem(row: AdminReviewRawRow): AdminReviewListItem {
  const validationErrors = validateQuestionMetadata({
    text: row.text,
    domain: row.domain,
    subdomain: row.subdomain,
    indicator: row.indicator,
    testTypeId: row.testTypeId,
    weight: Number(row.weight),
    scale: Array.isArray(row.scale) ? row.scale.map(Number) : [],
    scoringKey: Array.isArray(row.scoringKey) ? row.scoringKey.map(Number) : [],
    answerType: row.answerType,
    options: row.options as Prisma.JsonValue,
    correctOption: row.correctOption,
  });
  return {
    questionId: row.questionId,
    questionVersionId: row.questionVersionId,
    code: row.code,
    version: row.version,
    testTypeCode: row.testTypeCode,
    testTypeName: row.testTypeName,
    text: row.text,
    domain: row.domain,
    subdomain: row.subdomain,
    indicator: row.indicator,
    status: row.status as QuestionStatus,
    mappingStatus: row.mappingStatus as MappingStatus,
    validationErrors,
    updatedAt: row.updatedAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
    taxonomyNodeCode: row.taxonomyNodeCode ?? null,
    taxonomyNodeName: row.taxonomyNodeName ?? null,
    taxonomyNodeType: row.taxonomyNodeType ?? null,
  };
}

async function attachReviewTaxonomyNodeDisplay(rows: AdminReviewRawRow[]) {
  const versions = [...new Set(rows.map(r => r.taxonomyVersion).filter((v): v is string => Boolean(v)))];
  const testTypes = [...new Set(rows.map(r => r.testTypeCode).filter((v): v is string => Boolean(v)))];
  if (!versions.length || !testTypes.length) return rows.map(row => ({ ...row, taxonomyNodeCode: null, taxonomyNodeName: null, taxonomyNodeType: null }));
  const testTypeIds = await prisma.testType.findMany({ where: { code: { in: testTypes } }, select: { id: true, code: true } });
  const idByCode = new Map(testTypeIds.map(t => [t.code, t.id]));
  const taxonomies = await prisma.taxonomyVersion.findMany({ where: { version: { in: versions }, testTypeId: { in: testTypeIds.map(t => t.id) } }, include: { nodes: true } });
  const byKey = new Map<string, typeof taxonomies[number]>();
  for (const taxonomy of taxonomies) byKey.set(`${taxonomy.testTypeId}::${taxonomy.version}`, taxonomy);
  return rows.map(row => {
    const taxonomy = row.taxonomyVersion && row.testTypeCode ? byKey.get(`${idByCode.get(row.testTypeCode) ?? ''}::${row.taxonomyVersion}`) : undefined;
    if (!taxonomy) return { ...row, taxonomyNodeCode: null, taxonomyNodeName: null, taxonomyNodeType: null };
    const candidates = [row.domain, row.subdomain, row.indicator].filter(Boolean).map(v => v!.trim().toUpperCase());
    const node = taxonomy.nodes.find(n => candidates.includes(n.code.trim().toUpperCase()));
    return { ...row, taxonomyNodeCode: node?.code ?? null, taxonomyNodeName: node?.name ?? null, taxonomyNodeType: node?.nodeType ?? null };
  });
}

export async function listReviewQueuePaginated(
  params: AdminReviewPaginatedParams = {},
): Promise<AdminPaginatedResult<AdminReviewListItem>> {
  const pagination = normalizeAdminPagination(params);
  const conditions: Prisma.Sql[] = [
    Prisma.sql`latest.rn = 1`,
    Prisma.sql`latest."status"::text IN ('DRAFT','VALIDATED','REVIEW_REQUIRED','APPROVED','PUBLISHED')`,
  ];

  const search = params.search?.trim();
  if (search) {
    const pattern = `%${search}%`;
    conditions.push(Prisma.sql`(
      latest."code" ILIKE ${pattern}
      OR latest."text" ILIKE ${pattern}
      OR latest."domain" ILIKE ${pattern}
      OR COALESCE(latest."testTypeCode", '') ILIKE ${pattern}
    )`);
  }

  const status = params.status?.trim().toUpperCase();
  if (status && status !== "ALL") {
    conditions.push(Prisma.sql`latest."status"::text = ${status}`);
  }

  const where = Prisma.join(conditions, " AND ");
  const ranked = Prisma.sql`
    WITH ranked AS (
      SELECT
        q.id AS "questionId",
        q.code AS "code",
        qv.id AS "questionVersionId",
        qv.version AS "version",
        qv."testTypeId" AS "testTypeId",
        tt.code AS "testTypeCode",
        tt.name AS "testTypeName",
        qv."taxonomyVersion" AS "taxonomyVersion",
        qv.text AS "text",
        qv.domain AS "domain",
        qv.subdomain AS "subdomain",
        qv.indicator AS "indicator",
        qv.status AS "status",
        qv."mappingStatus" AS "mappingStatus",
        qv.weight AS "weight",
        qv.scale AS "scale",
        qv."scoringKey" AS "scoringKey",
        qv."answerType" AS "answerType",
        qv.options AS "options",
        qv."correctOption" AS "correctOption",
        qv."updatedAt" AS "updatedAt",
        qv."createdAt" AS "createdAt",
        ROW_NUMBER() OVER (
          PARTITION BY qv."questionId"
          ORDER BY qv."createdAt" DESC, qv.id DESC
        ) AS rn
      FROM "QuestionVersion" qv
      INNER JOIN "Question" q ON q.id = qv."questionId"
      LEFT JOIN "TestType" tt ON tt.id = qv."testTypeId"
    )
  `;

  const [countRows, rows] = await prisma.$transaction([
    prisma.$queryRaw<{ totalItems: bigint }[]>(Prisma.sql`${ranked}, latest AS (SELECT * FROM ranked) SELECT COUNT(*)::bigint AS "totalItems" FROM latest WHERE ${where}`),
    prisma.$queryRaw<AdminReviewRawRow[]>(Prisma.sql`${ranked}, latest AS (SELECT * FROM ranked) SELECT
      latest."questionId", latest."code", latest."questionVersionId", latest."version",
      latest."testTypeId", latest."testTypeCode", latest."testTypeName", latest."taxonomyVersion", latest."text",
      latest."domain", latest."subdomain", latest."indicator", latest."status"::text AS "status",
      latest."mappingStatus"::text AS "mappingStatus", latest."weight", latest."scale",
      latest."scoringKey", latest."answerType", latest."options", latest."correctOption",
      latest."updatedAt", latest."createdAt"
      FROM latest WHERE ${where}
      ORDER BY latest."updatedAt" DESC, latest."questionVersionId" DESC
      LIMIT ${pagination.limit} OFFSET ${pagination.offset}`),
  ]);

  const totalItems = Number(countRows[0]?.totalItems ?? 0);
  const enrichedRows = await attachReviewTaxonomyNodeDisplay(rows);
  return createAdminPaginatedResult(
    enrichedRows.map(reviewRawToItem),
    { page: pagination.page, pageSize: pagination.pageSize },
    totalItems,
  );
}

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
  const taxonomy = current.taxonomyVersion && current.testTypeId ? await prisma.taxonomyVersion.findFirst({
    where: { version: current.taxonomyVersion, testTypeId: current.testTypeId },
    include: { nodes: true },
  }) : null;
  const taxonomyCandidates = [current.domain, current.subdomain, current.indicator].filter(Boolean).map(v => v!.trim().toUpperCase());
  const taxonomyNode = taxonomy?.nodes.find(n => taxonomyCandidates.includes(n.code.trim().toUpperCase())) ?? null;
  return {
    current: { id: current.id, questionId: current.questionId, code: current.question.code, version: current.version, status: current.status, mappingStatus: current.mappingStatus, text: current.text, domain: current.domain, subdomain: current.subdomain, indicator: current.indicator, testTypeCode: current.testType?.code ?? null, taxonomyNodeCode: taxonomyNode?.code ?? null, taxonomyNodeName: taxonomyNode?.name ?? null, taxonomyNodeType: taxonomyNode?.nodeType ?? null },
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

export type GovernedReviewAction =
  | "VALIDATE"
  | "SUBMIT_REVIEW"
  | "APPROVE_MAPPING"
  | "APPROVE"
  | "PUBLISH"
  | "ACTIVATE"
  | "ARCHIVE";

const HIGH_IMPACT_ACTIONS = new Set<GovernedReviewAction>(["PUBLISH", "ACTIVATE", "ARCHIVE"]);

function assertReviewPermission(role: UserRole, action: GovernedReviewAction) {
  if (role !== UserRole.ADMIN) throw new Error("FORBIDDEN");
  if (!action) throw new Error("INVALID_REVIEW_ACTION");
}

async function currentQuestionVersion(questionId: string) {
  const current = await prisma.questionVersion.findFirst({
    where: { questionId },
    include: { question: true, testType: true },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
  });
  if (!current) throw new Error("QUESTION_NOT_FOUND");
  return current;
}

export async function getReviewImpactPreview(questionId: string, action: GovernedReviewAction) {
  const current = await currentQuestionVersion(questionId);
  const historicalAttempts = await prisma.attemptQuestion.count({ where: { questionVersionId: current.id } });
  const duplicate = await findQuestionDuplicate(current.id, current.text);
  const validationErrors = validateQuestionMetadata(current);
  const blockedReasons: string[] = [];
  if (action === "APPROVE_MAPPING" && (!current.subdomain || !current.indicator)) blockedReasons.push("MAPPING_INCOMPLETE");
  if ((action === "APPROVE" || action === "PUBLISH") && validationErrors.length) blockedReasons.push(...validationErrors);
  if (action === "APPROVE" && current.mappingStatus !== MappingStatus.APPROVED) blockedReasons.push("MAPPING_NOT_APPROVED");
  if (action === "PUBLISH" && current.status !== QuestionStatus.APPROVED) blockedReasons.push("QUESTION_NOT_APPROVED");
  if (action === "PUBLISH" && current.mappingStatus !== MappingStatus.APPROVED) blockedReasons.push("MAPPING_NOT_APPROVED");
  if (action === "ACTIVATE" && current.status !== QuestionStatus.PUBLISHED) blockedReasons.push("QUESTION_NOT_PUBLISHED");
  if (action === "ARCHIVE" && current.status === QuestionStatus.PUBLISHED) blockedReasons.push("ACTIVE_CONTENT_REQUIRES_REPLACEMENT");
  if (action === "ARCHIVE" && current.status !== QuestionStatus.APPROVED && current.status !== QuestionStatus.REVIEW_REQUIRED) blockedReasons.push("QUESTION_NOT_ARCHIVABLE");
  if ((action === "VALIDATE" || action === "APPROVE" || action === "PUBLISH") && duplicate) blockedReasons.push("DUPLICATE_CONTENT");
  return {
    action,
    object: { questionId: current.questionId, questionVersionId: current.id, code: current.question.code, version: current.version, status: current.status },
    currentUse: { published: current.status === QuestionStatus.PUBLISHED, historicalAttempts: historicalAttempts > 0, historicalAttemptCount: historicalAttempts },
    historicalImpact: "NONE",
    futureCustomerImpact: action === "PUBLISH" || action === "ACTIVATE" ? "May affect future eligible customer attempts after the normal publication/activation boundary." : "No direct customer availability change.",
    scoringImpact: "No scoring algorithm change is performed by this operation.",
    requiresReview: ["SUBMIT_REVIEW", "APPROVE", "PUBLISH"].includes(action),
    requiresRegression: ["APPROVE", "PUBLISH", "ACTIVATE", "ARCHIVE"].includes(action),
    confirmationRequired: HIGH_IMPACT_ACTIONS.has(action),
    duplicate: duplicate ? { questionId: duplicate.questionId, questionVersionId: duplicate.id, version: duplicate.version } : null,
    validationErrors,
    blocked: [...new Set(blockedReasons)],
  };
}

export async function performReviewAction(action: string, questionId: string, actorUserId: string, options?: { confirmed?: boolean; reason?: string }) {
  const normalized = String(action).toUpperCase() as GovernedReviewAction;
  if (!["VALIDATE","SUBMIT_REVIEW","APPROVE_MAPPING","APPROVE","PUBLISH","ACTIVATE","ARCHIVE"].includes(normalized)) throw new Error("INVALID_REVIEW_ACTION");
  const actor = await prisma.user.findUnique({ where: { id: actorUserId }, select: { role: true } });
  if (!actor) throw new Error("UNAUTHENTICATED");
  assertReviewPermission(actor.role, normalized);
  if (HIGH_IMPACT_ACTIONS.has(normalized) && options?.confirmed !== true) throw new Error("HIGH_IMPACT_CONFIRMATION_REQUIRED");
  const preview = await getReviewImpactPreview(questionId, normalized);
  if (preview.blocked.length) throw new Error(`REVIEW_ACTION_BLOCKED:${preview.blocked.join(",")}`);

  switch (normalized) {
    case "VALIDATE": return validateQuestionForReview(questionId, actorUserId);
    case "SUBMIT_REVIEW": return submitQuestionForReview(questionId, actorUserId);
    case "APPROVE_MAPPING": {
      const current = await currentQuestionVersion(questionId);
      if (current.mappingStatus !== MappingStatus.MAPPED && current.mappingStatus !== MappingStatus.REVIEW_REQUIRED) throw new Error("MAPPING_NOT_READY");
      const from = current.mappingStatus;
      await prisma.questionVersion.update({ where: { id: current.id }, data: { mappingStatus: MappingStatus.APPROVED } });
      await auditContentOperation({ entityType: "QUESTION_VERSION", entityId: current.id, action: "APPROVE_MAPPING", fromStatus: from, toStatus: MappingStatus.APPROVED, actorUserId, metadata: { reason: options?.reason ?? null } });
      return currentQuestionVersion(questionId);
    }
    case "APPROVE": return approveQuestionForReview(questionId, actorUserId);
    case "PUBLISH": return publishQuestionForOperations(questionId, actorUserId);
    case "ACTIVATE": return activateQuestionForOperations(questionId, actorUserId);
    case "ARCHIVE": return archiveQuestionForOperations(questionId, actorUserId);
  }
}


export type BulkReviewResult = {
  questionId: string;
  status: string;
  completed: string[];
  error?: string;
};

/**
 * Explicit admin bulk lifecycle runner. It does not bypass governance: every
 * question is advanced through the same single-item review operations and each
 * mutation keeps its own audit event. Publishing still requires one explicit
 * admin confirmation for the whole requested batch.
 */
export async function bulkAdvanceQuestionsToPublished(
  questionIds: string[],
  actorUserId: string,
  options?: { confirmed?: boolean },
): Promise<{ results: BulkReviewResult[]; requested: number; published: number; failed: number }> {
  const ids = [...new Set(questionIds.map(String).filter(Boolean))];
  if (!ids.length) throw new Error("QUESTION_IDS_REQUIRED");
  if (ids.length > 100) throw new Error("BULK_SELECTION_LIMIT_EXCEEDED");
  if (options?.confirmed !== true) throw new Error("BULK_HIGH_IMPACT_CONFIRMATION_REQUIRED");

  const actor = await prisma.user.findUnique({ where: { id: actorUserId }, select: { role: true } });
  if (!actor) throw new Error("UNAUTHENTICATED");
  assertReviewPermission(actor.role, "PUBLISH");

  const results: BulkReviewResult[] = [];
  for (const questionId of ids) {
    const completed: string[] = [];
    try {
      for (let guard = 0; guard < 8; guard += 1) {
        const current = await currentQuestionVersion(questionId);
        if (current.status === QuestionStatus.PUBLISHED) {
          results.push({ questionId, status: current.status, completed });
          break;
        }

        if (current.status === QuestionStatus.DRAFT) {
          await performReviewAction("VALIDATE", questionId, actorUserId);
          completed.push("VALIDATE");
          continue;
        }
        if (current.status === QuestionStatus.VALIDATED) {
          await performReviewAction("SUBMIT_REVIEW", questionId, actorUserId);
          completed.push("SUBMIT_REVIEW");
          continue;
        }
        if (current.status === QuestionStatus.REVIEW_REQUIRED) {
          if (current.mappingStatus !== MappingStatus.APPROVED) {
            await performReviewAction("APPROVE_MAPPING", questionId, actorUserId);
            completed.push("APPROVE_MAPPING");
          }
          await performReviewAction("APPROVE", questionId, actorUserId);
          completed.push("APPROVE");
          continue;
        }
        if (current.status === QuestionStatus.APPROVED) {
          await performReviewAction("PUBLISH", questionId, actorUserId, { confirmed: true });
          completed.push("PUBLISH");
          continue;
        }
        throw new Error(`QUESTION_NOT_BULK_PUBLISHABLE:${current.status}`);
      }

      const final = await currentQuestionVersion(questionId);
      if (final.status !== QuestionStatus.PUBLISHED) throw new Error(`BULK_LIFECYCLE_GUARD_EXCEEDED:${final.status}`);
      const existing = results[results.length - 1];
      if (!existing || existing.questionId !== questionId) results.push({ questionId, status: final.status, completed });
    } catch (error) {
      results.push({ questionId, status: "FAILED", completed, error: error instanceof Error ? error.message : "BULK_ACTION_FAILED" });
    }
  }

  return {
    results,
    requested: ids.length,
    published: results.filter(r => r.status === QuestionStatus.PUBLISHED).length,
    failed: results.filter(r => r.status === "FAILED").length,
  };
}

export async function getAuditTrail(entityType?: string) {
  if (!entityType) return listAdminAuditEvents();
  if (!["QUESTION_VERSION", "ASSESSMENT_CONFIGURATION_VERSION", "USER"].includes(entityType)) {
    return [];
  }
  return listAdminAuditEvents({ entityType: entityType as AdminAuditEntityType });
}
