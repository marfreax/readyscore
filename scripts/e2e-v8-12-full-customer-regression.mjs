import { spawn } from "node:child_process";
import net from "node:net";

let baseUrl = process.env.BASE_URL?.replace(/\/$/, "") || "";
let server = null;

const fail = (message) => { throw new Error(`V8.12 full customer regression failed: ${message}`); };

async function waitForServer(url, timeoutMs = 30000) {
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

async function findFreePort(start = 3450) {
  for (let port = start; port < start + 100; port++) {
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
    env: { ...process.env, BASE_URL: baseUrl, READYSCORE_PUBLIC_URL: baseUrl },
    stdio: ["ignore", "pipe", "pipe"],
  });
  server.stdout?.on("data", (chunk) => process.stdout.write(`[next] ${chunk}`));
  server.stderr?.on("data", (chunk) => process.stderr.write(`[next] ${chunk}`));
  await waitForServer(baseUrl);
}

async function cleanup() {
  if (!server || server.killed) return;
  server.kill("SIGTERM");
  await new Promise((resolve) => setTimeout(resolve, 500));
  if (!server.killed) server.kill("SIGKILL");
}

async function request(pathname, options = {}) {
  const response = await fetch(`${baseUrl}${pathname}`, {
    redirect: "manual",
    ...options,
    headers: { ...(options.headers || {}) },
  });
  return { response, text: await response.text() };
}

function status(result, label, expected) {
  if (!expected.includes(result.response.status)) {
    fail(`${label}: expected ${expected.join("/")}, got ${result.response.status}`);
  }
}

function markers(result, label, required) {
  if (result.response.status !== 200) fail(`${label}: expected HTTP 200, got ${result.response.status}`);
  for (const marker of required) if (!result.text.includes(marker)) fail(`${label}: marker missing: ${marker}`);
}

async function runSuite(script) {
  console.log(`--- ${script} ---`);
  await new Promise((resolve, reject) => {
    const child = spawn("pnpm", [script], {
      cwd: process.cwd(),
      env: { ...process.env, BASE_URL: baseUrl, READYSCORE_PUBLIC_URL: baseUrl },
      stdio: "inherit",
    });
    child.on("error", reject);
    child.on("exit", (code) => code === 0 ? resolve() : reject(new Error(`${script} exited with ${code}`)));
  });
}

async function main() {
  console.log("=== READY SCORE V8.12 FULL CUSTOMER REGRESSION ACTUAL RUNTIME ===");
  console.log("Mode     : REAL HTTP + REAL PostgreSQL runtime");
  console.log("Mutation : Regression verification only; no schema/question-bank/scoring mutation");

  if (!process.env.BASE_URL) await startFresh();
  console.log(`Base URL : ${baseUrl}`);

  const publicRoutes = [
    "/", "/trial/free", "/trial/premium", "/trial/riasec",
    "/trial/disc", "/trial/eq", "/trial/cognitive", "/login", "/register",
  ];
  for (const route of publicRoutes) status(await request(route), route, [200]);
  console.log("PUBLIC CUSTOMER SURFACES    : PASS");

  const guardedRoutes = [
    "/app", "/profile", "/reports", "/assessments", "/activity", "/access", "/admin",
  ];
  for (const route of guardedRoutes) status(await request(route), `unauth ${route}`, [302, 307, 308]);
  console.log("AUTHENTICATION GUARDS       : PASS");

  const assessmentRoutes = ["/assessments", "/assessments/cognitive", "/assessments/eq", "/assessments/disc", "/assessments/riasec"];
  for (const route of assessmentRoutes) {
    const result = await request(route);
    status(result, `assessment ${route}`, [200, 302, 307, 308]);
  }
  console.log("ASSESSMENT DISCOVERY         : PASS");

  const resultWithoutAttempt = await request("/result/invalid-v8-12-regression-attempt");
  status(resultWithoutAttempt, "result ownership/invalid attempt", [302, 307, 308, 404]);
  console.log("RESULT OWNERSHIP BOUNDARY    : PASS");

  const profile = await request("/profile");
  status(profile, "profile guard", [302, 307, 308]);
  console.log("PROFILE GUARD                : PASS");

  // The frozen L20 suite owns the authenticated customer/admin/institution,
  // commercial, Scalev, security, accessibility and historical regression matrix.
  await runSuite("e2e:l20");
  console.log("FROZEN V7/L20 PRODUCT REGRESSION : PASS");

  // Active V8 instrument suites own measurement/runtime-specific verification.
  for (const script of [
    "e2e:cognitive",
    "e2e:v8:4:eq",
    "e2e:v8:5:disc",
    "e2e:v8:6:riasec",
  ]) {
    await runSuite(script);
  }
  console.log("ACTIVE V8 INSTRUMENT REGRESSION : PASS");

  console.log("=== READY SCORE V8.12 FULL CUSTOMER REGRESSION ACTUAL RUNTIME: PASS ===");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(cleanup);
