import { AssessmentConfigurationStatus, AssessmentType, Prisma } from "@prisma/client";
import { prisma } from "./db/prisma";

export type AdminAssessmentConfiguration = {
  id: string;
  code: string;
  name: string;
  assessmentType: AssessmentType;
  description: string | null;
  versionId: string;
  version: string;
  questionBankVersion: string;
  taxonomyVersion: string;
  scoringVersion: string;
  selectionAlgorithmVersion: string;
  questionCount: number;
  status: AssessmentConfigurationStatus;
  createdAt: string;
  updatedAt: string;
};

type ConfigurationRow = Prisma.AssessmentConfigurationGetPayload<{ include: { versions: true } }>;

function mapRow(row: ConfigurationRow): AdminAssessmentConfiguration | null {
  const versions = [...row.versions].sort((a,b) => {
    if (a.status === "ACTIVE" && b.status !== "ACTIVE") return -1;
    if (b.status === "ACTIVE" && a.status !== "ACTIVE") return 1;
    return b.createdAt.getTime() - a.createdAt.getTime();
  });
  const v = versions[0];
  if (!v) return null;
  return {
    id: row.id, code: row.code, name: row.name, assessmentType: row.assessmentType,
    description: row.description, versionId: v.id, version: v.version,
    questionBankVersion: v.questionBankVersion, taxonomyVersion: v.taxonomyVersion,
    scoringVersion: v.scoringVersion, selectionAlgorithmVersion: v.selectionAlgorithmVersion,
    questionCount: v.questionCount, status: v.status,
    createdAt: row.createdAt.toISOString(), updatedAt: v.updatedAt.toISOString(),
  };
}

async function load() {
  return prisma.assessmentConfiguration.findMany({
    include: { versions: { orderBy: [{ updatedAt: "desc" }, { id: "desc" }] } },
    orderBy: [{ assessmentType: "asc" }, { code: "asc" }],
  });
}

export async function listAssessmentConfigurations() {
  return (await load()).map(mapRow).filter((x): x is AdminAssessmentConfiguration => Boolean(x));
}

export async function getAssessmentConfiguration(id: string) {
  const row = await prisma.assessmentConfiguration.findUnique({
    where: { id },
    include: { versions: { orderBy: [{ createdAt: "desc" }, { id: "desc" }] } },
  });
  return row ? { logical: row, versions: row.versions.map(v => ({
    id: v.id, version: v.version, questionBankVersion: v.questionBankVersion,
    taxonomyVersion: v.taxonomyVersion, scoringVersion: v.scoringVersion,
    selectionAlgorithmVersion: v.selectionAlgorithmVersion, questionCount: v.questionCount,
    status: v.status, createdAt: v.createdAt.toISOString(), updatedAt: v.updatedAt.toISOString(),
  })) } : null;
}

async function nextVersion(tx: Prisma.TransactionClient, configurationId: string) {
  const rows = await tx.assessmentConfigurationVersion.findMany({
    where: { configurationId },
    select: { version: true },
  });
  const max = rows.reduce((n, r) => {
    const match = /^v(\d+)$/i.exec(r.version.trim());
    return match ? Math.max(n, Number(match[1])) : n;
  }, 0);
  return `v${max + 1}`;
}

type Input = {
  id?: string; code: string; name: string; assessmentType: AssessmentType; description?: string | null;
  version?: string; questionBankVersion: string; taxonomyVersion: string; scoringVersion: string;
  selectionAlgorithmVersion: string; questionCount: number;
};

export async function createConfiguration(input: Input) {
  if (!input.code.trim() || !input.name.trim()) throw new Error("INVALID_CONFIGURATION");
  if (!Number.isInteger(input.questionCount) || input.questionCount <= 0) throw new Error("INVALID_QUESTION_COUNT");
  const id = input.id?.trim() || `${input.code.trim().toLowerCase()}-config`;
  const version = input.version?.trim() || "v1";
  return prisma.$transaction(async tx => {
    const logical = await tx.assessmentConfiguration.create({
      data: { id, code: input.code.trim(), name: input.name.trim(), assessmentType: input.assessmentType, description: input.description?.trim() || null },
    });
    const v = await tx.assessmentConfigurationVersion.create({
      data: { configurationId: logical.id, version, questionBankVersion: input.questionBankVersion.trim(),
        taxonomyVersion: input.taxonomyVersion.trim(), scoringVersion: input.scoringVersion.trim(),
        selectionAlgorithmVersion: input.selectionAlgorithmVersion.trim(), questionCount: input.questionCount,
        status: "ACTIVE" },
    });
    return { logical, version: v };
  });
}

export async function createConfigurationVersion(id: string, input: Omit<Input, "id" | "code" | "name" | "assessmentType">) {
  if (!Number.isInteger(input.questionCount) || input.questionCount <= 0) throw new Error("INVALID_QUESTION_COUNT");
  return prisma.$transaction(async tx => {
    const logical = await tx.assessmentConfiguration.findUnique({ where: { id } });
    if (!logical) throw new Error("CONFIGURATION_NOT_FOUND");
    const version = await nextVersion(tx, id);
    const v = await tx.assessmentConfigurationVersion.create({
      data: { configurationId: id, version, questionBankVersion: input.questionBankVersion.trim(),
        taxonomyVersion: input.taxonomyVersion.trim(), scoringVersion: input.scoringVersion.trim(),
        selectionAlgorithmVersion: input.selectionAlgorithmVersion.trim(), questionCount: input.questionCount,
        status: "DRAFT" },
    });
    return { logical, version: v };
  });
}

export async function activateConfigurationVersion(versionId: string) {
  return prisma.$transaction(async tx => {
    const current = await tx.assessmentConfigurationVersion.findUnique({ where: { id: versionId }, include: { configuration: true } });
    if (!current) throw new Error("VERSION_NOT_FOUND");
    if (current.status === "ARCHIVED") throw new Error("ARCHIVED_VERSION");
    await tx.assessmentConfigurationVersion.updateMany({
      where: { configurationId: current.configurationId, status: "ACTIVE" },
      data: { status: "ARCHIVED" },
    });
    return tx.assessmentConfigurationVersion.update({ where: { id: versionId }, data: { status: "ACTIVE" } });
  });
}

export async function archiveConfigurationVersion(versionId: string) {
  const current = await prisma.assessmentConfigurationVersion.findUnique({ where: { id: versionId } });
  if (!current) throw new Error("VERSION_NOT_FOUND");
  if (current.status === "ACTIVE") throw new Error("ACTIVE_VERSION_CANNOT_ARCHIVE");
  return prisma.assessmentConfigurationVersion.update({ where: { id: versionId }, data: { status: "ARCHIVED" } });
}

export async function getAssessmentConfigurationStats() {
  const [logical, versions, active] = await Promise.all([
    prisma.assessmentConfiguration.count(),
    prisma.assessmentConfigurationVersion.count(),
    prisma.assessmentConfigurationVersion.count({ where: { status: "ACTIVE" } }),
  ]);
  return { logical, versions, active };
}
