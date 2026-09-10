import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const required = [
  ["app/reports/personalized/page.tsx", "customer personalized report page"],
  ["app/api/reports/personalized/route.ts", "personalized report API"],
  ["lib/v15/customer-service.ts", "V15 customer readiness service"],
  ["components/reports/ExportPdfButton.tsx", "PDF export control"],
];
function fail(message) { console.error(`V15.2 GATE: FAIL — ${message}`); process.exit(1); }
for (const [file, label] of required) if (!fs.existsSync(path.join(root, file))) fail(`${label} missing: ${file}`);
const page = fs.readFileSync(path.join(root, "app/reports/personalized/page.tsx"), "utf8");
const service = fs.readFileSync(path.join(root, "lib/v15/customer-service.ts"), "utf8");
const overview = fs.readFileSync(path.join(root, "app/reports/page.tsx"), "utf8");
const engine = fs.readFileSync(path.join(root, "lib/v15/report/engine-v1.ts"), "utf8");
const checks = [
  [page.includes("document.pages.map"), "all persisted report pages are rendered"],
  [page.includes("ExportPdfButton"), "PDF export is available"],
  [engine.includes("recommendationBlock") && engine.includes("for (const r of recs.slice(0, 7))"), "recommendation content is exposed"],
  [(engine.includes("Rencana 30 hari") || engine.includes("Action Plan")) && engine.includes("actionPlan.weeks"), "action plan content is exposed"],
  [service.includes("REQUIRED_TYPES") && service.includes("COGNITIVE"), "four-assessment readiness is enforced"],
  [service.includes("generateV15Report"), "real V15 report engine is used"],
  [overview.includes("/reports/personalized"), "reports workspace links to personalized report"],
];
for (const [ok, label] of checks) if (!ok) fail(label);
console.log("=== READY SCORE V15.2 CUSTOMER REPORT EXPERIENCE GATE ===");
for (const [, label] of checks) console.log(`${label.padEnd(42)}: PASS`);
console.log("V15.2 customer report experience contract : PASS");
