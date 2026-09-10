import { disconnectFixtures, provisionFixtures } from "./v7-l19e-fixtures";
import { spawn, type ChildProcess } from "node:child_process";
import net from "node:net";

let baseUrl = process.env.BASE_URL?.replace(/\/$/, "") || "";
let server: ChildProcess | null = null;

function fail(message: string): never { throw new Error(message); }

async function request(pathname: string, options: RequestInit = {}, cookie = "") {
  const response = await fetch(`${baseUrl}${pathname}`, {
    redirect: "manual",
    headers: {
      "content-type": "application/json",
      ...(cookie ? { cookie } : {}),
      ...(options.headers ?? {}),
    },
    ...options,
  });
  let body = null;
  try { body = await response.json(); } catch {}
  return { response, body };
}

async function waitForServer(url: string, timeoutMs = 30000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(`${url}/`, { redirect: "manual" });
      if (response.status >= 200 && response.status < 500) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  fail("local Next.js server did not become ready");
}

async function findFreePort(start = 3150) {
  for (let port = start; port < start + 100; port += 1) {
    const available = await new Promise((resolve) => {
      const socket = net.createServer();
      socket.once("error", () => resolve(false));
      socket.once("listening", () => socket.close(() => resolve(true)));
      socket.listen(port, "127.0.0.1");
    });
    if (available) return port;
  }
  fail("could not find a free local port");
}

async function startFresh() {
  const port = await findFreePort();
  baseUrl = `http://127.0.0.1:${port}`;
  server = spawn("pnpm", ["exec", "next", "start", "-p", String(port)], {
    cwd: process.cwd(),
    env: { ...process.env, BASE_URL: baseUrl },
    stdio: ["ignore", "pipe", "pipe"],
  });
  server.stdout?.on("data", (chunk) => process.stdout.write(`[next] ${chunk}`));
  server.stderr?.on("data", (chunk) => process.stderr.write(`[next] ${chunk}`));
  await waitForServer(baseUrl);
}

async function cleanup() {
  if (!server || server.killed) return;
  server.kill("SIGTERM");
  await new Promise((resolve) => setTimeout(resolve, 300));
  if (!server.killed) server.kill("SIGKILL");
}

async function login(fixture: { key: string; email: string; password: string }) {
  const result = await request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: fixture.email, password: fixture.password }),
  });
  if (result.response.status !== 200) {
    fail(`${fixture.key} login failed: HTTP ${result.response.status} ${JSON.stringify(result.body)}`);
  }
  const setCookie = result.response.headers.get("set-cookie") || "";
  const match = setCookie.match(/readyscore_session=([^;]+)/);
  if (!match) fail(`${fixture.key} session cookie missing`);
  const sessionId = match[1];
  if (!sessionId) fail(`${fixture.key} session cookie value missing`);
  return `readyscore_session=${sessionId}`;
}

async function assertEntitlement(cookie: string, key: string, expected: boolean) {
  const result = await request("/api/commercial/entitlements", {}, cookie);
  if (!result.response.ok || !result.body?.ok) fail(`entitlement reload failed: HTTP ${result.response.status}`);
  const entitlements: Array<{ resourceKey?: string }> = Array.isArray(result.body.entitlements) ? result.body.entitlements : [];
  const keys = new Set(entitlements.map((item) => item.resourceKey));
  const actual = keys.has(key);
  if (actual !== expected) fail(`entitlement ${key} expected=${expected} actual=${actual}`);
}

async function main() {
  console.log("=== READY SCORE V7 L19E QA USER FIXTURES & SCENARIO MATRIX ACTUAL RUNTIME E2E ===");
  console.log("Mode     : REAL HTTP + REAL PostgreSQL runtime");
  console.log("Database : NO MIGRATION");

  const fixtures = await provisionFixtures({
    password: process.env.L19E_QA_PASSWORD || undefined,
  });

  if (!process.env.BASE_URL) await startFresh();
  console.log(`Base URL : ${baseUrl}`);

  const byKey = Object.fromEntries(fixtures.fixtures.map((fixture) => [fixture.key, fixture]));

  const qa01 = await login(byKey["QA-01"]);
  await assertEntitlement(qa01, "EQ", true);
  for (const lockedKey of ["COGNITIVE", "DISC", "RIASEC"]) await assertEntitlement(qa01, lockedKey, false);
  const qa01Results = await request("/reports", {}, qa01);
  if (qa01Results.response.status !== 200) fail(`QA-01 /reports HTTP ${qa01Results.response.status}`);
  const qa01AttemptId = byKey["QA-01"].attemptIds[0];
  if (!qa01AttemptId) fail("QA-01 completed result attempt is missing");
  if (byKey["QA-01"].attemptIds.length !== 1) fail("QA-01 expected exactly one completed result fixture");
  const qa01Result = await request(`/result/${encodeURIComponent(qa01AttemptId)}`, {}, qa01);
  if (qa01Result.response.status !== 200) fail(`QA-01 result HTTP ${qa01Result.response.status}`);
  const qa01Reassessment = await request("/reassessment/eq", {}, qa01);
  if (qa01Reassessment.response.status !== 200) fail(`QA-01 /reassessment/eq HTTP ${qa01Reassessment.response.status}`);
  console.log("QA-01 Single Test           : PASS");
  console.log("  EQ available / others locked : PASS");
  console.log("  completed result fixture     : PASS");
  console.log("  reassessment credit fixture  : PASS");

  const qa02 = await login(byKey["QA-02"]);
  for (const key of ["COGNITIVE", "EQ", "DISC", "RIASEC"]) await assertEntitlement(qa02, key, true);
  await assertEntitlement(qa02, "CROSS_TEST_PROFILE_V1", false);
  if (byKey["QA-02"].attemptIds.length !== 1) fail("QA-02 expected one completed result fixture");
  console.log("QA-02 All Tests              : PASS");
  console.log("  four core entitlements       : PASS");
  console.log("  profiling unavailable        : PASS");
  console.log("  completed result fixture     : PASS");

  const qa03 = await login(byKey["QA-03"]);
  for (const key of ["COGNITIVE", "EQ", "DISC", "RIASEC", "CROSS_TEST_PROFILE_V1"]) await assertEntitlement(qa03, key, true);
  if (byKey["QA-03"].attemptIds.length !== 4) fail("QA-03 expected four completed result fixtures");
  const profile = await request("/api/profile/cross-test", {}, qa03);
  if (!profile.response.ok || !profile.body?.ok) fail(`QA-03 profiling failed: HTTP ${profile.response.status}`);
  if (profile.body.profile?.contractVersion !== "CROSS_TEST_PROFILE_V1") fail("QA-03 profile contract mismatch");
  console.log("QA-03 Full Access           : PASS");
  console.log("  four core entitlements       : PASS");
  console.log("  profiling entitlement        : PASS");
  console.log("  four completed results       : PASS");
  console.log("  cross-test profile runtime   : PASS");

  const qa04 = await login(byKey["QA-04"]);
  const admin = await request("/admin", {}, qa04);
  if (admin.response.status !== 200) fail(`QA-04 /admin HTTP ${admin.response.status}`);
  for (const route of ["/admin/question-bank", "/admin/review", "/admin/assessment-config", "/admin/users", "/admin/integrations", "/admin/riasec-review"]) {
    const page = await request(route, {}, qa04);
    if (page.response.status !== 200) fail(`QA-04 ${route} HTTP ${page.response.status}`);
  }
  console.log("QA-04 Admin                : PASS");
  console.log("  admin authentication       : PASS");
  console.log("  admin operational surfaces : PASS");

  const foreignResult = await request(`/result/${encodeURIComponent(qa01AttemptId)}`, {}, qa02);
  if (![404, 307, 308].includes(foreignResult.response.status)) fail(`cross-account result should be blocked, got HTTP ${foreignResult.response.status}`);
  console.log("Cross-account result isolation : PASS");

  const unauth = await request("/admin");
  if (unauth.response.status !== 307 && unauth.response.status !== 308) fail("unauthenticated admin guard failed");
  console.log("Admin unauthenticated guard : PASS");

  console.log("=== READY SCORE V7 L19E QA USER FIXTURES & SCENARIO MATRIX ACTUAL RUNTIME E2E: PASS ===");
}

main()
  .catch((error) => { console.error(error); process.exitCode = 1; })
  .finally(async () => { await cleanup(); await disconnectFixtures(); });
