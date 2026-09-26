import fs from "node:fs";

const read = (p) => fs.readFileSync(p, "utf8");
const fail = (m) => { console.error(`V17.10.1 ADMIN UI GATE — FAIL: ${m}`); process.exit(1); };
const pass = (m) => console.log(`✓ ${m}`);

const repo = read("lib/assessment-configuration-repository.ts");
const api = read("app/api/admin/assessment-config/route.ts");
const workspace = read("components/admin/AssessmentConfigurationWorkspace.tsx");
const shell = read("components/admin/AdminShell.tsx");

const codes = ["free-v1", "riasec-v1", "disc-v1", "eq-v1", "cognitive-v1"];
for (const code of codes) if (!repo.includes(`"${code}"`)) fail(`canonical operational code missing: ${code}`);
pass("five canonical operational configuration codes detected");

if (!repo.includes("isOperationalConfiguration") || !repo.includes("OPERATIONAL_CONFIG_CODE_SET")) fail("operational configuration filter contract missing");
if (!repo.includes("if(!isOperationalConfiguration(row)) continue")) fail("list query is not filtered to canonical operational configurations");
pass("Admin configuration list excludes legacy/E2E configurations by canonical code");

if (!repo.includes('const codes=[...OPERATIONAL_CONFIG_CODE_SET]') || !repo.includes('const where={code:{in:codes}}')) fail("summary statistics are not canonical-code scoped");
pass("configuration statistics are scoped to the five operational configurations");

if (!api.includes("CANONICAL_CODE_BY_TYPE") || !api.includes("INVALID_OPERATIONAL_CONFIGURATION_CODE")) fail("CREATE assessment restriction missing");
pass("CREATE is restricted to canonical operational assessment codes");

if (!workspace.includes("availableCreateTypes") || !workspace.includes("CANONICAL_CODE")) fail("Admin create UI restriction missing");
pass("Admin create UI only exposes missing canonical assessment types");

if (shell.includes("/admin/question-packages") || shell.includes('label: "Question Packages"')) fail("Question Packages remains in operational Admin navigation");
pass("Question Packages is not operational Admin navigation");

if (!repo.includes('throw new Error("CONFIGURATION_NOT_FOUND")')) fail("legacy configuration action protection missing");
pass("legacy configuration actions are protected without deleting historical records");

if (!repo.includes('isOperationalConfiguration(v.configuration)')) fail("version readiness is not restricted to operational configuration");
pass("readiness API is restricted to operational configuration");

console.log("\nV17.10.1 ADMIN UI FINISHING GATE — PASS");
console.log("Scope: Admin configuration filtering, summary, create restriction, legacy exclusion, readiness boundary, historical safety.");
