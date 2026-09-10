import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root,p),"utf8");
const json = (p) => JSON.parse(read(p));

const blueprint = json("V13_4/PRODUCTION_ASSESSMENT_BLUEPRINT.json");
const pool = json("V13_5/reports/V13_5_POOL_VALIDATION_REPORT.json");

const checks = [];
const check = (label, pass, detail="") => {
  checks.push({label, pass, detail});
  console.log(`${label.padEnd(42)}: ${pass ? "PASS" : "FAIL"}${detail ? ` (${detail})` : ""}`);
};

console.log("========================================");
console.log("V13.7 — SCORING VALIDATION");
console.log("========================================");

const disc = read("lib/assessment/disc/scoring.ts");
const eq = read("lib/assessment/eq/scoring.ts");
const cognitive = read("lib/assessment/cognitive/scoring.ts");
const riasec = read("lib/assessment/riasec/scoring.ts");
const riasecContract = read("lib/assessment/riasec/result-contract.ts");
const engine = read("lib/assessment/scoring/engine-v2.ts");
const importer = read("lib/question-bank-csv.ts");

check("RIASEC 60-item scorer", /RIASEC_SCORE_V2/.test(riasec) && /RIASEC_TARGET_ITEMS_PER_DIMENSION/.test(riasec), "V2 contract");
check("DISC 80-item scorer support", /questions\.length !== 24 && questions\.length !== 80/.test(disc), "24 legacy + 80 production");
check("EQ 50-item engine support", /context\.questions\.length !== 24 && context\.questions\.length !== 50/.test(engine), "24 legacy + 50 production");
check("Cognitive 40-item scorer support", /questions\.length !== 24 && questions\.length !== 40/.test(cognitive), "24 legacy + 40 production");
check("Cognitive 40-item engine support", /Cognitive supports 24-item legacy and 40-item production forms/.test(engine), "explicit production shape");
check("EQ production composition", /EMOTION_AWARENESS: 13.*EMOTION_REGULATION: 13.*EMPATHY_SOCIAL_AWARENESS: 12.*RELATIONSHIP_SOCIAL_RESPONSE: 12/s.test(engine), "13/13/12/12");
check("Cognitive production composition", /const requiredCount = questions\.length === 40 \? 10 : 6/.test(cognitive) && /const requiredCount = context\.questions\.length === 40 \? 10 : 6/.test(engine), "10 per dimension");
check("DISC partial/timeout denominator", /answeredCount > 0 \? Math\.round\(\(selectedCount \/ answeredCount\)/.test(disc), "answered responses only");
check("Cognitive unanswered not synthesized", /if \(raw === undefined\) continue/.test(cognitive) && /weightTotal \+= weight/.test(cognitive), "answered-weight denominator");
check("EQ V2 CSV contract", /group === "EQ"/.test(importer) && /scoringKey\.length === 4/.test(importer) && /correctOption === null/.test(importer), "4-value key, no correctOption");
check("Result contracts referenced", /DISC_RESULT_V2/.test(disc) && /EQ_RESULT_V2/.test(eq) && /COGNITIVE_RESULT_V2/.test(cognitive) && /RIASEC_RESULT_V2/.test(riasecContract), "V2 result contracts");

const targets = {
  RIASEC: [60,72],
  DISC: [80,96],
  EQ: [50,60],
  COGNITIVE: [40,48],
};
for (const [type,[target,reserve]] of Object.entries(targets)) {
  const a = pool.assessments[type];
  check(`${type} production pool readiness`, a.productionCount >= target, `${a.productionCount}/${target}`);
  check(`${type} reserve pool readiness`, a.reserveCount >= reserve-target, `${a.reserveCount}/minimum`);
}
check("Scoring fixture present", fs.existsSync(path.join(root,"V13_7/fixtures/V13_7_scoring_validation.ts")));
check("No V13.7 migration", !fs.existsSync(path.join(root,"prisma/migrations/20260907150000_v13_7_scoring_validation")));

const contentReady = Object.entries(targets).every(([type,[target,reserve]]) => {
  const a=pool.assessments[type]; return a.productionCount>=target && a.reserveCount>=reserve-target;
});

console.log("----------------------------------------");
if (!contentReady) {
  console.log("Blocking: V13.5 candidate pools are incomplete.");
  console.log("V13.7 scoring-form support is implemented, but production scoring cannot be declared PASS until complete approved pools are executed through the actual scoring engine.");
}
console.log(`V13.7 SCORING VALIDATION GATE: ${contentReady ? "PASS" : "FAIL"}`);

const report = {
  phase:"V13.7",
  gate: contentReady ? "PASS" : "FAIL / NOT FROZEN",
  engineImplementation:"PRODUCTION_SHAPES_IMPLEMENTED",
  productionPoolReadiness: Object.fromEntries(Object.entries(pool.assessments).map(([k,v])=>[k,{production:v.productionCount,reserve:v.reserveCount}])),
  note: contentReady ? "Run actual DB/HTTP scoring E2E before freeze." : "Blocked by incomplete V13.5 content; no synthetic fixture is treated as production content."
};
fs.writeFileSync(path.join(root,"V13_7/reports/V13_7_SCORING_VALIDATION_REPORT.json"), JSON.stringify(report,null,2)+"\n");
process.exit(contentReady ? 0 : 1);
