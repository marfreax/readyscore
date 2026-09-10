import { PrismaClient } from "@prisma/client";

const baseUrl = process.env.BASE_URL ?? "http://localhost:3000";
import { getAuthenticatedCookie } from "./lib-v15-customer-auth.mjs";
const prisma = new PrismaClient();

function fail(message) { throw new Error(message); }
let cookie = "";
async function req(path) {
  const response = await fetch(baseUrl + path, { headers: cookie ? { cookie } : {} });
  let body = null;
  try { body = await response.json(); } catch {}
  return { response, body };
}

try {
  console.log("=== READY SCORE V15.2 PHASE C INTEGRATION GATE ===");
  console.log(`Base URL : ${baseUrl}`);
  cookie = await getAuthenticatedCookie(baseUrl);

  const session = await req("/api/auth/session");
  if (!session.response.ok || !session.body?.ok) fail(`session failed ${session.response.status}`);
  const userId = session.body.user?.id;
  if (!userId) fail("session did not expose user id");

  const reportResponse = await req("/api/reports/personalized");
  if (!reportResponse.response.ok || !reportResponse.body?.ok) {
    fail(`personalized report API failed ${reportResponse.response.status}`);
  }

  const state = reportResponse.body.state;
  if (state.readiness !== "READY" || !state.report?.document) fail("customer report is not READY");
  const document = state.report.document;

  if (document.pageCount !== 29) fail(`expected exactly 29 report pages, got ${document.pageCount}`);
  if (document.pages.length !== 29) fail(`expected 29 persisted report pages, got ${document.pages.length}`);
  if (document.pages.some((page, index) => page.pageNumber !== index + 1)) fail("page numbering is not contiguous 1..29");
  if (document.presentationVersion !== "V15_REPORT_PRESENTATION_V2") fail(`unexpected presentation version: ${document.presentationVersion}`);
  if (document.templateVersion !== "V15_REPORT_TEMPLATE_V9") fail(`unexpected template version: ${document.templateVersion}`);

  const text = JSON.stringify(document.pages);
  const forbidden = [
    /ctp-[A-Z]+:/i,
    /(?:riasec|disc|eq|cognitive):[a-z0-9_-]+:/i,
    /cakupan dukungan mencapai 100%/i,
    /\.\s*perlu\b/i,
    /COGNITIVE\.\./i,
    /\b(?:from|dari)\s+(?:COGNITIVE|DISC|EQ|RIASEC)\b/i,
  ];
  for (const pattern of forbidden) if (pattern.test(text)) fail(`forbidden customer-facing content remains: ${pattern}`);

  const db = await prisma.v15Report.findUnique({ where: { id: state.report.id }, select: { userId: true, templateVersion: true, payload: true } });
  if (!db || db.userId !== userId) fail("persisted report ownership mismatch");
  if (db.templateVersion !== "V15_REPORT_TEMPLATE_V9") fail(`persisted template version mismatch: ${db.templateVersion}`);

  console.log("authenticated customer session : PASS");
  console.log("personalized report API        : PASS");
  console.log("presentation version            : PASS (V2)");
  console.log("template invalidation           : PASS (V9)");
  console.log("29-page persisted document      : PASS");
  console.log("customer-content safety scan    : PASS");
  console.log("database ownership/version      : PASS");
  console.log("V15.2 PHASE C INTEGRATION GATE : PASS");
} finally {
  await prisma.$disconnect();
}
