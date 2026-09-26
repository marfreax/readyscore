import fs from "node:fs";

const read = (p) => fs.readFileSync(p, "utf8");
const fail = (m) => {
  console.error(`V17.10 RUNTIME ALIGNMENT GATE — FAIL: ${m}`);
  process.exit(1);
};
const pass = (m) => console.log(`✓ ${m}`);

const schema = read("prisma/schema.prisma");
const runtime = read("lib/assessment/runtime-service.ts");
const resolver = read("lib/assessment/runtime-configuration.ts");
const pkg = read("lib/question-package-runtime.ts");
const repo = read("lib/assessment/assessment-repository.ts");
const unified = read("lib/assessment/unified-engine.ts");
const runtimeContract = read("lib/assessment/runtime-contract.ts");
const adminRepo = read("lib/assessment-configuration-repository.ts");
const alignment = read("scripts/v17-10-align-runtime-data.mjs");
const preflight = read("scripts/v17-10-runtime-preflight.mjs");
const finish = read("scripts/v17-10-1-finish.mjs");

const migrationDir = "prisma/migrations/20260924090000_v17_10_runtime_alignment";

if (!fs.existsSync(`${migrationDir}/migration.sql`)) {
  fail("V17.10 migration missing");
}
pass("additive V17.10 migration exists");

for (const marker of [
  "questionPackageVersionId   String?",
  "questionPackageVersion QuestionPackageVersion?",
]) {
  if (!schema.includes(marker)) {
    fail(`schema relation missing: ${marker}`);
  }
}
pass("configuration and attempt package identity relations detected");

if (
  runtime.includes('import { ASSESSMENT_CONFIG') ||
  runtime.includes("ASSESSMENT_CONFIG[type]")
) {
  fail("runtime-service still uses ASSESSMENT_CONFIG as authority");
}
pass("assessment start no longer uses static ASSESSMENT_CONFIG");

if (!runtime.includes("resolveActiveAssessmentConfiguration")) {
  fail("assessment start does not resolve active DB configuration");
}
pass("assessment start resolves active DB configuration");

if (
  !resolver.includes('status: "ACTIVE"') ||
  !resolver.includes("questionPackageVersion")
) {
  fail("canonical runtime resolver incomplete");
}

if (
  !adminRepo.includes("Runtime package linkage") ||
  !adminRepo.includes("Runtime package state") ||
  !adminRepo.includes("ensureRuntimePackage")
) {
  fail(
    "assessment configuration governance does not enforce/link internal runtime package contract"
  );
}
pass(
  "assessment configuration governance enforces and auto-links the runtime package contract"
);
pass("canonical active configuration + package resolver detected");

for (const marker of ["RIASEC_FREE", "TEST_TYPE"]) {
  if (!pkg.includes(marker)) {
    fail(`package selection scope missing: ${marker}`);
  }
}

if (pkg.includes("PREMIUM_GLOBAL")) {
  fail("Premium package scope must not be part of current runtime architecture");
}
pass("Free and five-assessment package selection scopes detected");

if (
  !pkg.includes("config.selectionAlgorithmVersion") ||
  !pkg.includes("version.totalQuestions")
) {
  fail("package runtime is not configuration-aware");
}

if (
  pkg.includes(
    "metadata.runtimeAssessmentType !== expectedAssessmentType.toUpperCase()"
  )
) {
  fail("package runtime still requires metadata as the primary assessment identity");
}

if (
  unified.includes("const QUESTION_COUNTS") ||
  unified.includes("QUESTION_COUNTS[assessmentType]")
) {
  fail("unified scoring adapter still owns static runtime question counts");
}

if (!unified.includes("context.metadata.questionCount")) {
  fail("unified scoring adapter does not consume frozen DB question count");
}

if (!runtimeContract.includes("questionCount: null")) {
  fail("runtime contract still defines static question counts");
}
pass("package runtime consumes DB configuration/package contract");

if (
  !repo.includes(
    "questionPackageVersionId: input.questionPackageVersionId ?? null"
  )
) {
  fail("attempt persistence does not freeze package identity");
}
pass("attempt persistence freezes QuestionPackageVersion identity");

if (runtime.includes("selectQuestions(type, attemptSeed)")) {
  fail("legacy question-engine selector remains on primary assessment start path");
}
pass("primary assessment start no longer calls legacy hardcoded selector");

if (
  !alignment.includes("prisma.$transaction") ||
  !alignment.includes(
    "Preflight is performed before any configuration/package activation"
  )
) {
  fail("runtime alignment is not transactionally guarded");
}
pass("runtime alignment is transactionally guarded");

/*
 * The alignment implementation resolves taxonomy from the selected active
 * configuration and then reassigns the resolved configuration:
 *
 *   let active = config.versions.find(...)
 *   const resolved = await resolveRuntimeTaxonomy(tx, type, active)
 *   active = resolved.active
 *
 * The previous gate incorrectly required an unrelated implementation detail:
 *
 *   let active=await tx.assessmentConfigurationVersion.findFirst
 *
 * That assertion was a false negative. Freeze the actual contract instead:
 * active configuration must remain mutable after taxonomy resolution and the
 * resolved active identity must be carried into package creation.
 */

if (!alignment.includes("let active=config.versions.find")) {
  fail("runtime alignment does not maintain a mutable active configuration binding");
}

if (
  !alignment.includes(
    "const resolved=await resolveRuntimeTaxonomy(tx,type,active)"
  )
) {
  fail(
    "runtime alignment does not resolve taxonomy from the selected active configuration"
  );
}

if (!alignment.includes("active=resolved.active")) {
  fail(
    "runtime alignment does not reassign the resolved active configuration after taxonomy resolution"
  );
}

if (
  alignment.includes(
    "const active=await tx.assessmentConfigurationVersion.findFirst"
  )
) {
  fail(
    "runtime alignment contains immutable active configuration binding regression"
  );
}

if (!alignment.includes('FREE:"RIASEC"')) {
  fail("Free runtime group mapping missing");
}

if (!alignment.includes('COGNITIVE:"IQ_COGNITIVE"')) {
  fail("Cognitive runtime group mapping missing");
}

if (!alignment.includes('status:"PUBLISHED"')) {
  fail("runtime package creation must publish only validated internal packages");
}

if (!alignment.includes("pkg.versions?.length??0")) {
  fail(
    "runtime package version creation must tolerate newly-created package records without loaded versions"
  );
}

pass(
  "runtime alignment uses mutable active binding, canonical group mapping, and published-only package creation"
);

if (
  !preflight.includes("READ ONLY") ||
  !preflight.includes("ACTIVE configuration")
) {
  fail("runtime preflight contract missing");
}

if (preflight.includes("findUnique({ where: { assessmentType")) {
  fail("runtime preflight uses non-unique assessmentType as a unique lookup");
}

if (
  !preflight.includes("assessmentConfiguration.findMany") ||
  !preflight.includes("where:{assessmentType:type}")
) {
  fail("runtime preflight does not use a safe assessmentType-scoped lookup");
}

if (
  !preflight.includes("assessmentConfigurationVersion.findUnique") ||
  !preflight.includes("where:{id:active.id}")
) {
  fail(
    "runtime preflight does not resolve the selected configuration version by stable ID"
  );
}

if (
  !preflight.includes("READY_TO_ALIGN") ||
  preflight.includes("PREMIUM")
) {
  fail(
    "runtime preflight still contains Premium or lacks alignment readiness state"
  );
}
pass("read-only runtime preflight detected");

if (
  !finish.includes("V17.10.1 RUNTIME LINK FINISH") ||
  !finish.includes("no automatic inference permitted")
) {
  fail("V17.10.1 finish/link safety contract missing");
}
pass("V17.10.1 runtime-link finishing contract detected");

console.log("\nV17.10 RUNTIME ALIGNMENT & CONFIGURATION MIGRATION GATE — PASS");
console.log("No production changes are performed by this phase.");
