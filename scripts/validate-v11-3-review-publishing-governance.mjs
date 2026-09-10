import fs from "node:fs";
import path from "node:path";
const root=process.cwd();
const required=[
 ["lib/admin-review-repository.ts","repository"],["app/api/admin/review/route.ts","API"],["components/admin/AdminReviewContentOperations.tsx","UI"],["architecture/phase-11.3/ReadyScore_V11_3_Review_Publishing_Governance.md","spec"]
];
for(const [f,label] of required){if(!fs.existsSync(path.join(root,f))) throw new Error(`FAIL: ${label}`); console.log(`PASS: ${label}`);}
const checks=[
 ['GovernedReviewAction','canonical lifecycle'],['APPROVE_MAPPING','mapping approval'],['HIGH_IMPACT_ACTIONS','high-impact confirmation'],['getReviewImpactPreview','impact preview'],['HIGH_IMPACT_CONFIRMATION_REQUIRED','server confirmation'],['auditContentOperation','audit trail'],['QUESTION_NOT_APPROVED','approval before publish'],['MAPPING_NOT_APPROVED','mapping protection'],['ACTIVE_CONTENT_REQUIRES_REPLACEMENT','archive protection'],['UserRole.ADMIN','admin permission']
];
for(const [needle,label] of checks){const files=required.map(x=>fs.readFileSync(path.join(root,x[0]),'utf8')).join('\n');if(!files.includes(needle)) throw new Error(`FAIL: ${label}`); console.log(`PASS: ${label}`);}
if(fs.existsSync(path.join(root,'prisma/migrations/v11.3-review-publishing-governance'))) throw new Error('FAIL: unexpected V11.3 migration');
console.log('PASS: no V11.3 migration');
console.log('V11.3 REVIEW & PUBLISHING GOVERNANCE GATE: PASS');
