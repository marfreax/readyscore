import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");
const repo = read("lib/question-bank-repository.ts");
const page = read("app/admin/question-bank/page.tsx");
const api = read("app/api/admin/question-bank/route.ts");
const ui = read("components/admin/UnifiedQuestionBankWorkspace.tsx");
const schema = read("prisma/schema.prisma");
const pkg = JSON.parse(read("package.json"));
let failed = false;
function pass(label){ console.log(`PASS: ${label}`); }
function check(ok,label){ if(ok) pass(label); else { console.error(`FAIL: ${label}`); failed=true; } }
check(fs.existsSync(path.join(root,"lib/question-bank-repository.ts")),"required artifact: lib/question-bank-repository.ts");
check(fs.existsSync(path.join(root,"app/admin/question-bank/page.tsx")),"required artifact: app/admin/question-bank/page.tsx");
check(fs.existsSync(path.join(root,"app/api/admin/question-bank/route.ts")),"required artifact: app/api/admin/question-bank/route.ts");
check(fs.existsSync(path.join(root,"components/admin/UnifiedQuestionBankWorkspace.tsx")),"required artifact: components/admin/UnifiedQuestionBankWorkspace.tsx");
check(fs.existsSync(path.join(root,"prisma/schema.prisma")),"required artifact: prisma/schema.prisma");
check(pkg.scripts?.["v11:7:7:gate"] === "node scripts/validate-v11-7-7-statistics.mjs","package script: v11:7:7:gate");
check(repo.includes("QuestionBankStatsContext"),"context stats contract");
check(repo.includes("active-workspace"),"active workspace context marker");
check(repo.includes("normalizeQuestionBankFilterGroup(context.group)"),"stats group normalization");
check(repo.includes("normalizeQuestionBankFilterStatus(context.status)"),"stats status normalization");
check(repo.includes("normalizeQuestionBankSearch(context.search)"),"stats search normalization");
check(repo.includes('COUNT(*)::bigint AS "total"'),"context total count");
check(repo.includes('FILTER (WHERE latest."status"::text = \'DRAFT\')'),"context draft count");
check(repo.includes('FILTER (WHERE latest."status"::text = \'PUBLISHED\')'),"context published count");
check(repo.includes('FILTER (WHERE latest."mappingStatus"::text IN (\'MAPPED\', \'APPROVED\'))'),"context mapped count");
check(repo.includes('"eligible"'),"context eligible count");
check(repo.includes("ROW_NUMBER() OVER"),"latest-version ranking");
check(page.includes("getQuestionBankStats({ group: workspaceGroup, status, search })"),"page passes active stats context");
check(api.includes('getQuestionBankStats({'),"API passes active stats context");
check(api.includes('group: url.searchParams.get("group")'),"API stats group context");
check(api.includes('status: url.searchParams.get("status")'),"API stats status context");
check(api.includes('search: url.searchParams.get("search")'),"API stats search context");
check(ui.includes("setStats(j.stats)"),"UI consumes server stats");
check(!fs.existsSync(path.join(root,"prisma/migrations/20260906100000_v11_7_7_context_correct_statistics")),"no V11.7.7 Prisma migration");
check(schema.includes("model QuestionVersion"),"schema unchanged baseline artifact present");
if(failed){ console.error("V11.7.7 STATIC GATE: FAIL"); process.exit(1); }
console.log("V11.7.7 STATIC GATE: PASS");
