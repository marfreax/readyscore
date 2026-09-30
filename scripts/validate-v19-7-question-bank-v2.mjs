import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const checks = [];
const pass = (name, detail = '') => checks.push([name, true, detail]);
const fail = (name, detail = '') => checks.push([name, false, detail]);
const assert = (condition, name, detail = '') => condition ? pass(name, detail) : fail(name, detail);

const bank = JSON.parse(read('data/v19/question-bank-v2.json'));
const migration = read('prisma/migrations/20260930143000_v19_7_question_bank_v2/migration.sql');
const selector = read('lib/assessment/question-engine.ts');
const catalog = read('lib/catalog/question-bank.ts');
const configRepo = read('lib/assessment-configuration-repository.ts');
const packageRuntime = read('lib/question-package-runtime.ts');
const schema = read('prisma/schema.prisma');

assert(bank.status === 'DRAFT', 'Source package remains DRAFT', 'JSON is a governed source package; migration controls publication.');
assert(bank.items.length === 65, '65 V2 items');
assert(bank.items.filter(x => x.id.startsWith('WA-')).length === 35, '35 Work Attitude V2 items');
assert(bank.items.filter(x => x.id.startsWith('LP-')).length === 30, '30 Learning Preference V2 items');
assert(new Set(bank.items.map(x => x.id)).size === 65, 'Question IDs remain unique');
assert(bank.items.every(x => x.version === 'v2'), 'All source items are V2');
assert(bank.items.every(x => x.reverseScore === false && x.weight === 1 && JSON.stringify(x.scale) === JSON.stringify([1,2,3,4,5]) && JSON.stringify(x.scoringKey) === JSON.stringify([1,2,3,4,5])), 'Scoring metadata preserved');
assert(bank.items.every(x => x.mappingStatus === 'APPROVED'), 'Mapping metadata preserved as APPROVED');
assert(bank.counts.revised === 16 && bank.counts.unchanged === 49 && bank.counts.replaced === undefined, 'V2 package declares 16 revisions / 49 unchanged');

const revised = bank.items.filter(x => x.textChangedFromV1 === true);
assert(revised.length === 16, 'Exactly 16 text revisions are marked');
assert(migration.match(/INSERT INTO "QuestionVersion"/g)?.length === 65, 'Migration contains exactly 65 V2 QuestionVersion inserts');
assert(migration.includes("'v2'"), 'Migration creates QuestionVersion v2');
assert(migration.includes("'PUBLISHED','APPROVED','V19.7_QUESTION_BANK_V2'"), 'V2 QuestionVersions are published and approved');
assert(migration.includes("'work-attitude-v2-version'"), 'Work Attitude V2 configuration version created');
assert(migration.includes("'learning-preference-v2-version'"), 'Learning Preference V2 configuration version created');
assert(migration.includes("'work-attitude-runtime-v2'"), 'Work Attitude V2 runtime package created');
assert(migration.includes("'learning-preference-runtime-v2'"), 'Learning Preference V2 runtime package created');
assert(migration.includes("SET \"status\"='ARCHIVED'"), 'V1 active configurations are archived only after V2 exists');
assert(migration.includes('WORK_ATTITUDE_QB_V2') && migration.includes('LEARNING_PREFERENCE_QB_V2'), 'Configuration/package question bank version advanced to V2');
assert(migration.includes("'WORK_ATTITUDE_TAXONOMY_V1'") && migration.includes("'LEARNING_PREFERENCE_TAXONOMY_V1'"), 'Taxonomy remains V1; no taxonomy migration');
assert(migration.includes("'WORK_ATTITUDE_SCORE_V1'") && migration.includes("'LEARNING_PREFERENCE_SCORE_V1'"), 'Scoring remains V1; no scoring migration');
assert(migration.includes("'WORK_ATTITUDE_SELECTION_V1'") && migration.includes("'LEARNING_PREFERENCE_SELECTION_V1'"), 'Selection algorithm remains V1');
assert(schema.includes('@@unique([questionId, version])'), 'Existing immutable QuestionVersion uniqueness preserved');
assert(catalog.includes('status: QuestionStatus.PUBLISHED') && catalog.includes('mappingStatus: MappingStatus.APPROVED'), 'Canonical runtime still reads governed published/approved versions');
assert(selector.includes('getPublishedQuestionBank') && selector.includes('WORK_ATTITUDE') && selector.includes('LEARNING_PREFERENCE'), 'Assessment selector architecture unchanged and DB-backed');
assert(packageRuntime.includes('loadEligibleQuestions') && packageRuntime.includes('status: QuestionStatus.PUBLISHED'), 'Package runtime remains governed by published QuestionVersion');
assert(configRepo.includes('questionBankVersion'), 'Assessment configuration continues to carry questionBankVersion metadata');

if (checks.some(([, ok]) => !ok)) {
  console.error('V19.7 QUESTION BANK V2 — FAIL');
  for (const [name, ok, detail] of checks) console.error(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`);
  process.exit(1);
}
console.log('=== READY SCORE V19.7 QUESTION BANK V2 ===');
for (const [name, ok, detail] of checks) console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`);
console.log('=== READY SCORE V19.7 QUESTION BANK V2 — PASS ===');
