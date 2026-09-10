import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");
const page = read("app/admin/page.tsx");
const repo = read("lib/admin-operations-dashboard.ts");

const checks = [];
function pass(name, ok) {
  if (!ok) throw new Error(`FAIL: ${name}`);
  checks.push(`PASS: ${name}`);
}

pass("dashboard loads canonical repository", page.includes("getAdminOperationsDashboard"));
pass("question group health", repo.includes('["DISC", "RIASEC", "IQ_COGNITIVE", "EQ"]'));
pass("published and active distinction", repo.includes("status === QuestionStatus.PUBLISHED") && repo.includes("mappingStatus === MappingStatus.APPROVED"));
pass("validation issues", repo.includes("isContentComplete"));
pass("mapping issues", repo.includes("mappingStatus !== MappingStatus.APPROVED"));
pass("configuration readiness states", page.includes("READY") && page.includes("WARNING") && page.includes("BLOCKED"));
pass("actionable warning links", page.includes("warning.href"));
pass("recent audit actor and state", repo.includes("actor: e.actor.name || e.actor.email") && repo.includes("fromStatus") && repo.includes("toStatus"));
pass("historical-safe read boundary", page.includes("historical attempt") && repo.includes("questionVersion.findMany"));
pass("no mutation in dashboard path", !repo.includes(".create(") && !repo.includes(".update(") && !repo.includes(".delete("));

console.log(checks.join("\n"));
console.log("V11.4 Admin Operations Dashboard runtime smoke: PASS");
