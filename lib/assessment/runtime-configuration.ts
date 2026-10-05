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
  WORK_ATTITUDE: "WORK_ATTITUDE",
  LEARNING_PREFERENCE: "LEARNING_PREFERENCE",
  PREMIUM: "LEGACY_DISABLED",
};

export const CLIENT_DISC_100_CONFIGURATION_ID = "disc-client-100-v1-config";

/** Resolves only the separately approved client DISC package; public runtime
 * configuration remains on the ordinary ACTIVE DISC version. */
export async function resolveClientDiscAssessmentConfiguration(
  configurationVersionId = CLIENT_DISC_100_CONFIGURATION_ID,
): Promise<RuntimeAssessmentConfiguration> {
  const row = await prisma.assessmentConfigurationVersion.findUnique({
    where: { id: configurationVersionId },
    include: {
      configuration: true,
      questionPackageVersion: {
        include: {
          package: { include: { testType: true } },
          taxonomy: true,
          compositionRules: { include: { taxonomyNode: true } },
        },
      },
    },
  });
  const metadata = row?.metadata && typeof row.metadata === "object" && !Array.isArray(row.metadata)
    ? row.metadata as Record<string, unknown>
    : {};
  const packageVersion = row?.questionPackageVersion;
  const packageMetadata = packageVersion?.metadata && typeof packageVersion.metadata === "object" && !Array.isArray(packageVersion.metadata)
    ? packageVersion.metadata as Record<string, unknown>
    : {};
  const composition = packageVersion?.compositionRules ?? [];
  const requiredByCode = new Map(composition.map((rule) => [rule.taxonomyNode.code, rule.requiredCount]));
  const totalRequired = composition.reduce((sum, rule) => sum + rule.requiredCount, 0);

  if (
    !row ||
    row.configuration.assessmentType !== "DISC" ||
    row.status !== "APPROVED" ||
    metadata.clientOnly !== true ||
    row.questionCount !== 100 ||
    !packageVersion ||
    packageVersion.status !== "PUBLISHED" ||
    packageMetadata.clientOnly !== true ||
    packageVersion.totalQuestions !== 100 ||
    packageVersion.timeLimitSeconds <= 1200 ||
    !packageVersion.taxonomy ||
    packageVersion.taxonomy.status !== "ACTIVE" ||
    packageVersion.taxonomy.version !== row.taxonomyVersion ||
    packageVersion.taxonomy.testTypeId !== packageVersion.package.testTypeId ||
    packageVersion.package.testType.code !== EXPECTED_PACKAGE_TEST_TYPE.DISC ||
    totalRequired !== 100 ||
    composition.length !== 4 ||
    ["TARGET_D", "TARGET_I", "TARGET_S", "TARGET_C"].some((code) => requiredByCode.get(code) !== 25)
  ) {
    throw new Error("CLIENT_DISC_PACKAGE_NOT_READY");
  }
  return row as RuntimeAssessmentConfiguration;
}

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
