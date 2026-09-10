import { AssessmentConfigurationStatus, AssessmentType, MappingStatus, Prisma, QuestionStatus } from "@prisma/client";
import { prisma } from "./db/prisma";
import { listAssessmentConfigurations } from "./assessment-configuration-repository";
import { questionGroupFromTestTypeCode, type QuestionGroup, QUESTION_GROUP_LABELS } from "./question-bank-v11";

export type DashboardGroupHealth = {
  group: QuestionGroup;
  label: string;
  total: number;
  published: number;
  active: number;
  draftOrReview: number;
  validationIssues: number;
  mappingIssues: number;
  unpublished: number;
};

export type DashboardConfigurationHealth = {
  id: string;
  code: string;
  name: string;
  assessmentType: AssessmentType;
  version: string;
  status: AssessmentConfigurationStatus;
  readiness: "READY" | "WARNING" | "BLOCKED";
  eligibleCount: number;
  requiredCount: number;
  href: string;
};

export type DashboardAuditEvent = {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  actor: string;
  createdAt: string;
  fromStatus: string | null;
  toStatus: string | null;
};

export type AdminOperationsDashboard = {
  totals: {
    questions: number;
    published: number;
    active: number;
    draftOrReview: number;
    validationIssues: number;
    mappingIssues: number;
    unpublished: number;
    configurations: number;
    readyConfigurations: number;
    warningConfigurations: number;
    blockedConfigurations: number;
  };
  groups: DashboardGroupHealth[];
  configurations: DashboardConfigurationHealth[];
  recentEvents: DashboardAuditEvent[];
  warnings: { severity: "BLOCK" | "WARN"; title: string; detail: string; href: string }[];
};

type LatestQuestion = Prisma.QuestionVersionGetPayload<{ include: { question: true; testType: true } }>;

function isContentComplete(q: LatestQuestion) {
  if (!q.text.trim() || !q.domain.trim() || !q.subdomain?.trim() || !q.indicator?.trim() || q.weight <= 0) return false;
  if (q.testType?.code === "RIASEC") return q.answerType === "LIKERT_5" && q.scale.length === 5 && q.scoringKey.length === 5;
  if (q.testType?.code === "DISC") return q.answerType === "SINGLE_CHOICE_4" && q.scale.length === 4 && q.scoringKey.length === 4;
  if (q.testType?.code === "EQ") return q.answerType === "SINGLE_CHOICE_4" && q.scale.length === 4 && q.scoringKey.length === 4 && new Set(q.scoringKey).size === 4 && q.correctOption == null;
  if (q.testType?.code === "COGNITIVE") return q.answerType === "SINGLE_CHOICE_4" && q.scale.length === 4 && q.scoringKey.length === 1 && q.correctOption != null;
  return false;
}

async function loadLatest() {
  const rows = await prisma.questionVersion.findMany({
    include: { question: true, testType: true },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
  });
  const latest = new Map<string, LatestQuestion>();
  for (const row of rows) if (!latest.has(row.questionId)) latest.set(row.questionId, row);
  return [...latest.values()];
}

export async function getAdminOperationsDashboard(): Promise<AdminOperationsDashboard> {
  const latest = await loadLatest();
  const groups: DashboardGroupHealth[] = (["DISC", "RIASEC", "IQ_COGNITIVE", "EQ"] as QuestionGroup[]).map((group) => {
    const rows = latest.filter((q) => questionGroupFromTestTypeCode(q.testType?.code) === group && q.status !== QuestionStatus.ARCHIVED);
    const published = rows.filter((q) => q.status === QuestionStatus.PUBLISHED).length;
    const active = rows.filter((q) => q.status === QuestionStatus.PUBLISHED && q.mappingStatus === MappingStatus.APPROVED && isContentComplete(q)).length;
    const draftOrReview = rows.filter((q) => q.status === QuestionStatus.DRAFT || q.status === QuestionStatus.VALIDATED || q.status === QuestionStatus.MAPPED || q.status === QuestionStatus.REVIEW_REQUIRED).length;
    const validationIssues = rows.filter((q) => !isContentComplete(q)).length;
    const mappingIssues = rows.filter((q) => q.mappingStatus !== MappingStatus.APPROVED).length;
    const unpublished = rows.filter((q) => q.status !== QuestionStatus.PUBLISHED).length;
    return { group, label: QUESTION_GROUP_LABELS[group], total: rows.length, published, active, draftOrReview, validationIssues, mappingIssues, unpublished };
  });

  const configurations = (await listAssessmentConfigurations()).map((c) => ({
    id: c.id,
    code: c.code,
    name: c.name,
    assessmentType: c.assessmentType,
    version: c.version,
    status: c.status,
    readiness: c.readiness.status,
    eligibleCount: c.readiness.eligibleCount,
    requiredCount: c.readiness.requiredCount,
    href: `/admin/assessment-config?configurationId=${encodeURIComponent(c.id)}`,
  }));

  const recentEvents = await prisma.adminContentAuditEvent.findMany({
    take: 12,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    include: { actor: { select: { name: true, email: true } } },
  });

  const mappedEvents: DashboardAuditEvent[] = recentEvents.map((e) => ({
    id: e.id,
    action: e.action,
    entityType: e.entityType,
    entityId: e.entityId,
    actor: e.actor.name || e.actor.email,
    createdAt: e.createdAt.toISOString(),
    fromStatus: e.fromStatus,
    toStatus: e.toStatus,
  }));

  const totals = {
    questions: groups.reduce((n, g) => n + g.total, 0),
    published: groups.reduce((n, g) => n + g.published, 0),
    active: groups.reduce((n, g) => n + g.active, 0),
    draftOrReview: groups.reduce((n, g) => n + g.draftOrReview, 0),
    validationIssues: groups.reduce((n, g) => n + g.validationIssues, 0),
    mappingIssues: groups.reduce((n, g) => n + g.mappingIssues, 0),
    unpublished: groups.reduce((n, g) => n + g.unpublished, 0),
    configurations: configurations.length,
    readyConfigurations: configurations.filter((c) => c.readiness === "READY").length,
    warningConfigurations: configurations.filter((c) => c.readiness === "WARNING").length,
    blockedConfigurations: configurations.filter((c) => c.readiness === "BLOCKED").length,
  };

  const warnings: AdminOperationsDashboard["warnings"] = [];
  if (totals.blockedConfigurations) warnings.push({ severity: "BLOCK", title: `${totals.blockedConfigurations} configuration blocked`, detail: "Ada configuration yang belum memenuhi readiness dan tidak boleh diaktifkan.", href: "/admin/assessment-config" });
  if (totals.validationIssues) warnings.push({ severity: "BLOCK", title: `${totals.validationIssues} content validation issue`, detail: "Item terbaru memiliki metadata/struktur yang belum lengkap untuk operational use.", href: "/admin/question-bank" });
  if (totals.mappingIssues) warnings.push({ severity: "WARN", title: `${totals.mappingIssues} mapping belum approved`, detail: "Mapping yang belum approved tidak eligible untuk customer runtime.", href: "/admin/review" });
  if (totals.draftOrReview) warnings.push({ severity: "WARN", title: `${totals.draftOrReview} content masih dalam workflow`, detail: "Ada content yang masih membutuhkan validation, review, atau approval.", href: "/admin/review" });
  if (totals.unpublished) warnings.push({ severity: "WARN", title: `${totals.unpublished} content belum published`, detail: "Item non-archived belum menjadi customer-eligible.", href: "/admin/review" });

  return { totals, groups, configurations, recentEvents: mappedEvents, warnings };
}
