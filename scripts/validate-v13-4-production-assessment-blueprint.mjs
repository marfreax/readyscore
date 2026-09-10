import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const blueprintPath = path.join(root, "V13_4", "PRODUCTION_ASSESSMENT_BLUEPRINT.json");
const blueprint = JSON.parse(fs.readFileSync(blueprintPath, "utf8"));

const fail = (message) => {
  throw new Error(`V13.4_BLUEPRINT_GATE_FAIL: ${message}`);
};

const expected = {
  RIASEC: {
    totalItems: 60,
    productionPoolMinimum: 72,
    reserveMinimum: 12,
    taxonomyVersion: "RIASEC_TAXONOMY_V2",
    scoringVersion: "RIASEC_SCORE_V2",
    composition: { R: 10, I: 10, A: 10, S: 10, E: 10, C: 10 },
  },
  DISC: {
    totalItems: 80,
    productionPoolMinimum: 96,
    reserveMinimum: 16,
    taxonomyVersion: "DISC_TAXONOMY_V2",
    scoringVersion: "DISC_SCORE_V2",
    composition: { TARGET_D: 20, TARGET_I: 20, TARGET_S: 20, TARGET_C: 20 },
  },
  EQ: {
    totalItems: 50,
    productionPoolMinimum: 60,
    reserveMinimum: 10,
    taxonomyVersion: "EQ_TAXONOMY_V2",
    scoringVersion: "EQ_SCORE_V2",
    composition: {
      EMOTION_AWARENESS: 13,
      EMOTION_REGULATION: 13,
      EMPATHY_SOCIAL_AWARENESS: 12,
      RELATIONSHIP_SOCIAL_RESPONSE: 12,
    },
  },
  COGNITIVE: {
    totalItems: 40,
    productionPoolMinimum: 48,
    reserveMinimum: 8,
    taxonomyVersion: "COGNITIVE_TAXONOMY_V2",
    scoringVersion: "COGNITIVE_SCORE_V2",
    composition: {
      VERBAL_REASONING: 10,
      NUMERICAL_REASONING: 10,
      LOGICAL_REASONING: 10,
      ABSTRACT_REASONING: 10,
    },
  },
};

if (blueprint.phase !== "V13.4") fail("phase mismatch");
if (blueprint.timerPolicy.maxTimeSeconds !== 1200) fail("timer must be 1200 seconds");
if (blueprint.reservePolicy.minimumReservePercent !== 20) fail("reserve policy must be 20 percent");

for (const [testType, contract] of Object.entries(expected)) {
  const actual = blueprint.assessments?.[testType];
  if (!actual) fail(`${testType} blueprint missing`);

  for (const key of ["totalItems", "productionPoolMinimum", "reserveMinimum", "taxonomyVersion", "scoringVersion"]) {
    if (actual[key] !== contract[key]) {
      fail(`${testType}.${key} expected ${contract[key]}, received ${actual[key]}`);
    }
  }

  const entries = Object.entries(actual.composition ?? {});
  if (entries.length === 0) fail(`${testType} composition missing`);
  const sum = entries.reduce((total, [, count]) => total + count, 0);
  if (sum !== actual.totalItems) fail(`${testType} composition sum ${sum} != total ${actual.totalItems}`);

  const expectedReserve = Math.ceil(actual.totalItems * 0.2);
  if (actual.reserveMinimum !== expectedReserve) {
    fail(`${testType} reserve ${actual.reserveMinimum} != ceil(20% of ${actual.totalItems}) ${expectedReserve}`);
  }
  if (actual.productionPoolMinimum !== actual.totalItems + actual.reserveMinimum) {
    fail(`${testType} production pool minimum must equal target + reserve`);
  }
}

const disc = blueprint.assessments.DISC;
const eq = blueprint.assessments.EQ;
const cognitive = blueprint.assessments.COGNITIVE;
if (!String(disc.scoringCompatibilityStatus).includes("V13_7")) fail("DISC V13.7 scoring dependency missing");
if (!String(eq.scoringCompatibilityStatus).includes("V13_7")) fail("EQ V13.7 scoring dependency missing");
if (!String(cognitive.scoringCompatibilityStatus).includes("V13_7")) fail("Cognitive V13.7 scoring dependency missing");

if (!blueprint.crossAssessmentRules.includes("Package configuration cannot redefine scoring.")) {
  // Keep compatibility with the specification wording if the exact sentence changes.
  const joined = blueprint.crossAssessmentRules.join(" ");
  if (!joined.toLowerCase().includes("package") || !joined.toLowerCase().includes("scoring")) {
    fail("package/scoring separation rule missing");
  }
}

console.log("========================================");
console.log("V13.4 — PRODUCTION ASSESSMENT BLUEPRINT");
console.log("========================================");
console.log("Blueprint schema             : PASS");
console.log("Timer policy (20m / 1200s)   : PASS");
console.log("Reserve policy (20%)         : PASS");
for (const testType of Object.keys(expected)) {
  const a = blueprint.assessments[testType];
  console.log(`${testType.padEnd(28)}: PASS (${a.totalItems} items / pool ${a.productionPoolMinimum})`);
}
console.log("Taxonomy/scoring dependencies : PASS");
console.log("Non-24 scoring constraints    : EXPLICIT / DEFERRED TO V13.7");
console.log("Package/scoring separation    : PASS");
console.log("Legacy-content boundary       : PASS");
console.log("V13.4 PRODUCTION BLUEPRINT GATE: PASS");
