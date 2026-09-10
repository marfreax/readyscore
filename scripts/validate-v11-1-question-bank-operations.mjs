import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
const must=[
 'lib/question-bank-v11.ts','lib/question-bank-csv.ts','lib/question-bank-repository.ts',
 'components/admin/UnifiedQuestionBankWorkspace.tsx','app/api/admin/question-bank/route.ts','app/api/admin/question-bank/template/route.ts',
 'architecture/phase-11.0/ReadyScore_V11_0_Admin_Architecture_Safety_Contract.md'
];
let failed=false; const ok=(c,m)=>{if(c) console.log('PASS:',m); else {console.error('FAIL:',m);failed=true}};
console.log('=== READY SCORE V11.1 QUESTION BANK OPERATIONS GATE ===');
for(const f of must) ok(fs.existsSync(path.join(root,f)),`required artifact: ${f}`);
const repo=fs.readFileSync(path.join(root,'lib/question-bank-repository.ts'),'utf8');
const csv=fs.readFileSync(path.join(root,'lib/question-bank-csv.ts'),'utf8');
const ui=fs.readFileSync(path.join(root,'components/admin/UnifiedQuestionBankWorkspace.tsx'),'utf8');
const api=fs.readFileSync(path.join(root,'app/api/admin/question-bank/route.ts'),'utf8');
const groups=['DISC','RIASEC','IQ_COGNITIVE','EQ'];
for(const g of groups) ok(repo.includes(g)||csv.includes(g)||ui.includes(g),`Question Group marker: ${g}`);
for(const x of ['importAdminQuestions','parseQuestionCsvForGroup','questionBankTemplate','getQuestionBankGroupStats']) ok(repo.includes(x)||csv.includes(x),`operation marker: ${x}`);
for(const x of ['Preview CSV','Import as Draft','Download template','Edit / version']) ok(ui.includes(x),`UI marker: ${x}`);
for(const x of ['multipart/form-data','PREVIEW','IMPORT']) ok(api.includes(x),`API marker: ${x}`);
ok(!fs.existsSync(path.join(root,'prisma/migrations/v11-1-question-bank-operations')),'no V11.1-specific Prisma migration directory');
ok(repo.includes('v.scale.length === 4') && repo.includes('v.scale.length === 5'),'runtime eligibility supports both 4-choice and 5-point contracts');
ok(!repo.includes('v.scale.length === 5 &&\n        v.scoringKey.length === 5'),'no legacy universal 5-point eligibility gate remains');
ok(!csv.includes('PUBLISHED') || csv.includes('status: "DRAFT"'),'CSV parser produces draft lifecycle state');
if(failed){process.exitCode=1}else console.log('V11.1 QUESTION BANK OPERATIONS GATE: PASS');
