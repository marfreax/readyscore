import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const required = [
  "V10_11_PATCH_2_DELIVERY_MANIFEST.json",
  "V10_11_PATCH_2_DELIVERY_NOTES.md",
  "architecture/phase-10.11/ReadyScore_V10_11_Patch_2_Report_Result_Visibility.md",
  "app/reports/page.tsx",
  "lib/reports/service.ts",
  "components/reports/ExportPdfButton.tsx",
];

function read(file) {
  return fs.readFileSync(path.join(root, file), "utf8");
}

let failed = false;
function check(label, ok) {
  if (ok) console.log(`PASS: ${label}`);
  else {
    console.error(`FAIL: ${label}`);
    failed = true;
  }
}

for (const file of required) check(`required V10.11-PATCH.2 artifact: ${file}`, fs.existsSync(path.join(root, file)));

const manifest = JSON.parse(read("V10_11_PATCH_2_DELIVERY_MANIFEST.json"));
check("manifest version", manifest.version === "V10.11-PATCH.2");
check("manifest baseline", manifest.baseline === "V10.11-PATCH.1");
check("manifest databaseMigration", manifest.databaseMigration === false);
check("manifest measurementRedesign", manifest.measurementRedesign === false);
check("manifest scoringRedesign", manifest.scoringRedesign === false);
check("manifest questionBankMutation", manifest.questionBankMutation === false);
check("manifest resultSemanticsMutation", manifest.resultSemanticsMutation === false);
check("manifest entitlementMutation", manifest.entitlementMutation === false);
check("manifest assessmentRuntimeMutation", manifest.assessmentRuntimeMutation === false);
check("manifest universalScore", manifest.universalScore === false);
check("manifest rawAverageSynthesis", manifest.rawAverageSynthesis === false);
check("manifest historicalContentMutation", manifest.historicalContentMutation === false);

const page = read("app/reports/page.tsx");
const service = read("lib/reports/service.ts");
const notes = read("V10_11_PATCH_2_DELIVERY_NOTES.md");
const architecture = read("architecture/phase-10.11/ReadyScore_V10_11_Patch_2_Report_Result_Visibility.md");
const button = read("components/reports/ExportPdfButton.tsx");

check("overview service exists", service.includes("getUserReportOverview"));
check("overview reads existing attempts", service.includes("buildUserReport(userId"));
check("report page uses overview", page.includes("getUserReportOverview(session.user.id)"));
check("report page shows existing results without access", page.includes("Hasil assessment Anda tetap ditampilkan meskipun report premium belum aktif"));
check("limited report notice", page.includes("Report lengkap belum aktif"));
check("limited report explains data is not lost", page.includes("Data hasil assessment Anda tidak hilang"));
check("PDF gated by report access", page.includes("{reportAccess ? <ExportPdfButton targetId=\"readyscore-report\" /> : null}"));
check("Parent View gated by report access", page.includes("reportAccess ? (") && page.includes("Unlock report"));
check("original result remains available", page.includes("/result/${encodeURIComponent(assessment.attemptId)}"));
check("existing protected getUserReport remains", service.includes("throw new ReportAccessError") && service.includes("return buildUserReport(userId)"));
check("existing protected getParentReport remains", service.includes("export async function getParentReport") && service.includes('hasFeatureAccess(userId, "REPORT_ACCESS", "ADVANCED_REPORT_V1")'));
check("no PDF action target in unavailable branch", !page.includes("ExportPdfButton targetId=\"readyscore-report\" /><Link href=\"/activity\""));
check("print-hidden button remains valid", button.includes("print-hidden"));
check("safety notes", notes.includes("No database migration") && architecture.includes("No scoring, interpretation, result semantics"));
check("no migration introduced", !fs.existsSync(path.join(root, "prisma/migrations/V10.11-PATCH.2")));

if (failed) process.exit(1);
console.log("V10.11-PATCH.2 REPORT RESULT VISIBILITY CONTRACT GATE: PASS");
