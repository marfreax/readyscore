import fs from "node:fs";
import { spawn } from "node:child_process";
import net from "node:net";

const requestedBase = process.env.BASE_URL?.replace(/\/$/, "") || "";
let baseUrl = requestedBase;
let server = null;

function fail(message) { throw new Error(`V17.10.1 Admin E2E failed: ${message}`); }
async function freePort(start = 3760) {
  for (let port = start; port < start + 100; port++) {
    const ok = await new Promise((resolve) => {
      const s = net.createServer();
      s.once("error", () => resolve(false));
      s.once("listening", () => s.close(() => resolve(true)));
      s.listen(port, "127.0.0.1");
    });
    if (ok) return port;
  }
  fail("could not find a free local port");
}
async function waitForServer(url, timeoutMs = 30000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const r = await fetch(`${url}/`, { redirect: "manual" });
      if (r.status >= 200 && r.status < 500) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  fail("local Next.js server did not become ready");
}
async function startFresh() {
  const port = await freePort();
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
async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, { redirect: "manual", ...options });
  return { response, text: await response.text() };
}
function json(text, label) {
  try { return JSON.parse(text); } catch { fail(`${label}: invalid JSON`); }
}

async function main() {
  console.log("=== READY SCORE V17.10.1 ADMIN CONFIGURATION E2E ===");
  console.log("Scope : operational configuration boundary + legacy exclusion + historical safety");
  console.log("Mutation : read-only runtime verification");

  if (!requestedBase) await startFresh();
  console.log(`Base URL : ${baseUrl}`);

  let r = await request("/admin/assessment-config");
  if (![302, 307, 308].includes(r.response.status)) fail(`unauthenticated admin page expected redirect, got ${r.response.status}`);
  console.log("Unauthenticated Admin guard          : PASS");

  r = await request("/api/admin/assessment-config");
  if (r.response.status !== 401) fail(`unauthenticated Admin API expected 401, got ${r.response.status}`);
  console.log("Unauthenticated Admin API guard     : PASS");

  // The source-level finishing gate is the authoritative contract for the Admin operational boundary.
  const gate = spawn("pnpm", ["v17.10.1:admin:gate"], { cwd: process.cwd(), env: process.env, stdio: "inherit" });
  const gateCode = await new Promise((resolve, reject) => {
    gate.once("error", reject);
    gate.once("exit", (code) => resolve(code ?? 1));
  });
  if (gateCode !== 0) fail(`Admin finishing gate exited with ${gateCode}`);
  console.log("Admin operational contract gate       : PASS");

  // Verify the canonical codes directly from source without touching historical rows.
  const repo = fs.readFileSync("lib/assessment-configuration-repository.ts", "utf8");
  for (const code of ["free-v1", "riasec-v1", "disc-v1", "eq-v1", "cognitive-v1"]) {
    if (!repo.includes(`"${code}"`)) fail(`canonical code missing: ${code}`);
  }
  console.log("Five canonical operational codes      : PASS");

  console.log("=== READY SCORE V17.10.1 ADMIN CONFIGURATION E2E: PASS ===");
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(cleanup);
