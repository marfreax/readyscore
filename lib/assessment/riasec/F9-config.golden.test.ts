import { ASSESSMENT_CONFIG } from "../../../lib/assessment-config";

if (ASSESSMENT_CONFIG.riasec.questionCount !== 60) {
  throw new Error("RIASEC must contain 60 questions.");
}
if (ASSESSMENT_CONFIG.riasec.version !== "RIASEC_CONFIG_V1") {
  throw new Error("RIASEC configuration version mismatch.");
}
if (ASSESSMENT_CONFIG.riasec.scoringVersion !== "RIASEC_SCORE_V1") {
  throw new Error("RIASEC scoring version mismatch.");
}
if (ASSESSMENT_CONFIG.riasec.selectionAlgorithmVersion !== "RIASEC_SELECTION_V1") {
  throw new Error("RIASEC selection algorithm version mismatch.");
}

console.log("RIASEC_F9_CONFIG_TEST passed.");
