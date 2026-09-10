import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import net from "node:net";

const requestedBase = process.env.BASE_URL;
let baseUrl = requestedBase || "";
let server = null;

function fail(message) { throw new Error(message); }
async function request(pathname, options = {}) {
  const response = await fetch(`${baseUrl}${pathname}`, { redirect: "manual", ...options });
  return { response, text: await response.text() };
}
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
async function findFreePort(start = 3140) {
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

const email = `e2e_l19d_${Date.now()}@example.test`;
const password = "ReadyScore-L19D-2026!";

console.log("=== READY SCORE V7 L19D ADMIN INFORMATION ARCHITECTURE ACTUAL RUNTIME E2E ===");

try {
  if (requestedBase) {
    baseUrl = requestedBase.replace(/\/$/, "");
    console.log(`L19D runtime server : EXTERNAL (${baseUrl})`);
  } else {
    await startFresh();
    console.log(`L19D runtime server : FRESH NEXT START (${baseUrl})`);
  }
  console.log(`Base URL : ${baseUrl}`);

  let x = await request("/admin");
  if (x.response.status !== 307 && x.response.status !== 308) {
    fail(`unauthenticated /admin guard expected redirect, got ${x.response.status}`);
  }
  console.log("Unauthenticated admin guard : PASS");

  const register = await request("/api/auth/register", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name: "ReadyScore L19D Admin E2E", email, password }),
  });
  if (register.response.status !== 201) fail(`register failed ${register.response.status}: ${register.text}`);

  const authFile = path.join(process.cwd(), "data", "auth-state.json");
  const auth = JSON.parse(fs.readFileSync(authFile, "utf8"));
  const user = auth.users.find((item) => item.email === email);
  if (!user) fail("E2E admin fixture user missing");
  user.role = "ADMIN";
  fs.writeFileSync(authFile, JSON.stringify(auth, null, 2));

  const login = await request("/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (login.response.status !== 200) fail(`admin login failed ${login.response.status}: ${login.text}`);
  const setCookie = login.response.headers.get("set-cookie");
  if (!setCookie) fail("admin session cookie missing");
  const cookie = setCookie.split(";")[0];
  console.log("Authenticated admin session : PASS");

  const pages = [
    ["/admin", ["Admin Overview", "Question Bank", "Users & Access", "Integrations"]],
    ["/admin/question-bank", ["Question Bank", "RIASEC", "DISC", "EQ", "Cognitive"]],
    ["/admin/review", ["Review & Publishing", "Controlled publishing", "Audit trail"]],
    ["/admin/assessment-config", ["Assessment Configuration", "Instrument configuration"]],
    ["/admin/users", ["Users", "Role", "Active access"]],
    ["/admin/integrations", ["Integrations", "Scalev", "Webhook processing"]],
  ];

  // Fetching server-rendered HTML returns entity-escaped text (for example,
  // "Users & Access" becomes "Users &amp; Access"). Normalize the response
  // before marker assertions so runtime QA verifies the actual rendered text
  // rather than the HTML serialization detail.
  const normalizeHtmlText = (html) =>
    html
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");

  for (const [route, markers] of pages) {
    x = await request(route, { headers: { cookie } });
    if (x.response.status !== 200) fail(`${route} HTTP ${x.response.status}`);
    const renderedText = normalizeHtmlText(x.text);
    for (const marker of markers) {
      if (!renderedText.includes(marker)) fail(`${route} marker missing: ${marker}`);
    }
    console.log(`${route.padEnd(30)} : PASS`);
  }

  x = await request("/admin/riasec-review", { headers: { cookie } });
  if (x.response.status !== 200) fail(`/admin/riasec-review HTTP ${x.response.status}`);
  if (!normalizeHtmlText(x.text).includes("RIASEC Human Review")) fail("RIASEC review surface marker missing");
  console.log("/admin/riasec-review          : PASS");

  x = await request("/admin/question-bank");
  if (x.response.status !== 307 && x.response.status !== 308) fail("question bank unauthenticated guard missing");
  console.log("Admin route access boundary  : PASS");

  console.log("=== READY SCORE V7 L19D ADMIN INFORMATION ARCHITECTURE ACTUAL RUNTIME E2E: PASS ===");
  console.log(`E2E Admin Email : ${email}`);
} finally {
  await cleanup();
}
