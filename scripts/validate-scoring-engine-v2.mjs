import { calculateRuntimeAssessmentResult, listScoringEngines } from "../lib/assessment/scoring/engine-v2";

const fail = (message) => {
  throw new Error(message);
};

console.log("=== READY SCORE V3 PHASE 3.4 SCORING ENGINE V2 GATE ===");
console.log("Scope      : Test-Type-specific scoring engine / scoring model identity / version boundary");
console.log("Protection : F.10-C.2-F RIASEC scoring semantics remain unchanged");

const engines = listScoringEngines();
const riasec = engines.find((engine) => engine.testType === "RIASEC");
if (!riasec) fail("RIASEC_SCORING_ENGINE_MISSING");
if (riasec.modelId !== "RIASEC_SCORE") fail(`RIASEC_SCORING_MODEL_MISMATCH: ${riasec.modelId}`);
if (riasec.version !== "RIASEC_SCORE_V1") fail(`RIASEC_SCORING_VERSION_MISMATCH: ${riasec.version}`);

const questions = ["R","I","A","S","E","C"].flatMap((dimension) =>
  Array.from({ length: 10 }, (_, index) => ({
    id: `q-${dimension}-${index + 1}`,
    code: `RIASEC-${dimension}-${index + 1}`,
    text: `Question ${dimension}-${index + 1}`,
    domain: dimension,
    subdomain: null,
    indicator: null,
    type: "LIKERT",
    answerType: "LIKERT_5",
    scale: [1,2,3,4,5],
    reverseScore: false,
    scoringKey: [1,2,3,4,5],
    weight: 1,
    difficulty: "MEDIUM",
    status: "PUBLISHED",
    mappingStatus: "APPROVED",
    version: "1",
  })),
);

const answers = questions.map((question) => ({
  questionId: question.id,
  value: 5,
}));

const result = calculateRuntimeAssessmentResult(
  "riasec",
  questions,
  answers,
  {
    attemptId: "phase-3-4-gate",
    assessmentConfigurationVersion: "RIASEC_CONFIG_V1",
    questionBankVersion: "RIASEC_QB_V1",
    taxonomyVersion: "RIASEC_TAXONOMY_V1",
    scoringVersion: "RIASEC_SCORE_V1",
    completedAt: new Date(0).toISOString(),
  },
);

if (!result.riasec) fail("RIASEC_RESULT_ADAPTER_MISSING");
if (result.riasec.contractVersion !== "RIASEC_RESULT_V1") {
  fail(`RIASEC_RESULT_CONTRACT_MISMATCH: ${result.riasec.contractVersion}`);
}
if (result.riasec.measurement.scoringVersion !== "RIASEC_SCORE_V1") {
  fail("RIASEC_MEASUREMENT_SCORING_VERSION_MISMATCH");
}
if (result.riasec.measurement.topCode !== "RIA") {
  fail(`RIASEC_TOP_CODE_MISMATCH: ${result.riasec.measurement.topCode}`);
}
if (result.riasec.measurement.dimensionScores.some((score) => score.score !== 100)) {
  fail("RIASEC_SCORE_SEMANTICS_MISMATCH");
}
if (result.scoringVersion !== "RIASEC_SCORE_V1") {
  fail("GENERIC_RESULT_SCORING_VERSION_MISMATCH");
}

console.log(`Registered engines: ${engines.length}`);
console.log(`RIASEC model      : ${riasec.modelId}`);
console.log(`RIASEC version    : ${riasec.version}`);
console.log("Test-Type dispatch : PASS");
console.log("Scoring model identity: PASS");
console.log("Scoring version boundary: PASS");
console.log("RIASEC 6-dimension scoring: PASS");
console.log("RIASEC_RESULT_V1 preservation: PASS");
console.log("F.10-C.2-F scoring semantics: PRESERVED");
console.log("F.3.4 SCORING ENGINE V2 GATE: PASS");
