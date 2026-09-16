import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const exists = (file) => fs.existsSync(path.join(root, file));
const failures = [];
const checks = [
  ["V16.5 gate exists", exists("scripts/validate-v16-5-pdf-delivery.mjs")],
  ["V16.6 gate exists", exists("scripts/validate-v16-6-delivery.mjs")],
  ["V16.7 gate exists", exists("scripts/validate-v16-7-business-lead.mjs")],
  ["full funnel runtime exists", exists("scripts/e2e-v16-8-full-funnel-runtime.mjs")],
  ["V16 analytics allowlist", read("lib/funnel-analytics.ts").includes("V16_FUNNEL_EVENTS")],
  ["free assessment route", exists("app/api/assessment/start/route.ts")],
  ["free unlock route", exists("app/api/free/unlock/route.ts")],
  ["PDF endpoint", exists("app/api/free/report/pdf/route.ts")],
  ["delivery endpoint", exists("app/api/free/delivery/route.ts")],
  ["Business Lead service", exists("lib/business-lead.ts")],
  ["Business Lead admin API", exists("app/api/admin/leads/route.ts")],
  ["Business Lead admin page", exists("app/admin/leads/page.tsx")],
  ["premium offer", exists("components/free/FreePremiumOffer.tsx")],
  ["checkout endpoint", exists("app/api/commercial/checkout/route.ts")],
  ["payment endpoint", exists("app/api/commercial/payments/route.ts")],
  ["entitlement endpoint", exists("app/api/commercial/entitlements/route.ts")],
  ["V15.2 customer report gate", exists("scripts/validate-v15-2-customer-report-experience.mjs")],
  ["security headers", read("next.config.mjs").includes("X-Content-Type-Options") && read("next.config.mjs").includes("X-Frame-Options")],
  ["admin authorization", read("lib/auth/admin.ts").includes("requireAdmin")],
  ["delivery concurrency protection", read("lib/free-delivery.ts").includes("processingToken") && read("components/free/FreeReportDeliveryStatus.tsx").includes("inFlightDeliveries")],
  ["lead deduplication", read("lib/business-lead.ts").includes("BUSINESS_LEAD_IDENTITY_CONFLICT") && read("lib/business-lead.ts").includes("P2002")],
  ["canonical source", read("lib/business-lead.ts").includes('FREE_ASSESSMENT')],
  ["consent preservation", read("lib/business-lead.ts").includes("consentAt") && read("app/api/free/unlock/route.ts").includes("consent: true")],
  ["no AI scope creep", !read("lib/funnel-analytics.ts").toLowerCase().includes("openai")],
];
for (const [label, ok] of checks) if (!ok) failures.push(label);
const packageJson = JSON.parse(read("package.json"));
if (packageJson.scripts?.["v16:8:gate"] !== "node scripts/validate-v16-8-production-certification.mjs") failures.push("package script v16:8:gate");
if (packageJson.scripts?.["e2e:v16:8:full-funnel"] !== "node scripts/e2e-v16-8-full-funnel-runtime.mjs") failures.push("package script e2e:v16:8:full-funnel");
if (failures.length) {
  console.error("V16.8 Full Funnel Production Certification static gate: FAIL");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}
console.log("V16.8 Full Funnel Production Certification static gate: PASS");
