import fs from "node:fs";
import path from "node:path";
const root=process.cwd();
const required=[
 ["lib/reports/v19-3-engine.ts","V19.3 report engine"],
 ["lib/reports/pdf-v19-3.ts","V19.3 PDF renderer"],
 ["app/api/reports/[attemptId]/pdf/route.ts","V19.3 PDF route"],
 ["app/reports/[attemptId]/parent/page.tsx","V19.3 parent report UI"],
];
for(const [f,label] of required) if(!fs.existsSync(path.join(root,f))){console.error(`V19.3 GATE: FAIL — ${label} missing`);process.exit(1)}
const engine=fs.readFileSync(path.join(root,"lib/reports/v19-3-engine.ts"),"utf8");
const service=fs.readFileSync(path.join(root,"lib/reports/service.ts"),"utf8");
const route=fs.readFileSync(path.join(root,"app/api/reports/[attemptId]/pdf/route.ts"),"utf8");
const parent=fs.readFileSync(path.join(root,"app/reports/[attemptId]/parent/page.tsx"),"utf8");
const checks=[
 [engine.includes('"RIASEC"')&&engine.includes('"DISC"')&&engine.includes('"EQ"')&&engine.includes('"COGNITIVE"')&&engine.includes('"WORK_ATTITUDE"')&&engine.includes('"LEARNING_PREFERENCE"'),'six assessment types supported'],
 [engine.includes('interpretation')&&engine.includes('visualization')&&engine.includes('recommendations'),'interpretation visualization recommendation contract'],
 [engine.includes('universal score')&&engine.includes('Learning Preference'),'semantic boundaries preserved'],
 [service.includes('getAssessmentReportV19_3'),'service reads user-owned completed result'],
 [route.includes('renderAssessmentReportPdfV19_3')&&route.includes('application/pdf'),'PDF report route'],
 [parent.includes('/api/reports/')&&parent.includes('/pdf'),'Parent View PDF action'],
];
for(const [ok,label] of checks){if(!ok){console.error(`V19.3 GATE: FAIL — ${label}`);process.exit(1)} console.log(`PASS — ${label}`)}
console.log('V19.3 Report Adjustment static gate: PASS');
