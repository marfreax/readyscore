import "./lib-e2e-env.mjs";
import { PrismaClient } from "@prisma/client";
const baseUrl = process.env.BASE_URL ?? "http://localhost:3000";
import { getAuthenticatedCookie } from "./lib-v15-customer-auth.mjs";
const prisma = new PrismaClient();
function fail(m) { throw new Error(m); }
let cookie = "";
async function req(path) {
  const r = await fetch(baseUrl + path, { headers: { ...(cookie ? { cookie } : {}) } });
  let body = null; try { body = await r.json(); } catch {}
  return { r, body };
}
try {
  console.log("=== READY SCORE V15.2 CUSTOMER REPORT REAL HTTP/DB E2E ===");
  console.log(`Base URL : ${baseUrl}`);
  cookie = await getAuthenticatedCookie(baseUrl);
  const me = await req("/api/auth/session");
  if (!me.r.ok || !me.body?.ok) fail(`session failed ${me.r.status}`);
  const userId = me.body.user?.id;
  if (!userId) fail("session did not expose user id");
  const attempts = await prisma.assessmentAttempt.findMany({ where: { userId, status: "COMPLETED", assessmentType: { in: ["RIASEC","DISC","EQ","COGNITIVE"] }, result: { isNot: null } }, select: { assessmentType: true, id: true }, distinct: ["assessmentType"] });
  const types = new Set(attempts.map(a => a.assessmentType));
  if (types.size < 4) fail(`expected four completed result types, found ${[...types].join(", ")}`);
  const report = await req("/api/reports/personalized");
  if (!report.r.ok || !report.body?.ok) fail(`personalized report API failed ${report.r.status} ${JSON.stringify(report.body)}`);
  const state = report.body.state;
  if (state.readiness !== "READY" || !state.report?.document) fail(`report not ready: ${JSON.stringify(state)}`);
  const doc = state.report.document;
  if (doc.pageCount < 20) fail(`expected >=20 pages, got ${doc.pageCount}`);
  if (doc.recommendations.length < 5 || doc.recommendations.length > 7) fail(`expected 5–7 recommendations, got ${doc.recommendations.length}`);
  if (doc.actionPlan.weeks.length !== 4) fail(`expected four action-plan weeks, got ${doc.actionPlan.weeks.length}`);
  const db = await prisma.v15Report.findUnique({ where: { id: state.report.id }, select: { userId: true, sourceFingerprint: true, payload: true } });
  if (!db || db.userId !== userId) fail("persisted report ownership mismatch");
  console.log("authenticated customer session       : PASS");
  console.log("four completed V13 result inputs     : PASS");
  console.log("personalized report HTTP API         : PASS");
  console.log(`report pages                         : PASS (${doc.pageCount})`);
  console.log(`major recommendations                : PASS (${doc.recommendations.length})`);
  console.log("30-day action plan                   : PASS");
  console.log("database persistence / ownership     : PASS");
  console.log("V15.2 CUSTOMER REPORT REAL E2E      : PASS");
} finally { await prisma.$disconnect(); }
