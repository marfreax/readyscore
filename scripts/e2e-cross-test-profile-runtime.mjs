import fs from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { PrismaClient } from "@prisma/client";

const baseUrl = process.env.BASE_URL ?? "http://localhost:3000";
const root = process.cwd();
const authFile = path.join(root, "data", "auth-state.json");
const prisma = new PrismaClient();
const types = ["cognitive", "eq", "disc", "riasec"];
const entitlementKeys = ["COGNITIVE", "EQ", "DISC", "RIASEC"];

function fail(message) { throw new Error(message); }
async function request(pathname, options = {}, cookie = "") {
  const response = await fetch(`${baseUrl}${pathname}`, {
    headers: { "content-type": "application/json", ...(cookie ? { cookie } : {}), ...(options.headers ?? {}) },
    ...options,
  });
  let body = null; try { body = await response.json(); } catch {}
  return { response, body };
}

const suffix = Date.now().toString();
const userId = `e2e_profile_${randomBytes(8).toString("hex")}`;
const sessionId = `ses_${randomBytes(24).toString("hex")}`;
const email = `e2e-profile-${suffix}@readyscore.local`;
const now = new Date();

try {
  const auth = fs.existsSync(authFile) ? JSON.parse(fs.readFileSync(authFile, "utf8")) : { version: 1, users: [], sessions: [] };
  auth.users.push({ id: userId, name: "E2E Cross-Test Profile", email, passwordHash: "e2e-only", role: "USER", createdAt: now.toISOString(), updatedAt: now.toISOString() });
  auth.sessions = auth.sessions.filter((x) => new Date(x.expiresAt) > now);
  auth.sessions.push({ id: sessionId, userId, createdAt: now.toISOString(), expiresAt: new Date(now.getTime() + 86400000).toISOString() });
  fs.mkdirSync(path.dirname(authFile), { recursive: true });
  fs.writeFileSync(authFile, JSON.stringify(auth, null, 2));

  await prisma.user.create({ data: { id: userId, name: "E2E Cross-Test Profile", email, passwordHash: "e2e-only", role: "USER", createdAt: now, updatedAt: now } });
  await prisma.userEntitlement.create({ data: { userId, type: "PROFILE_ACCESS", resourceType: "FEATURE", resourceKey: "CROSS_TEST_PROFILE_V1", source: "E2E_PROFILE", status: "ACTIVE" } });
  for (const key of entitlementKeys) {
    await prisma.userEntitlement.create({ data: { userId, type: "TEST_ACCESS", resourceType: "TEST_TYPE", resourceKey: key, source: "E2E_PROFILE", status: "ACTIVE" } });
  }

  const cookie = `readyscore_session=${sessionId}`;
  const attemptIds = {};

  for (const type of types) {
    const started = await request("/api/assessment/start", { method: "POST", body: JSON.stringify({ type }) }, cookie);
    if (!started.response.ok || !started.body?.ok) fail(`${type} start failed: HTTP ${started.response.status} ${JSON.stringify(started.body)}`);
    const questions = started.body.questions ?? [];
    if (questions.length !== 24 && type !== "riasec") fail(`${type} expected 24 questions, got ${questions.length}`);
    if (type === "riasec" && questions.length !== 60) fail(`RIASEC expected 60 questions, got ${questions.length}`);
    attemptIds[type] = started.body.attemptId;
    for (const q of questions) {
      const answered = await request(`/api/assessment/${encodeURIComponent(started.body.attemptId)}/answer`, { method: "POST", body: JSON.stringify({ questionId: q.id, value: 3 }) }, cookie);
      if (!answered.response.ok || !answered.body?.ok) fail(`${type} answer failed for ${q.id}: HTTP ${answered.response.status}`);
    }
    const submitted = await request(`/api/assessment/${encodeURIComponent(started.body.attemptId)}/submit`, { method: "POST" }, cookie);
    if (!submitted.response.ok || !submitted.body?.ok) fail(`${type} submit failed: HTTP ${submitted.response.status} ${JSON.stringify(submitted.body)}`);
  }
  console.log("Four assessment sources      : PASS");

  const profile = await request("/api/profile/cross-test", {}, cookie);
  if (!profile.response.ok || !profile.body?.ok) fail(`Cross-test profile API failed: HTTP ${profile.response.status} ${JSON.stringify(profile.body)}`);
  const payload = profile.body.profile;
  if (!payload || payload.contractVersion !== "CROSS_TEST_PROFILE_V1" || payload.engineVersion !== "CROSS_TEST_PROFILE_ENGINE_V1") fail("Cross-test profile identity missing.");
  if (payload.completeness?.availableDomains !== 4 || payload.completeness?.totalDomains !== 7) fail(`Expected 4/7 evidence domains, got ${JSON.stringify(payload.completeness)}`);
  if (!payload.domains?.find((d) => d.domain === "ABILITY" && d.signalCount === 4)) fail("ABILITY evidence missing.");
  if (!payload.domains?.find((d) => d.domain === "EMOTIONAL" && d.signalCount === 4)) fail("EMOTIONAL evidence missing.");
  if (!payload.domains?.find((d) => d.domain === "BEHAVIOR" && d.signalCount === 4)) fail("BEHAVIOR evidence missing.");
  if (!payload.domains?.find((d) => d.domain === "INTEREST" && d.signalCount === 6)) fail("INTEREST evidence missing.");
  console.log("Latest completed snapshots : PASS");
  console.log("Cross-test synthesis API    : PASS");
  console.log("Evidence domains 4/7        : PASS");
  if (Object.prototype.hasOwnProperty.call(payload, "overallScore")) fail("Universal overall score must not exist.");
  console.log("No universal overall score   : PASS");
  console.log("=== READY SCORE V5 L10 CROSS-TEST PROFILING ACTUAL RUNTIME E2E: PASS ===");
  console.log(`User ID                     : ${userId}`);
} finally {
  await prisma.$disconnect();
}
