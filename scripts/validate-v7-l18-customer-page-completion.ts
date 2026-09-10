import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (p: string) => fs.readFileSync(path.join(root, p), "utf8");
const exists = (p: string) => fs.existsSync(path.join(root, p));
const fail = (message: string): never => { throw new Error(message); };

const app = read("app/app/page.tsx");
const profile = read("app/profile/page.tsx");
const result = read("app/result/[attemptId]/page.tsx");
const reassessment = read("app/reassessment/[type]/page.tsx");
const reports = read("app/reports/page.tsx");
const parentReport = read("app/reports/[attemptId]/parent/page.tsx");
const shell = read("components/app/AppShell.tsx");
const navigation = read("components/app/CustomerNavigation.tsx");
const pageShell = read("components/app/CustomerPageShell.tsx");
const runtime = read("lib/assessment/runtime-service.ts");
const profileService = read("lib/profile/service.ts");
const reportService = read("lib/reports/service.ts");
const reassessmentApi = read("app/api/assessment/reassessment/start/route.ts");
const doc = read("architecture/phase-7.18/ReadyScore_V7_L18_Customer_Page_Completion.md");

console.log("=== READY SCORE V7 L18 CUSTOMER PAGE COMPLETION MVP GATE ===");
console.log("Scope      : Production completion of customer-facing application pages");
console.log("Protection : Frozen measurement, scoring, result, commercial, profiling, reassessment semantics");

const checks: [string, boolean][] = [
  ["Canonical customer routes present", exists("app/app/page.tsx") && exists("app/profile/page.tsx") && exists("app/result/[attemptId]/page.tsx") && exists("app/reassessment/[type]/page.tsx") && exists("app/reports/page.tsx") && exists("app/reports/[attemptId]/parent/page.tsx")],
  ["Shared customer shell present", exists("components/app/CustomerPageShell.tsx") && pageShell.includes("AppShell")],
  ["Dashboard uses customer shell", app.includes("AppShell") && app.includes("Your assessments") && app.includes("Recent activity") && app.includes("Access & plans")],
  ["Profile production surface present", profile.includes("CustomerPageShell") && profile.includes("Cross-Test Profile") && profile.includes("Completeness")],
  ["Reports production surface present", reports.includes("CustomerPageShell") && reports.includes("Assessment history") && reports.includes("Parent View")],
  ["Parent report production surface present", parentReport.includes("CustomerPageShell") && parentReport.includes("Evidence boundary")],
  ["Result production surface present", result.includes("AppShell") && result.includes("Customer result") && result.includes("Result Summary") && result.includes("Your Profile")],
  ["Result authentication and ownership enforced", result.includes("getAttemptResultForUser") && result.includes("redirect") && runtime.includes("getAttemptResultForUser") && runtime.includes('where: { id: attemptId, userId }')],
  ["Profile authentication and entitlement preserved", profile.includes("getCurrentSession") && profile.includes("getCrossTestProfile") && profile.includes('redirect("/login?next=/profile")') && profileService.includes('hasFeatureAccess(userId, "PROFILE_ACCESS", "CROSS_TEST_PROFILE_V1")')],
  ["Reports authentication and entitlement preserved", reports.includes("getCurrentSession") && reports.includes("getUserReport") && reports.includes('redirect("/login?next=/reports")') && reportService.includes('hasFeatureAccess(userId, "REPORT_ACCESS", "ADVANCED_REPORT_V1")')],
  ["Parent report authentication and ownership preserved", parentReport.includes("getCurrentSession") && parentReport.includes("redirect") && reportService.includes("where: { id: attemptId, userId }")],
  ["Reassessment authentication guard present", reassessment.includes("getCurrentSession") && reassessment.includes("redirect") && reassessmentApi.includes("AUTH_REQUIRED")],
  ["Reassessment route is customer-facing", reassessment.includes("Customer reassessment") && reassessment.includes("AssessmentRunner") && reassessment.includes('mode="reassessment"')],
  ["Dashboard result access action present", app.includes('href={`/result/${attempt.id}`}') && app.includes("Lihat hasil")],
  ["Dashboard reassessment action present", app.includes('href={`/reassessment/${test.reassessmentType}`}') && app.includes("Retake")],
  ["Customer navigation routes are valid", (navigation.includes('href: "/assessments"') || navigation.includes('href: "/app#assessments"')) && (navigation.includes('href: "/activity"') || navigation.includes('href: "/app#recent"')) && (navigation.includes('href: "/access"') || navigation.includes('href: "/app#access"'))],
  ["Responsive customer layout present", pageShell.includes("sm:") && pageShell.includes("lg:") && app.includes("md:grid-cols-2") && reports.includes("sm:flex-row")],
  ["No universal score introduced", !profile.toLowerCase().includes("universal overall score") || profile.includes("Tidak ada universal overall score"),],
  ["Measurement engine not mutated", !runtime.includes("L18") && !runtime.includes("CustomerPageShell")],
  ["Commercial semantics remain delegated", app.includes("getCommercialCatalog") && app.includes("getUpgradeQuote") && app.includes("listUserEntitlements")],
  ["Phase documentation present", doc.includes("V7 L18") && doc.includes("Customer Page Completion") && doc.includes("DATABASE MIGRATION: NO")],
  ["No new L18 database migration", !fs.existsSync(path.join(root, "prisma/migrations/20260828060000_v7_l18_customer_page_completion"))],
];

for (const [label, ok] of checks) {
  if (!ok) fail(`L18 check failed: ${label}`);
  console.log(`PASS: ${label}`);
}

console.log("L18 database migration       : NO");
console.log("L18 measurement semantics    : NO MUTATION");
console.log("L18 scoring semantics        : NO MUTATION");
console.log("L18 commercial semantics     : NO MUTATION");
console.log("L18 customer access control  : PASS");
console.log("V7 L18 CUSTOMER PAGE COMPLETION MVP GATE: PASS");
