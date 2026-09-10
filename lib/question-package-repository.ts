import { Prisma, QuestionPackageStatus } from "@prisma/client";
import { prisma } from "./db/prisma";
import { auditContentOperation } from "./admin-content-operations";
import { evaluateQuestionPackageProductionEligibility, type ProductionEligibility } from "./question-package-eligibility";

export type PackageCompositionInput = {
  taxonomyNodeId: string;
  requiredCount: number;
};

type PackageInput = {
  id?: string;
  testTypeId: string;
  code: string;
  name: string;
  description?: string | null;
  version?: string;
  totalQuestions: number;
  timeLimitSeconds: number;
  taxonomyVersionId?: string | null;
  compositionRules: PackageCompositionInput[];
};

export type PackageValidationCheck = {
  key: string;
  label: string;
  status: "PASS" | "BLOCK";
  detail: string;
};

export type PackageValidation = {
  status: "READY" | "BLOCKED";
  checks: PackageValidationCheck[];
};

function ensurePositiveInteger(value: number, code: string) {
  if (!Number.isInteger(value) || value <= 0) throw new Error(code);
}

function uniqueRules(rules: PackageCompositionInput[]) {
  return new Set(rules.map((rule) => rule.taxonomyNodeId)).size === rules.length;
}

async function validateInput(tx: Prisma.TransactionClient, input: PackageInput) {
  ensurePositiveInteger(input.totalQuestions, "INVALID_TOTAL_QUESTIONS");
  ensurePositiveInteger(input.timeLimitSeconds, "INVALID_TIME_LIMIT");
  const configuredTestType = await tx.testType.findUnique({ where: { id: input.testTypeId }, select: { code: true } });
  if (configuredTestType && ["RIASEC", "DISC", "EQ", "COGNITIVE"].includes(configuredTestType.code) && input.timeLimitSeconds !== 1200) {
    throw new Error("PRODUCTION_TIMER_MUST_BE_1200");
  }
  if (!input.testTypeId.trim()) throw new Error("TEST_TYPE_REQUIRED");
  if (!input.code.trim() || !input.name.trim()) throw new Error("INVALID_PACKAGE_IDENTITY");
  if (!Array.isArray(input.compositionRules) || input.compositionRules.length === 0) {
    throw new Error("COMPOSITION_REQUIRED");
  }
  if (!uniqueRules(input.compositionRules)) throw new Error("DUPLICATE_COMPOSITION_NODE");
  for (const rule of input.compositionRules) ensurePositiveInteger(rule.requiredCount, "INVALID_COMPOSITION_COUNT");

  const testType = await tx.testType.findUnique({ where: { id: input.testTypeId }, select: { id: true } });
  if (!testType) throw new Error("TEST_TYPE_NOT_FOUND");

  if (input.taxonomyVersionId) {
    const taxonomy = await tx.taxonomyVersion.findUnique({ where: { id: input.taxonomyVersionId }, select: { id: true, testTypeId: true } });
    if (!taxonomy) throw new Error("TAXONOMY_NOT_FOUND");
    if (taxonomy.testTypeId !== input.testTypeId) throw new Error("TAXONOMY_TEST_TYPE_MISMATCH");
  }

  const nodeIds = input.compositionRules.map((rule) => rule.taxonomyNodeId);
  const nodes = await tx.taxonomyNode.findMany({ where: { id: { in: nodeIds } }, select: { id: true, taxonomyId: true } });
  if (nodes.length !== nodeIds.length) throw new Error("COMPOSITION_NODE_NOT_FOUND");
  if (input.taxonomyVersionId && nodes.some((node) => node.taxonomyId !== input.taxonomyVersionId)) {
    throw new Error("COMPOSITION_TAXONOMY_MISMATCH");
  }
  if (!input.taxonomyVersionId && nodes.length > 0) throw new Error("TAXONOMY_REQUIRED_FOR_COMPOSITION");

  const sum = input.compositionRules.reduce((total, rule) => total + rule.requiredCount, 0);
  if (sum !== input.totalQuestions) throw new Error("COMPOSITION_TOTAL_MISMATCH");
}

async function nextVersion(tx: Prisma.TransactionClient, packageId: string) {
  const rows = await tx.questionPackageVersion.findMany({ where: { packageId }, select: { version: true } });
  const max = rows.reduce((n, row) => {
    const match = /^v(\d+)$/i.exec(row.version.trim());
    return match ? Math.max(n, Number(match[1])) : n;
  }, 0);
  return `v${max + 1}`;
}

export async function validateQuestionPackageVersion(versionId: string): Promise<PackageValidation> {
  const version = await prisma.questionPackageVersion.findUnique({
    where: { id: versionId },
    include: { package: { include: { testType: true } }, taxonomy: true, compositionRules: { include: { taxonomyNode: true } } },
  });
  if (!version) throw new Error("PACKAGE_VERSION_NOT_FOUND");

  const checks: PackageValidationCheck[] = [];
  checks.push({ key: "total-questions", label: "Total question count", status: version.totalQuestions > 0 ? "PASS" : "BLOCK", detail: `${version.totalQuestions} questions configured` });
  const productionTestType = ["RIASEC", "DISC", "EQ", "COGNITIVE"].includes(version.package.testType.code);
  checks.push({ key: "timer", label: "Time limit", status: version.timeLimitSeconds > 0 && (!productionTestType || version.timeLimitSeconds === 1200) ? "PASS" : "BLOCK", detail: productionTestType ? `${version.timeLimitSeconds} seconds configured / 1200 required` : `${version.timeLimitSeconds} seconds configured` });
  checks.push({ key: "taxonomy", label: "Taxonomy linkage", status: version.taxonomy && version.taxonomy.testTypeId === version.package.testTypeId ? "PASS" : "BLOCK", detail: version.taxonomy ? `${version.taxonomy.version}` : "Missing taxonomy" });

  const rules = version.compositionRules;
  const ruleSum = rules.reduce((sum, rule) => sum + rule.requiredCount, 0);
  checks.push({ key: "composition-present", label: "Composition rules", status: rules.length > 0 ? "PASS" : "BLOCK", detail: `${rules.length} composition rule(s)` });
  checks.push({ key: "composition-total", label: "Composition total", status: ruleSum === version.totalQuestions ? "PASS" : "BLOCK", detail: `${ruleSum} configured / ${version.totalQuestions} required` });
  checks.push({ key: "composition-positive", label: "Composition counts", status: rules.every((rule) => Number.isInteger(rule.requiredCount) && rule.requiredCount > 0) ? "PASS" : "BLOCK", detail: rules.every((rule) => rule.requiredCount > 0) ? "All counts are positive" : "One or more counts are invalid" });
  checks.push({ key: "composition-taxonomy", label: "Composition taxonomy", status: Boolean(version.taxonomy && rules.every((rule) => rule.taxonomyNode.taxonomyId === version.taxonomyVersionId)) ? "PASS" : "BLOCK", detail: version.taxonomy ? "All composition nodes belong to the selected taxonomy" : "Missing taxonomy linkage" });
  checks.push({ key: "composition-test-type", label: "Composition Test Type", status: Boolean(rules.every((rule) => rule.taxonomyNode.taxonomyId === version.taxonomyVersionId)) ? "PASS" : "BLOCK", detail: "Composition nodes are structurally linked to the package taxonomy" });

  return { status: checks.some((check) => check.status === "BLOCK") ? "BLOCKED" : "READY", checks };
}

export async function listQuestionPackages() {
  const rows = await prisma.questionPackage.findMany({
    include: {
      testType: true,
      versions: { orderBy: [{ updatedAt: "desc" }, { id: "desc" }], include: { compositionRules: { include: { taxonomyNode: true } }, taxonomy: true } },
    },
    orderBy: [{ testTypeId: "asc" }, { code: "asc" }],
  });
  return Promise.all(rows.map(async (row) => {
    const version = row.versions[0];
    return {
      id: row.id,
      code: row.code,
      name: row.name,
      description: row.description,
      testType: { id: row.testType.id, code: row.testType.code, name: row.testType.name },
      version: version ? {
        id: version.id,
        version: version.version,
        totalQuestions: version.totalQuestions,
        timeLimitSeconds: version.timeLimitSeconds,
        taxonomyVersionId: version.taxonomyVersionId,
        taxonomyVersion: version.taxonomy?.version ?? null,
        status: version.status,
        compositionRules: version.compositionRules.map((rule) => ({ id: rule.id, taxonomyNodeId: rule.taxonomyNodeId, code: rule.taxonomyNode.code, name: rule.taxonomyNode.name, requiredCount: rule.requiredCount })),
        validation: await validateQuestionPackageVersion(version.id),
        createdAt: version.createdAt.toISOString(),
        updatedAt: version.updatedAt.toISOString(),
      } : null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }));
}

export async function getQuestionPackage(id: string) {
  const row = await prisma.questionPackage.findUnique({
    where: { id },
    include: {
      testType: true,
      versions: { orderBy: [{ createdAt: "desc" }, { id: "desc" }], include: { compositionRules: { include: { taxonomyNode: true } }, taxonomy: true } },
    },
  });
  if (!row) return null;
  return {
    logical: row,
    versions: await Promise.all(row.versions.map(async (version) => ({
      ...version,
      validation: await validateQuestionPackageVersion(version.id),
    }))),
  };
}

export async function getQuestionPackageCatalog() {
  const [testTypes, taxonomies] = await Promise.all([
    prisma.testType.findMany({ where: { code: { in: ["DISC", "COGNITIVE", "EQ", "RIASEC"] } }, orderBy: { code: "asc" }, select: { id: true, code: true, name: true } }),
    prisma.taxonomyVersion.findMany({ where: { status: "ACTIVE", testType: { code: { in: ["DISC", "COGNITIVE", "EQ", "RIASEC"] } } }, include: { testType: true, nodes: { orderBy: [{ level: "asc" }, { code: "asc" }] } }, orderBy: [{ testTypeId: "asc" }, { version: "desc" }] }),
  ]);
  return { testTypes, taxonomies: taxonomies.map((taxonomy) => ({ id: taxonomy.id, testTypeId: taxonomy.testTypeId, testTypeCode: taxonomy.testType.code, version: taxonomy.version, nodes: taxonomy.nodes.map((node) => ({ id: node.id, code: node.code, name: node.name, nodeType: node.nodeType, level: node.level })) })) };
}

export async function createQuestionPackage(input: PackageInput, actorUserId: string) {
  const packageId = input.id?.trim() || `${input.code.trim().toLowerCase()}-package`;
  const version = input.version?.trim() || "v1";
  const result = await prisma.$transaction(async (tx) => {
    await validateInput(tx, input);
    const logical = await tx.questionPackage.create({ data: { id: packageId, testTypeId: input.testTypeId, code: input.code.trim(), name: input.name.trim(), description: input.description?.trim() || null } });
    const created = await tx.questionPackageVersion.create({
      data: {
        packageId: logical.id,
        version,
        totalQuestions: input.totalQuestions,
        timeLimitSeconds: input.timeLimitSeconds,
        taxonomyVersionId: input.taxonomyVersionId || null,
        status: QuestionPackageStatus.DRAFT,
        metadata: { configurationBoundary: "V13.1", historicalAttemptsImmutable: true },
        compositionRules: { create: input.compositionRules.map((rule) => ({ taxonomyNodeId: rule.taxonomyNodeId, requiredCount: rule.requiredCount })) },
      },
    });
    return { logical, version: created };
  });
  await auditContentOperation({ entityType: "QUESTION_PACKAGE_VERSION", entityId: result.version.id, action: "CREATE", toStatus: result.version.status, actorUserId, metadata: { packageId: result.logical.id, version } });
  return result;
}

export async function createQuestionPackageVersion(packageId: string, input: Omit<PackageInput, "id" | "testTypeId" | "code" | "name" | "description" | "version">, actorUserId: string) {
  return prisma.$transaction(async (tx) => {
    const logical = await tx.questionPackage.findUnique({ where: { id: packageId } });
    if (!logical) throw new Error("PACKAGE_NOT_FOUND");
    await validateInput(tx, { ...input, testTypeId: logical.testTypeId, code: logical.code, name: logical.name });
    const version = await nextVersion(tx, packageId);
    const created = await tx.questionPackageVersion.create({ data: { packageId, version, totalQuestions: input.totalQuestions, timeLimitSeconds: input.timeLimitSeconds, taxonomyVersionId: input.taxonomyVersionId || null, status: "DRAFT", metadata: { configurationBoundary: "V13.1", historicalAttemptsImmutable: true }, compositionRules: { create: input.compositionRules.map((rule) => ({ taxonomyNodeId: rule.taxonomyNodeId, requiredCount: rule.requiredCount })) } } });
    await auditContentOperation({ entityType: "QUESTION_PACKAGE_VERSION", entityId: created.id, action: "CREATE_VERSION", toStatus: created.status, actorUserId, metadata: { packageId, version } });
    return created;
  });
}

export async function publishQuestionPackageVersion(versionId: string, actorUserId: string) {
  const validation = await validateQuestionPackageVersion(versionId);
  if (validation.status === "BLOCKED") throw new Error("PACKAGE_CONFIGURATION_NOT_READY");

  // V13.9 hard boundary: a package may not be published when its configured
  // composition cannot be satisfied by currently eligible published questions.
  const eligibility = await evaluateQuestionPackageProductionEligibility(versionId);
  if (eligibility.status === "BLOCKED") throw new Error("PRODUCTION_ELIGIBILITY_NOT_READY");

  const result = await prisma.$transaction(async (tx) => {
    const current = await tx.questionPackageVersion.findUnique({ where: { id: versionId } });
    if (!current) throw new Error("PACKAGE_VERSION_NOT_FOUND");
    if (current.status === "ARCHIVED") throw new Error("ARCHIVED_VERSION");
    const previous = await tx.questionPackageVersion.findMany({ where: { packageId: current.packageId, status: "PUBLISHED", id: { not: current.id } }, select: { id: true } });
    await tx.questionPackageVersion.updateMany({ where: { packageId: current.packageId, status: "PUBLISHED", id: { not: current.id } }, data: { status: "ARCHIVED" } });
    const published = await tx.questionPackageVersion.update({ where: { id: versionId }, data: { status: "PUBLISHED", metadata: { ...(current.metadata && typeof current.metadata === "object" && !Array.isArray(current.metadata) ? current.metadata as Record<string, unknown> : {}), productionEligibility: eligibility } } });
    return { published, archivedPublishedVersions: previous.map((item) => item.id), previousStatus: current.status };
  });
  await auditContentOperation({ entityType: "QUESTION_PACKAGE_VERSION", entityId: versionId, action: "PUBLISH", fromStatus: result.previousStatus, toStatus: result.published.status, actorUserId, metadata: { archivedPublishedVersions: result.archivedPublishedVersions, productionEligibility: eligibility } });
  return result.published;
}

export async function archiveQuestionPackageVersion(versionId: string, actorUserId: string) {
  const current = await prisma.questionPackageVersion.findUnique({ where: { id: versionId } });
  if (!current) throw new Error("PACKAGE_VERSION_NOT_FOUND");
  if (current.status === "PUBLISHED") throw new Error("PUBLISHED_VERSION_CANNOT_ARCHIVE");
  const archived = await prisma.questionPackageVersion.update({ where: { id: versionId }, data: { status: "ARCHIVED" } });
  await auditContentOperation({ entityType: "QUESTION_PACKAGE_VERSION", entityId: versionId, action: "ARCHIVE", fromStatus: current.status, toStatus: archived.status, actorUserId });
  return archived;
}
