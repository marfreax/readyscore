import { spawn, type ChildProcess } from "node:child_process";
import net from "node:net";
import { provisionFixtures, disconnectFixtures } from "./v7-l19e-fixtures";

let baseUrl = process.env.BASE_URL?.replace(/\/$/, "") || "";
let server: ChildProcess | null = null;

function fail(message: string): never { throw new Error(message); }

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

async function findFreePort(start = 3350) {
  for (let port = start; port < start + 100; port += 1) {
    const available = await new Promise<boolean>((resolve) => {
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
    env: {
      ...process.env,
      BASE_URL: baseUrl,
      READYSCORE_PUBLIC_URL: baseUrl,
    },
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

async function request(pathname: string, cookie = "") {
  const response = await fetch(`${baseUrl}${pathname}`, {
    redirect: "manual",
    headers: cookie ? { cookie } : undefined,
  });
  const text = await response.text();
  return { response, text };
}

function assertStatus(result: { response: Response }, label: string, expected: number[]) {
  if (!expected.includes(result.response.status)) fail(`${label}: expected ${expected.join("/")}, got ${result.response.status}`);
}

function assertMarkers(result: { response: Response; text: string }, label: string, markers: string[]) {
  if (result.response.status !== 200) fail(`${label}: expected HTTP 200, got ${result.response.status}`);
  for (const marker of markers) if (!result.text.includes(marker)) fail(`${label}: marker missing: ${marker}`);
}

async function login(email: string, password: string) {
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
    redirect: "manual",
  });
  if (response.status !== 200) fail(`login failed for ${email}: HTTP ${response.status}`);
  const setCookie = response.headers.get("set-cookie") || "";
  const match = setCookie.match(/readyscore_session=([^;]+)/);
  if (!match?.[1]) fail(`session cookie missing for ${email}`);
  return `readyscore_session=${match[1]}`;
}

async function runSuite(script: string) {
  console.log(`--- ${script} ---`);
  await new Promise<void>((resolve, reject) => {
    const child = spawn("pnpm", [script], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        BASE_URL: baseUrl,
        READYSCORE_PUBLIC_URL: baseUrl,
      },
      stdio: "inherit",
    });
    child.on("error", reject);
    child.on("exit", (code) => code === 0 ? resolve() : reject(new Error(`${script} exited with ${code}`)));
  });
}

async function main() {
  console.log("=== READY SCORE V7 L20 FULL PRODUCT REGRESSION QA ACTUAL RUNTIME E2E ===");
  console.log("Mode     : REAL HTTP + REAL PostgreSQL runtime");
  console.log("Database : NO MIGRATION");

  if (!process.env.BASE_URL) await startFresh();
  console.log(`Base URL : ${baseUrl}`);

  const publicRoutes = [
    "/",
    "/trial/free",
    "/trial/premium",
    "/trial/riasec",
    "/trial/disc",
    "/trial/eq",
    "/trial/cognitive",
    "/login",
    "/register",
  ];
  for (const route of publicRoutes) assertStatus(await request(route), route, [200]);
  console.log("PUBLIC SURFACES             : PASS");

  for (const route of ["/app", "/profile", "/reports", "/assessments", "/activity", "/access", "/admin"]) {
    assertStatus(await request(route), `unauth ${route}`, [302, 307, 308]);
  }
  const unauthInstitution = await request("/institution");
  assertMarkers(unauthInstitution, "unauth /institution", [
    "Login diperlukan untuk melihat institution context dan entitlement.",
  ]);
  console.log("UNAUTHENTICATED GUARDS     : PASS");

  const fixtures = await provisionFixtures({ password: process.env.L19E_QA_PASSWORD || undefined });
  const byKey = Object.fromEntries(fixtures.fixtures.map((fixture) => [fixture.key, fixture]));
  const qa03 = byKey["QA-03"];
  const qa04 = byKey["QA-04"];
  if (!qa03 || !qa04) fail("QA fixture matrix incomplete");

  const customerCookie = await login(qa03.email, qa03.password);
  const customerRoutes = [
    ["/app", ["Overview"]],
    ["/access", ["Current access", "Capabilities", "Pembelian dilakukan di Scalev."]],
    ["/assessments", ["Assessment Anda"]],
    ["/activity", ["Aktivitas terbaru"]],
    ["/profile", ["Cross-Test Profile"]],
    ["/reports", ["Reports"]],
  ] as const;
  for (const [route, markers] of customerRoutes) assertMarkers(await request(route, customerCookie), route, [...markers]);
  console.log("CUSTOMER SHELL + NAVIGATION : PASS");

  for (const route of [`/result/${qa03.attemptIds[0]}`, `/result/${qa03.attemptIds[1]}`, `/result/${qa03.attemptIds[2]}`, `/result/${qa03.attemptIds[3]}`]) {
    assertStatus(await request(route, customerCookie), route, [200]);
  }
  assertStatus(await request(`/reports/${qa03.attemptIds[0]}/parent`, customerCookie), "/reports/[attemptId]/parent", [200, 403, 404]);
  console.log("RESULT + REPORT SURFACES     : PASS");

  for (const type of ["riasec", "disc", "eq", "cognitive"]) {
    assertStatus(await request(`/reassessment/${type}`, customerCookie), `/reassessment/${type}`, [200, 302, 307, 308]);
  }
  console.log("REASSESSMENT SURFACES       : PASS");

  const adminCookie = await login(qa04.email, qa04.password);
  const adminRoutes = [
    "/admin",
    "/admin/question-bank",
    "/admin/review",
    "/admin/assessment-config",
    "/admin/users",
    "/admin/integrations",
    "/admin/riasec-review",
  ];
  for (const route of adminRoutes) assertStatus(await request(route, adminCookie), route, [200]);
  console.log("ADMIN SURFACES              : PASS");

  assertStatus(await request("/institution", customerCookie), "/institution authenticated", [200]);
  console.log("INSTITUTION BOUNDARY        : PASS");

  // Re-run the protected historical V5/V6 and L19 runtime suites against this server.
  // These are regression suites, not new feature implementations.
  for (const script of [
    "e2e:riasec",
    "e2e:disc",
    "e2e:eq",
    "e2e:cognitive",
    "e2e:result",
    "e2e:reassessment",
    "e2e:upgrade",
    "e2e:profiling",
    "e2e:paid",
    "e2e:l19e",
    "e2e:l19f",
    "e2e:l19f:uxfix",
  ]) {
    await runSuite(script);
  }
  console.log("FROZEN V5/V6 + L19 REGRESSION: PASS");

  console.log("=== READY SCORE V7 L20 FULL PRODUCT REGRESSION QA ACTUAL RUNTIME E2E: PASS ===");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectFixtures();
    await cleanup();
  });
