import { AssessmentType, Prisma } from "@prisma/client";
import { prisma } from "../db/prisma";

export type RuntimeAssessmentConfiguration = Prisma.AssessmentConfigurationVersionGetPayload<{
  include: { configuration: true; questionPackageVersion: { include: { package: { include: { testType: true } }; taxonomy: true; compositionRules: { include: { taxonomyNode: true } } } } };
}>;

const EXPECTED_PACKAGE_TEST_TYPE: Record<AssessmentType, string> = {
  FREE: "RIASEC",
  RIASEC: "RIASEC",
  DISC: "DISC",
  EQ: "EQ",
  COGNITIVE: "COGNITIVE",
  PREMIUM: "LEGACY_DISABLED",
};

export async function resolveActiveAssessmentConfiguration(type: AssessmentType): Promise<RuntimeAssessmentConfiguration> {
  if (type === "PREMIUM") throw new Error("ASSESSMENT_TYPE_NOT_SUPPORTED:premium");
  const row = await prisma.assessmentConfigurationVersion.findFirst({
    where: { configuration: { assessmentType: type }, status: "ACTIVE" },
    include: {
      configuration: true,
      questionPackageVersion: { include: { package: { include: { testType: true } }, taxonomy: true, compositionRules: { include: { taxonomyNode: true } } } },
    },
    orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
  });
  if (!row) throw new Error(`ASSESSMENT_CONFIGURATION_NOT_ACTIVE:${type}`);
  if (!row.questionPackageVersion) throw new Error(`ASSESSMENT_PACKAGE_NOT_LINKED:${type}`);
  if (row.questionPackageVersion.status !== "PUBLISHED") throw new Error(`ASSESSMENT_PACKAGE_NOT_PUBLISHED:${type}`);
  if (row.questionCount !== row.questionPackageVersion.totalQuestions) throw new Error(`ASSESSMENT_PACKAGE_COUNT_MISMATCH:${type}`);
  if (row.questionPackageVersion.package.testType.code !== EXPECTED_PACKAGE_TEST_TYPE[type]) {
    throw new Error(`ASSESSMENT_PACKAGE_TEST_TYPE_MISMATCH:${type}`);
  }
  if (!row.questionPackageVersion.taxonomy || row.questionPackageVersion.taxonomy.status !== "ACTIVE") {
    throw new Error(`ASSESSMENT_PACKAGE_TAXONOMY_NOT_ACTIVE:${type}`);
  }
  if (row.questionPackageVersion.taxonomy.version !== row.taxonomyVersion) {
    throw new Error(`ASSESSMENT_PACKAGE_TAXONOMY_VERSION_MISMATCH:${type}`);
  }
  if (!row.questionPackageVersion.compositionRules.length) {
    throw new Error(`ASSESSMENT_PACKAGE_COMPOSITION_MISSING:${type}`);
  }
  const compositionTotal = row.questionPackageVersion.compositionRules.reduce((sum, rule) => sum + rule.requiredCount, 0);
  if (compositionTotal !== row.questionCount) {
    throw new Error(`ASSESSMENT_PACKAGE_COMPOSITION_TOTAL_MISMATCH:${type}`);
  }
  return row;
}
