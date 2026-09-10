import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");
const checks = [];
const pass = (name, ok) => {
  if (!ok) throw new Error(`FAIL: ${name}`);
  checks.push(`PASS: ${name}`);
};

const page = read("app/admin/page.tsx");
const repo = read("lib/admin-operations-dashboard.ts");
const spec = read("architecture/phase-11.4/ReadyScore_V11_4_Admin_Operations_Dashboard.md");

pass("repository", fs.existsSync(path.join(root, "lib/admin-operations-dashboard.ts")));
pass("dashboard page", page.includes("getAdminOperationsDashboard"));
pass("assessment health", repo.includes("DashboardGroupHealth") && repo.includes("active"));
pass("content health", repo.includes("validationIssues") && repo.includes("mappingIssues") && repo.includes("unpublished"));
pass("configuration readiness", repo.includes("listAssessmentConfigurations") && repo.includes("readiness"));
pass("recent audit events", repo.includes("adminContentAuditEvent") && repo.includes("take: 12"));
pass("actionable warnings", repo.includes("warnings") && page.includes("Action required"));
pass("canonical operational state", repo.includes("loadLatest") && repo.includes("QuestionStatus.PUBLISHED") && repo.includes("MappingStatus.APPROVED"));
pass("no manual counters", !page.includes("const areas =") && !repo.includes("manualCounter"));
pass("admin authorization", page.includes("await requireAdmin()"));
pass("read-only dashboard", !page.includes("fetch(") && !repo.includes(".create(") && !repo.includes(".update(") && !repo.includes(".delete("));
pass("spec V11.4 scope", spec.includes("# ReadyScore V11.4") && spec.includes("Assessment Health") && spec.includes("Recent Admin Activity"));
pass("spec canonical indicators", spec.includes("canonical operational state"));

console.log(checks.join("\n"));
console.log("V11.4 ADMIN OPERATIONS DASHBOARD GATE: PASS");
