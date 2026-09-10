import { provisionFixtures, disconnectFixtures } from "./v7-l19e-fixtures";
import { spawn, type ChildProcess } from "node:child_process";
import net from "node:net";
import { getScalevCheckoutConfiguration } from "../lib/scalev/checkout";

let baseUrl = process.env.BASE_URL?.replace(/\/$/, "") || "";
let server: ChildProcess | null = null;
function fail(message: string): never { throw new Error(message); }
async function request(pathname: string, cookie = "") { const response = await fetch(`${baseUrl}${pathname}`, { redirect: "manual", headers: cookie ? { cookie } : undefined }); const text = await response.text(); return { response, text }; }
async function waitForServer(url: string) { const started = Date.now(); while (Date.now() - started < 30000) { try { const response = await fetch(`${url}/`, { redirect: "manual" }); if (response.status >= 200 && response.status < 500) return; } catch {} await new Promise((resolve) => setTimeout(resolve, 250)); } fail("local Next.js server did not become ready"); }
async function findFreePort(start = 3250) { for (let port = start; port < start + 100; port += 1) { const available = await new Promise<boolean>((resolve) => { const socket = net.createServer(); socket.once("error", () => resolve(false)); socket.once("listening", () => socket.close(() => resolve(true))); socket.listen(port, "127.0.0.1"); }); if (available) return port; } fail("could not find a free local port"); }
async function startFresh() { const port = await findFreePort(); baseUrl = `http://127.0.0.1:${port}`; server = spawn("pnpm", ["exec", "next", "start", "-p", String(port)], { cwd: process.cwd(), env: { ...process.env, BASE_URL: baseUrl }, stdio: ["ignore", "pipe", "pipe"] }); server.stdout?.on("data", (chunk) => process.stdout.write(`[next] ${chunk}`)); server.stderr?.on("data", (chunk) => process.stderr.write(`[next] ${chunk}`)); await waitForServer(baseUrl); }
async function cleanup() { if (!server || server.killed) return; server.kill("SIGTERM"); await new Promise((resolve) => setTimeout(resolve, 300)); if (!server.killed) server.kill("SIGKILL"); }
async function login(fixture: { key: string; email: string; password: string }) { const response = await fetch(`${baseUrl}/api/auth/login`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: fixture.email, password: fixture.password }), redirect: "manual" }); if (response.status !== 200) fail(`${fixture.key} login failed: HTTP ${response.status}`); const cookie = response.headers.get("set-cookie") || ""; const match = cookie.match(/readyscore_session=([^;]+)/); if (!match?.[1]) fail(`${fixture.key} session cookie missing`); return `readyscore_session=${match[1]}`; }
function normalizeHtmlText(html: string) { return html.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'"); }
function assertPage(result: { response: Response; text: string }, label: string, markers: string[] = []) { if (result.response.status !== 200) fail(`${label}: expected HTTP 200, got ${result.response.status}`); const text = normalizeHtmlText(result.text); for (const marker of markers) if (!text.includes(marker)) fail(`${label}: marker missing: ${marker}`); }

async function main() {
  console.log("=== READY SCORE V7 L19F UX FIX ACTUAL RUNTIME E2E ===");
  console.log("Mode     : REAL HTTP + REAL PostgreSQL runtime");
  console.log("Database : NO MIGRATION");
  const fixtures = await provisionFixtures({ password: process.env.L19E_QA_PASSWORD || undefined });
  if (!process.env.BASE_URL) await startFresh();
  console.log(`Base URL : ${baseUrl}`);
  const byKey = Object.fromEntries(fixtures.fixtures.map((fixture) => [fixture.key, fixture]));
  const cookie = await login(byKey["QA-01"]);

  assertPage(await request("/assessments", cookie), "/assessments", ["Assessment Anda", "Cognitive", "Emotional Intelligence", "DISC", "RIASEC"]);
  assertPage(await request("/activity", cookie), "/activity", ["Aktivitas terbaru", "Riwayat assessment"]);
  console.log("DEDICATED CUSTOMER PAGES : PASS");
  console.log("  /assessments + /activity : PASS");

  const shell = await request("/app", cookie);
  if (!shell.text.includes('href="/assessments"')) fail("Overview does not link to /assessments");
  if (!shell.text.includes("Recent activity")) fail("Overview recent activity surface missing");
  console.log("OVERVIEW CROSS-LINKS       : PASS");

  const access = await request("/access", cookie);
  assertPage(access, "/access", ["Access & plans", "Beli di Scalev", "RS-ASSESSMENT-V1"]);
  if (!access.text.includes("/api/scalev/checkout?sku=RS-ASSESSMENT-V1")) fail("All Tests Scalev CTA missing");
  if (!access.text.includes("/api/scalev/checkout?sku=RS-ALL-PROFILING-V1")) fail("Profiling Scalev CTA missing");
  if (!access.text.includes("/api/scalev/checkout?sku=RS-SINGLE-IQ-V1")) fail("Single Test IQ Scalev CTA missing");
  console.log("SCALEV COMMERCIAL CTA     : PASS");
  console.log("  Single Test / All Tests / Profiling : PASS");

  const checkoutNoConfig = await request("/api/scalev/checkout?sku=RS-ASSESSMENT-V1", cookie);
  if (getScalevCheckoutConfiguration().configuredSkus.includes("RS-ASSESSMENT-V1")) {
    if (![302, 303, 307, 308].includes(checkoutNoConfig.response.status)) fail(`configured Scalev checkout should redirect, got HTTP ${checkoutNoConfig.response.status}`);
    console.log("SCALEV CHECKOUT BRIDGE    : PASS (configured redirect)");
  } else {
    if (![302, 303, 307, 308].includes(checkoutNoConfig.response.status)) fail(`unconfigured Scalev checkout should return to Access & Plans, got HTTP ${checkoutNoConfig.response.status}`);
    console.log("SCALEV CHECKOUT BRIDGE    : PASS (safe configuration fallback)");
  }

  console.log("=== READY SCORE V7 L19F UX FIX ACTUAL RUNTIME E2E: PASS ===");
}
main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(async () => { await cleanup(); await disconnectFixtures(); });
