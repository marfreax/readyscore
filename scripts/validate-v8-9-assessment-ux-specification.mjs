import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const fail = (message) => { throw new Error(`V8.9 Assessment UX check failed: ${message}`); };
const assert = (condition, message) => { if (!condition) fail(message); };
const readJson = (file) => JSON.parse(fs.readFileSync(path.join(root, file), "utf8"));
const readText = (file) => fs.readFileSync(path.join(root, file), "utf8");

const specPath = "data/assessment-audit/V8_9_ASSESSMENT_UX_SPECIFICATION.json";
assert(fs.existsSync(path.join(root, specPath)), "V8.9 UX specification artifact is missing");
const spec = readJson(specPath);
const v88 = readJson("data/assessment-audit/V8_8_RESULT_SEMANTICS_INTERPRETATION.json");
const pkg = readJson("package.json");

assert(spec.version === "V8.9", "V8.9 artifact version is invalid");
assert(spec.status === "LOCKED", "V8.9 artifact must be LOCKED");
assert(spec.scope === "assessment_ux_specification", "V8.9 scope is invalid");
assert(spec.databaseMigration === false, "V8.9 must not introduce a database migration");
assert(spec.measurementMutation === false, "V8.9 must not mutate measurement semantics");
assert(spec.scoringMutation === false, "V8.9 must not mutate scoring semantics");
assert(spec.resultSemanticsMutation === false, "V8.9 must not mutate result semantics");
assert(spec.implementationPhase === "V8.9 specification only; customer implementation begins in V8.10", "V8.9 implementation boundary is invalid");

assert(v88.version === "V8.8" && v88.status === "IMPLEMENTED", "V8.8 result semantics baseline is not available");
assert(v88.universalScore === false, "V8.8 universal-score safety baseline changed");
assert(v88.rawAverageSynthesis === false, "V8.8 raw-average safety baseline changed");

const journey = ["ASSESSMENTS","ASSESSMENT_CARD","ABOUT_ASSESSMENT","PRE_TEST","TEST","RESULT","PROFILE_REPORT_NEXT_ACTION"];
assert(JSON.stringify(spec.journey) === JSON.stringify(journey), "customer journey order is invalid");

const surfaces = spec.surfaces;
for (const key of ["catalog","about","preTest","test","result","profileReportNextAction"]) {
  assert(surfaces[key] && typeof surfaces[key] === "object", `UX surface missing: ${key}`);
}

const requiredCatalog = ["what_this_assessment_is","what_it_measures","why_take_it","what_user_gets","duration","question_count","access_state"];
assert(JSON.stringify(surfaces.catalog.requiredContent) === JSON.stringify(requiredCatalog), "assessment-card content contract is invalid");
assert(surfaces.preTest.assessmentSpecificInstruction === true, "pre-test must use assessment-specific instructions");
assert(surfaces.result.requiredQuestions.length === 4, "result must answer four customer questions");

const expected = {
  COGNITIVE: ["OBJECTIVE_SINGLE_CHOICE_4","Cognitive Score","COGNITIVE_RESULT_V2","COGNITIVE_SCORE_V2","COGNITIVE_INTERPRETATION_V2"],
  EQ: ["SCENARIO_SINGLE_CHOICE_4","EQ Score","EQ_RESULT_V2","EQ_SCORE_V2","EQ_INTERPRETATION_V2"],
  DISC: ["SITUATIONAL_FORCED_CHOICE_4","Primary Behavioral Pattern","DISC_RESULT_V2","DISC_SCORE_V2","DISC_INTERPRETATION_V2"],
  RIASEC: ["PREFERENCE_LIKERT_5","RIASEC Interest Profile","RIASEC_RESULT_V2","RIASEC_SCORE_V2","RIASEC_INTERPRETATION_V2"],
};
for (const [test, values] of Object.entries(expected)) {
  const ux = spec.assessmentUx?.[test];
  const semantic = v88.assessments?.[test];
  assert(ux, `${test} UX model is missing`);
  assert(semantic, `${test} V8.8 semantic model is missing`);
  assert(ux.responseModel === values[0], `${test} response model is invalid`);
  assert(ux.resultMain === values[1], `${test} result main label is invalid`);
  assert(ux.resultContract === values[2], `${test} result contract is misaligned`);
  assert(ux.scoringVersion === values[3], `${test} scoring version is misaligned`);
  assert(ux.interpretationVersion === values[4], `${test} interpretation version is misaligned`);
  assert(JSON.stringify(ux.dimensions) === JSON.stringify(semantic.dimensions), `${test} dimensions diverge from V8.8 semantics`);
}

assert(spec.assessmentUx.COGNITIVE.customerTerminology.prohibited.includes("IQ"), "Cognitive IQ prohibition missing");
assert(spec.assessmentUx.EQ.customerTerminology.prohibited.includes("clinical diagnosis"), "EQ clinical prohibition missing");
assert(spec.assessmentUx.DISC.customerTerminology.prohibited.includes("universal score"), "DISC universal-score prohibition missing");
assert(spec.assessmentUx.RIASEC.customerTerminology.prohibited.includes("guaranteed career fit"), "RIASEC guaranteed-fit prohibition missing");

for (const rule of ["assessmentSpecificUx","doNotForceCommonResponseModel","doNotExposeInternalScoringMetadata","doNotCreateUniversalScore","doNotUseRawAverageSynthesis","historicalQuestionVersionsRemainImmutable","measurementIsNotOptimizedForUi"]) {
  assert(spec.globalPrinciples?.[rule] === true, `global UX safety rule missing: ${rule}`);
}

for (const rule of ["keyboardOperable","visibleFocus","semanticControls","screenReaderLabels","statusAndProgressAnnounced","colorNotSoleIndicator","touchTargetAdequate"]) {
  assert(spec.accessibility?.[rule] === true, `accessibility rule missing: ${rule}`);
}
for (const rule of ["mobileFirst","desktopSupported","noHorizontalOverflow","preserveAssessmentContext"]) {
  assert(spec.responsive?.[rule] === true, `responsive rule missing: ${rule}`);
}

assert(spec.contentGovernance?.claimsMustFollowV8_8 === true, "V8.8 claim governance boundary missing");
assert(spec.contentGovernance?.internalMetadataHidden === true, "internal metadata exposure boundary missing");
assert(spec.contentGovernance?.customerCopyCannotChangeMeasurementMeaning === true, "customer-copy measurement boundary missing");
assert(spec.contentGovernance?.noUnsupportedPsychometricClaims === true, "unsupported psychometric-claim boundary missing");

const protectedSources = [
  "components/assessment/AssessmentRunner.tsx",
  "app/assessments/page.tsx",
  "lib/assessment/unified-engine.ts",
  "lib/assessment/result/semantics-v1.ts"
];
for (const file of protectedSources) assert(fs.existsSync(path.join(root,file)), `protected UX/assessment source missing: ${file}`);

const runner = readText("components/assessment/AssessmentRunner.tsx");
assert(runner.includes("isRiasec") && runner.includes("isDisc") && runner.includes("isEq") && runner.includes("isCognitive"), "assessment-specific runtime branches are missing");
assert(runner.includes("Sangat Tidak Sesuai") && runner.includes("Sangat Sesuai"), "Likert response labels are missing from runtime");
assert(runner.includes("question.options"), "item-specific option rendering boundary is missing");
assert(runner.includes("/api/assessment/") && runner.includes("/submit"), "assessment persistence/submit boundary is missing");
assert(!runner.includes("scoringKey") && !runner.includes("correctOption"), "internal answer/scoring metadata must not be exposed by customer runner");

const catalog = readText("app/assessments/page.tsx");
assert(catalog.includes("Assessment Anda") && catalog.includes("Assessment yang tersedia"), "assessment catalog surface is missing");
assert(catalog.includes("status === \"Locked\"") && catalog.includes("Lihat paket"), "catalog access-state UX is missing");

const migrationRoot = path.join(root, "prisma/migrations");
if (fs.existsSync(migrationRoot)) {
  const migrations = fs.readdirSync(migrationRoot);
  assert(!migrations.some((name) => /v8[_-]?9|v8\.9|v8_9/i.test(name)), "V8.9 must not introduce a database migration");
}
assert(!Object.keys(pkg.scripts ?? {}).some((key) => key === "v8:9:migrate"), "No V8.9 migration script may be registered");
assert(pkg.scripts?.["v8:9:gate"] === "node scripts/validate-v8-9-assessment-ux-specification.mjs", "V8.9 gate script is not registered correctly");

console.log("PASS: V8.9 assessment UX specification artifact is present");
console.log("PASS: V8.8 result semantics baseline is preserved");
console.log("PASS: Customer journey and six UX surfaces are locked");
console.log("PASS: Four assessment-specific response models are represented");
console.log("PASS: Result/scoring/interpretation version alignment is preserved");
console.log("PASS: Customer terminology and claim governance are locked");
console.log("PASS: Internal scoring/answer metadata remains hidden");
console.log("PASS: Accessibility and responsive UX requirements are locked");
console.log("PASS: Existing assessment runtime boundaries are protected");
console.log("PASS: V8.9 contains no measurement, scoring, or result-semantic mutation");
console.log("PASS: No V8.9 database migration introduced");
console.log("V8.9 ASSESSMENT UX SPECIFICATION CONTRACT GATE: PASS");
