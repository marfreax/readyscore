import { provisionFixtures, disconnectFixtures } from "./v7-l19e-fixtures";
import { spawn, type ChildProcess } from "node:child_process";
import net from "node:net";

let baseUrl = process.env.BASE_URL?.replace(/\/$/, "") || "";
let server: ChildProcess | null = null;

function fail(message: string): never { throw new Error(message); }

async function request(pathname: string, cookie = "") {
  const response = await fetch(`${baseUrl}${pathname}`, {
    redirect: "manual",
    headers: cookie ? { cookie } : undefined,
  });
  const text = await response.text();
  return { response, text };
}

async function waitForServer(url: string) {
  const started = Date.now();
  while (Date.now() - started < 30000) {
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
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: fixture.email, password: fixture.password }),
    redirect: "manual",
  });
  if (response.status !== 200) fail(`${fixture.key} login failed: HTTP ${response.status}`);
  const cookie = response.headers.get("set-cookie") || "";
  const match = cookie.match(/readyscore_session=([^;]+)/);
  if (!match?.[1]) fail(`${fixture.key} session cookie missing`);
  return `readyscore_session=${match[1]}`;
}

function normalizeHtmlText(html: string) {
  return html
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function assertPage(result: { response: Response; text: string }, label: string, markers: string[] = []) {
  if (result.response.status !== 200) fail(`${label}: expected HTTP 200, got ${result.response.status}`);
  const normalizedText = normalizeHtmlText(result.text);
  for (const marker of markers) {
    if (!normalizedText.includes(marker)) fail(`${label}: marker missing: ${marker}`);
  }
}

async function main() {
  console.log("=== READY SCORE V7 L19F FINAL UX/UI ACCEPTANCE & CROSS-SURFACE VALIDATION ACTUAL RUNTIME E2E ===");
  console.log("Mode     : REAL HTTP + REAL PostgreSQL runtime");
  console.log("Database : NO MIGRATION");

  const fixtures = await provisionFixtures({
    password: process.env.L19E_QA_PASSWORD || undefined,
  });
  if (!process.env.BASE_URL) await startFresh();
  console.log(`Base URL : ${baseUrl}`);

  assertPage(await request("/"), "Public landing", ["ReadyScore"]);
  assertPage(await request("/login"), "Login", ["Masuk"]);
  assertPage(await request("/register"), "Register", ["Daftar"]);
  const unauthApp = await request("/app");
  if (![307, 308].includes(unauthApp.response.status)) fail(`/app unauthenticated guard: HTTP ${unauthApp.response.status}`);
  console.log("PUBLIC + AUTH             : PASS");

  const byKey = Object.fromEntries(fixtures.fixtures.map((fixture) => [fixture.key, fixture]));
  const qa01 = await login(byKey["QA-01"]);
  const qa03 = await login(byKey["QA-03"]);
  const qa04 = await login(byKey["QA-04"]);

  for (const route of ["/app", "/access", "/assessments", "/activity", "/profile", "/reports"]) {
    assertPage(await request(route, qa01), `QA-01 ${route}`, ["ReadyScore"]);
  }
  const resultId = byKey["QA-01"].attemptIds[0];
  if (!resultId) fail("QA-01 result attempt missing");
  assertPage(await request(`/result/${encodeURIComponent(resultId)}`, qa01), "QA-01 result", ["ReadyScore"]);
  assertPage(await request("/reassessment/eq", qa01), "QA-01 reassessment", ["Assessment"]);
  console.log("CUSTOMER SHELL            : PASS");
  console.log("  /app /access /assessments /activity /profile /reports : PASS");
  console.log("  /result + /reassessment        : PASS");

  for (const type of ["cognitive", "eq", "disc", "riasec"]) {
    const page = await request(`/trial/${type}`, qa01);
    assertPage(page, `QA-01 /trial/${type}`, ["Pre-Test", "Mulai Assessment"]);
  }
  console.log("ASSESSMENT ENTRY SURFACES : PASS");
  console.log("  cognitive / eq / disc / riasec : PASS");

  const shell = await request("/app", qa01);
  for (const marker of ["Lewati ke konten utama", 'id="main-content"', "Buka workspace menu", 'aria-label="Workspace navigation"']) {
    if (!shell.text.includes(marker)) fail(`customer shell accessibility marker missing: ${marker}`);
  }
  console.log("ACCESSIBILITY BASELINE     : PASS");

  assertPage(await request("/admin", qa04), "QA-04 /admin", ["Admin Overview", "Question Bank", "Users & Access", "Integrations"]);
  for (const route of ["/admin/question-bank", "/admin/review", "/admin/assessment-config", "/admin/users", "/admin/integrations", "/admin/riasec-review"]) {
    assertPage(await request(route, qa04), `QA-04 ${route}`);
  }
  console.log("ADMIN CROSS-SURFACE        : PASS");

  const adminUnauth = await request("/admin");
  if (![307, 308].includes(adminUnauth.response.status)) fail("admin unauthenticated guard failed");
  const foreign = await request(`/result/${encodeURIComponent(resultId)}`, qa03);
  if (![404, 307, 308].includes(foreign.response.status)) fail(`cross-account result should be blocked, got ${foreign.response.status}`);
  console.log("SECURITY BOUNDARIES        : PASS");
  console.log("  admin guard + cross-account result isolation : PASS");

  console.log("=== READY SCORE V7 L19F FINAL UX/UI ACCEPTANCE & CROSS-SURFACE VALIDATION ACTUAL RUNTIME E2E: PASS ===");
}

main()
  .catch((error) => { console.error(error); process.exitCode = 1; })
  .finally(async () => { await cleanup(); await disconnectFixtures(); });
