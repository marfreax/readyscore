import "./lib-e2e-env.mjs";
import { spawn } from "node:child_process";
import net from "node:net";
import { hasAdminE2EAuth, hasCustomerE2EAuth } from "./lib-e2e-env.mjs";

let baseUrl = (process.env.READYSCORE_BASE_URL || process.env.BASE_URL || "").replace(/\/$/, "");
let server = null;
let serverOwned = false;
const skipped = [];

function fail(message) { throw new Error(message); }
function sleep(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }

async function findFreePort(start = 3460) {
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

async function waitForServer(url, timeoutMs = 30000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(`${url}/`, { redirect: "manual" });
      if (response.status >= 200 && response.status < 500) return;
    } catch {}
    await sleep(250);
  }
  fail(`local Next.js server did not become ready at ${url}`);
}

async function startFresh() {
  const port = await findFreePort();
  baseUrl = `http://127.0.0.1:${port}`;
  serverOwned = true;
  server = spawn("pnpm", ["exec", "next", "start", "-p", String(port)], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      BASE_URL: baseUrl,
      READYSCORE_BASE_URL: baseUrl,
      READYSCORE_PUBLIC_URL: baseUrl,
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  server.stdout?.on("data", (chunk) => process.stdout.write(`[next] ${chunk}`));
  server.stderr?.on("data", (chunk) => process.stderr.write(`[next] ${chunk}`));
  await waitForServer(baseUrl);
}

async function ensureServer() {
  if (baseUrl) {
    await waitForServer(baseUrl);
    console.log(`Base URL : ${baseUrl}`);
    console.log("Server  : using configured/external local server");
    return;
  }
  await startFresh();
  console.log(`Base URL : ${baseUrl}`);
  console.log("Server  : fresh local Next.js production server");
}

async function run(name, args = []) {
  console.log(`\n>>> ${name} ${args.join(" ")}`);
  await new Promise((resolve, reject) => {
    const child = spawn("pnpm", [name, ...args], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        BASE_URL: baseUrl,
        READYSCORE_BASE_URL: baseUrl,
        READYSCORE_PUBLIC_URL: baseUrl,
      },
      stdio: "inherit",
    });
    child.on("error", reject);
    child.on("exit", (code) => code === 0 ? resolve() : reject(new Error(`${name} exited with code ${code}`)));
  });
}

async function checkAdminLeadVisibility() {
  const email = (process.env.READYSCORE_ADMIN_E2E_EMAIL || process.env.ADMIN_EMAIL || "").trim();
  const password = process.env.READYSCORE_ADMIN_E2E_PASSWORD || process.env.ADMIN_PASSWORD || "";
  if (!email || !password) {
    skipped.push("ADMIN AUTHORIZATION / LEAD VISIBILITY");
    console.log("ADMIN AUTHORIZATION: SKIPPED — authorized-admin E2E credentials not configured");
    return;
  }

  const unauth = await fetch(`${baseUrl}/api/admin/leads`, { redirect: "manual" });
  if (![401, 403].includes(unauth.status)) fail(`admin leads unauthenticated boundary expected 401/403, got ${unauth.status}`);

  const login = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!login.ok) fail(`admin login failed: ${login.status}`);
  const setCookie = typeof login.headers.getSetCookie === "function" ? login.headers.getSetCookie() : [login.headers.get("set-cookie") || ""];
  const cookieLine = setCookie.find((value) => value.includes("readyscore_session=")) || "";
  const cookieMatch = cookieLine.match(/readyscore_session=([^;]+)/);
  if (!cookieMatch) fail("admin session cookie missing");
  const cookie = `readyscore_session=${cookieMatch[1]}`;

  const page = await fetch(`${baseUrl}/admin/leads`, { headers: { cookie } });
  if (!page.ok) fail(`admin leads page failed: ${page.status}`);
  const html = await page.text();
  if (!html.includes("Business Leads") || !html.includes("FREE_ASSESSMENT")) fail("admin leads page markers missing");

  const api = await fetch(`${baseUrl}/api/admin/leads?page=1&pageSize=25`, { headers: { cookie, accept: "application/json" } });
  if (!api.ok) fail(`admin leads API failed: ${api.status}`);
  const body = await api.json().catch(() => null);
  if (!body?.ok || !Array.isArray(body.leads) || !body.pagination) fail("admin leads API payload invalid");
  console.log("ADMIN AUTHORIZATION: PASS");
  console.log("ADMIN LEAD VISIBILITY: PASS");
}

async function main() {
  console.log("=== READY SCORE V16.5–V16.8 COMPREHENSIVE E2E CERTIFICATION ===");
  console.log("Purpose  : Definition of Done verification before production");
  console.log("Mutation : E2E test data only; no production deployment");
  console.log("Env      : shell environment wins; local .env/.env.local used only for missing E2E variables");

  await run("v16:5:gate");
  console.log("V16.5 PDF CONTRACT: PASS");
  await run("v16:6:gate");
  console.log("V16.6 DELIVERY CONTRACT: PASS");
  await run("v16:7:gate");
  console.log("V16.7 BUSINESS LEAD CONTRACT: PASS");
  await run("v16:8:gate");
  console.log("V16.8 FULL FUNNEL CONTRACT: PASS");
  await run("v16:8:4:gate");
  console.log("V16.8.4 WHATSAPP COPY REGRESSION: PASS");

  await run("v15.2:gate");
  console.log("V15.2 CUSTOMER REPORT CONTRACT: PASS");

  await ensureServer();

  if (hasCustomerE2EAuth()) {
    await run("e2e:v15.2:customer");
    console.log("V15.2 REGRESSION: PASS");
  } else {
    skipped.push("V15.2 CUSTOMER REGRESSION");
    console.log("V15.2 REGRESSION: SKIPPED — customer E2E credentials/session cookie not configured");
  }

  await run("e2e:v16:8:full-funnel");
  console.log("V16.5 PDF: PASS (covered by full funnel PDF generation/download)");
  console.log("V16.6 DELIVERY: PASS (covered by full funnel delivery runtime)");
  console.log("V16.7 BUSINESS LEAD: PASS (covered by full funnel create/reuse/consent/source runtime)");
  console.log("V16.8 FULL FUNNEL: PASS");

  await checkAdminLeadVisibility();

  console.log("ANALYTICS: PASS (funnel events verified in full funnel)");
  console.log("PREMIUM OFFER: PASS (result page premium offer verified in full funnel)");

  if (hasCustomerE2EAuth()) {
    console.log("CHECKOUT: PASS (authenticated checkout verified in full funnel)");
    console.log("ENTITLEMENT: PASS (authenticated entitlement endpoint verified in full funnel)");
  } else {
    skipped.push("CHECKOUT / ENTITLEMENT");
    console.log("CHECKOUT: SKIPPED — authenticated E2E credentials not configured");
    console.log("ENTITLEMENT: SKIPPED — authenticated E2E credentials not configured");
  }

  if (skipped.length) {
    console.log("=== READY SCORE V16.5–V16.8 COMPREHENSIVE E2E CERTIFICATION: INCOMPLETE ===");
    console.log(`Skipped prerequisites: ${skipped.join("; ")}`);
    console.log("Production deployment is NOT performed by this suite.");
    process.exitCode = 2;
    return;
  }

  console.log("=== READY SCORE V16.5–V16.8 COMPREHENSIVE E2E CERTIFICATION: PASS ===");
  console.log("Production deployment is NOT performed by this suite.");
}

main().catch((error) => {
  console.error("=== READY SCORE V16.5–V16.8 COMPREHENSIVE E2E CERTIFICATION: FAIL ===");
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}).finally(async () => {
  if (serverOwned && server && !server.killed) {
    server.kill("SIGTERM");
    await sleep(500);
    if (!server.killed) server.kill("SIGKILL");
  }
});
