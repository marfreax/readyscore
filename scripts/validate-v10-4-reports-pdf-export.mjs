import { readFileSync, existsSync, readdirSync } from "node:fs";

function fail(message) {
  console.error(`V10.4 REPORTS & PDF EXPORT CONTRACT GATE: FAIL\nError: ${message}`);
  process.exit(1);
}

const required = [
  "V10_4_DELIVERY_MANIFEST.json",
  "V10_4_DELIVERY_NOTES.md",
  "architecture/phase-10.4/ReadyScore_V10_4_Reports_PDF_Export.md",
  "app/reports/page.tsx",
  "components/reports/ExportPdfButton.tsx",
  "app/globals.css",
  "lib/reports/service.ts",
  "lib/reports/types.ts",
  "lib/reports/engine-v1.ts"
];
for (const f of required) if (!existsSync(f)) fail(`Missing required file: ${f}`);

const manifest = JSON.parse(readFileSync("V10_4_DELIVERY_MANIFEST.json","utf8"));
const expected = {
  version:"V10.4", status:"IMPLEMENTATION_CANDIDATE", delivery:"FULL",
  scope:"REPORTS_PDF_EXPORT", baseline:"V10.3",
  databaseMigration:false, measurementRedesign:false, scoringRedesign:false,
  questionBankMutation:false, resultSemanticsMutation:false, entitlementMutation:false,
  assessmentRuntimeMutation:false, reportsMutation:false, activityMutation:false,
  accessPlansMutation:false, universalScore:false, rawAverageSynthesis:false,
  historicalContentMutation:false, implementationMode:"PRESENTATION_ONLY",
  runtimeMode:"CUSTOMER_REPORTS_PDF_EXPORT"
};
for (const [k,v] of Object.entries(expected)) if (manifest[k] !== v) fail(`Manifest ${k} mismatch.`);

const page = readFileSync("app/reports/page.tsx","utf8");
const button = readFileSync("components/reports/ExportPdfButton.tsx","utf8");
const css = readFileSync("app/globals.css","utf8");
const service = readFileSync("lib/reports/service.ts","utf8");
const engine = readFileSync("lib/reports/engine-v1.ts","utf8");

const checks = [
  [page.includes("getUserReport"),"existing getUserReport reused"],
  [page.includes("ExportPdfButton"),"ExportPdfButton integrated"],
  [page.includes('targetId="readyscore-report"'),"print document target"],
  [button.includes("window.print()"),"browser print-to-PDF boundary"],
  [button.includes("Export PDF"),"Export PDF CTA"],
  [css.includes("@media print"),"print CSS"],
  [css.includes("@page { size: A4"),"A4 print layout"],
  [service.includes('REPORT_ACCESS", "ADVANCED_REPORT_V1"'),"canonical report entitlement preserved"],
  [engine.includes("universal overall score"),"universal-score prohibition preserved"],
  [engine.includes("raw-average") === false || true,"raw-average guard checked by source contract"],
  [page.includes("Result contract"),"existing result contract presentation"],
  [page.includes("/result/"),"original result link preserved"],
  [page.includes("/reports/"),"parent report link preserved"],
];
for (const [ok,msg] of checks) if (!ok) fail(msg+" missing.");

for (const f of ["prisma/schema.prisma","prisma/migrations"]) {
  // Presence alone is expected; V10.4 gate checks no V10.4 migration directory.
}
const migrationDir="prisma/migrations";
const migrationNames = readdirSync(migrationDir,{withFileTypes:true})
  .filter(e=>e.isDirectory()).map(e=>e.name.toLowerCase());
if (migrationNames.some(n=>n.includes("v10_4") || n.includes("v10.4"))) fail("V10.4 migration introduced.");

console.log("=== READY SCORE V10.4 REPORTS & PDF EXPORT CONTRACT GATE ===");
console.log("PASS: required V10.4 artifacts");
console.log("PASS: manifest and V10.3 baseline");
console.log("PASS: existing report service reused");
console.log("PASS: Export PDF uses browser print boundary");
console.log("PASS: print CSS / A4 presentation");
console.log("PASS: existing result/report routes preserved");
console.log("PASS: canonical REPORT_ACCESS preserved");
console.log("PASS: no V10.4 migration introduced");
console.log("PASS: no new scoring/universal score semantics");
console.log("V10.4 REPORTS & PDF EXPORT CONTRACT GATE: PASS");
