import fs from "node:fs";
import path from "node:path";
const root=process.cwd();
const read=(f)=>fs.readFileSync(path.join(root,f),"utf8");
const checks=[
 ["funnel event model",read("prisma/schema.prisma").includes("model FunnelEvent")],
 ["phase4 migration",fs.existsSync(path.join(root,"prisma/migrations/20260915140000_v16_4_analytics_security_freeze/migration.sql"))],
 ["analytics allowlist",read("lib/funnel-analytics.ts").includes("V16_FUNNEL_EVENTS")],
 ["analytics api",fs.existsSync(path.join(root,"app/api/funnel/event/route.ts"))],
 ["analytics event allowlist complete", ["landing_view","free_test_start","free_test_complete","instant_result_view","locked_insight_view","free_report_cta","lead_form_view","lead_submitted","free_report_unlocked","pdf_generated","whatsapp_sent","email_sent","premium_offer_view","checkout_started","checkout_completed","premium_unlocked"].every((event)=>read("lib/funnel-analytics.ts").includes(`"${event}"`))],
 ["admin analytics protected",read("app/admin/analytics/page.tsx").includes("requireAdmin()")],
 ["security headers",read("next.config.mjs").includes("X-Content-Type-Options") && read("next.config.mjs").includes("X-Frame-Options")],
 ["lead rate limit",read("app/api/free/unlock/route.ts").includes("checkV16RateLimit")],
 ["delivery rate limit",read("app/api/free/delivery/route.ts").includes("checkV16RateLimit")],
 ["pdf rate limit",read("app/api/free/report/pdf/route.ts").includes("checkV16RateLimit")],
 ["full funnel e2e script",fs.existsSync(path.join(root,"scripts/e2e-v16-phase4-runtime.mjs"))],
 ["admin auth source unchanged",read("app/admin/layout.tsx").includes("requireAdmin()")],
 ["payment server validation",read("lib/commercial/v14-1.ts").includes("validateV16Offer")],
 ["no AI",!read("lib/funnel-analytics.ts").toLowerCase().includes("openai")],
];
const failed=checks.filter(([,ok])=>!ok);
if(failed.length){console.error("V16 PHASE 4 CONTRACT: FAIL"); failed.forEach(([n])=>console.error(`- ${n}`)); process.exit(1);}
console.log("V16 PHASE 4 CONTRACT: PASS");
