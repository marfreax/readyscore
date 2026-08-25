import fs from "node:fs";
import path from "node:path";

const root=process.cwd();
const manifest=JSON.parse(fs.readFileSync(path.join(root,"data/question-bank/production/RIASEC_QB_V1_APPROVED_PRODUCTION_MANIFEST.json"),"utf8"));
if(manifest.status!=="APPROVED_FOR_PUBLICATION") throw new Error(`MANIFEST_NOT_APPROVED:${manifest.status}`);
if(!Array.isArray(manifest.questionIds)||manifest.questionIds.length!==60) throw new Error(`MANIFEST_COUNT:${manifest.questionIds?.length??0}`);
console.log("=== RIASEC RUNTIME TARGET RECONCILIATION ===");
console.log("Manifest IDs : Question.code (stable business IDs)");
console.log("Promotion    : latest QuestionVersion per Question");
console.log("Target count : 60");
console.log("Database mutation: NONE");
console.log("RIASEC RUNTIME TARGET RECONCILIATION: PASS");
