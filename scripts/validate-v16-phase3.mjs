import fs from "node:fs";
import path from "node:path";
const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const checks = [
  ["delivery model", read("prisma/schema.prisma").includes("model FreeReportDelivery")],
  ["delivery attempt unique", read("prisma/schema.prisma").includes('attemptId        String   @unique')],
  ["phase3 migration", fs.existsSync(path.join(root, "prisma/migrations/20260915130000_v16_3_pdf_delivery_premium/migration.sql"))],
  ["pdf renderer", fs.existsSync(path.join(root, "lib/free-report-pdf.ts"))],
  ["html template", read("lib/free-report-pdf.ts").includes("buildFreeReportHtml")],
  ["server pdf route", fs.existsSync(path.join(root, "app/api/free/report/pdf/route.ts"))],
  ["delivery route", fs.existsSync(path.join(root, "app/api/free/delivery/route.ts"))],
  ["whatsapp provider", read("lib/free-delivery.ts").includes("WHATSAPP_ACCESS_TOKEN")],
  ["email provider", read("lib/free-delivery.ts").includes("RESEND_API_KEY")],
  ["delivery failure graceful", read("app/api/free/delivery/route.ts").includes("Free Report tetap terbuka")],
  ["premium offer", fs.existsSync(path.join(root, "components/free/FreePremiumOffer.tsx"))],
  ["existing checkout reused", read("components/free/FreePremiumOffer.tsx").includes("/checkout/product-medium")],
  ["coupon server validation", read("lib/commercial/offer.ts").includes("READYSCORE_OFFER_EXPIRES_AT")],
  ["checkout accepts coupon", read("lib/commercial/v14-1.ts").includes("couponCode")],
  ["register preserves next", read("app/register/page.tsx").includes("URLSearchParams(window.location.search).get(\"next\")")],
  ["pdf download exposed after unlock", read("app/free/result/[attemptId]/page.tsx").includes("/api/free/report/pdf")],
];
const failed = checks.filter(([, ok]) => !ok);
if (failed.length) { console.error("V16 PHASE 3 CONTRACT: FAIL"); for (const [name] of failed) console.error(`- ${name}`); process.exit(1); }
console.log("V16 PHASE 3 CONTRACT: PASS");
