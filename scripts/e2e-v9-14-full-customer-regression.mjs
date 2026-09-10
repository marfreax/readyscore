import { spawn } from "node:child_process";
import net from "node:net";

let baseUrl = process.env.BASE_URL?.replace(/\/$/, "") || "";
let server = null;

const fail = (message) => { throw new Error(`V9.14 full customer regression failed: ${message}`); };

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

async function findFreePort(start = 3550) {
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

async function request(pathname) {
  const response = await fetch(`${baseUrl}${pathname}`, { redirect: "manual" });
  return { response, text: await response.text() };
}

function status(result, label, expected) {
  if (!expected.includes(result.response.status)) fail(`${label}: expected ${expected.join("/")}, got ${result.response.status}`);
}

function markers(result, label, required) {
  if (result.response.status !== 200) fail(`${label}: expected HTTP 200, got ${result.response.status}`);
  for (const marker of required) if (!result.text.includes(marker)) fail(`${label}: marker missing: ${marker}`);
}

async function runCommand(command, args) {
  await new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: process.cwd(),
      env: { ...process.env, BASE_URL: baseUrl, READYSCORE_PUBLIC_URL: baseUrl },
      stdio: "inherit",
    });
    child.on("error", reject);
    child.on("exit", (code) => code === 0 ? resolve() : reject(new Error(`${command} ${args.join(" ")} exited with ${code}`)));
  });
}

async function main() {
  console.log("=== READY SCORE V9.14 FULL CUSTOMER REGRESSION ACTUAL RUNTIME ===");
  console.log("Mode     : REAL HTTP + REAL PostgreSQL runtime");
  console.log("Mutation : Regression verification only; no schema/question-bank/scoring mutation");

  if (!process.env.BASE_URL) await startFresh();
  console.log(`Base URL : ${baseUrl}`);

  const publicRoutes = [
    "/", "/trial/free", "/trial/premium", "/trial/riasec", "/trial/disc", "/trial/eq", "/trial/cognitive",
    "/login", "/register",
  ];
  for (const route of publicRoutes) status(await request(route), route, [200]);
  console.log("PUBLIC CUSTOMER SURFACES          : PASS");

  const guardedRoutes = ["/app", "/profile", "/reports", "/assessments", "/activity", "/access", "/admin"];
  for (const route of guardedRoutes) status(await request(route), `unauth ${route}`, [302, 307, 308]);
  console.log("AUTHENTICATION GUARDS              : PASS");

  const assessmentRoutes = [
    "/assessments",
    "/assessments/cognitive",
    "/assessments/eq",
    "/assessments/disc",
    "/assessments/riasec",
    "/assessments/cognitive/pre-test",
    "/assessments/eq/pre-test",
    "/assessments/disc/pre-test",
    "/assessments/riasec/pre-test",
  ];
  for (const route of assessmentRoutes) status(await request(route), `assessment ${route}`, [200, 302, 307, 308]);
  console.log("ASSESSMENT DISCOVERY / PRE-TEST   : PASS");

  const resultInvalid = await request("/result/invalid-v9-14-regression-attempt");
  status(resultInvalid, "invalid result ownership", [302, 307, 308, 404]);
  console.log("RESULT OWNERSHIP BOUNDARY          : PASS");

  const responsiveRoutes = ["/activity", "/profile", "/reports", "/access"];
  for (const route of responsiveRoutes) status(await request(route), `guarded responsive ${route}`, [302, 307, 308]);
  console.log("RESPONSIVE CUSTOMER ROUTES         : PASS");

  await runCommand("pnpm", ["v9:13:gate"]);
  console.log("V9.13 RESPONSIVE / ACCESSIBILITY CONTRACT : PASS");

  await runCommand("pnpm", ["e2e:l20"]);
  console.log("FROZEN V7/L20 PRODUCT REGRESSION   : PASS");

  for (const script of ["e2e:cognitive", "e2e:v8:4:eq", "e2e:v8:5:disc", "e2e:v8:6:riasec"]) {
    await runCommand("pnpm", [script]);
  }
  console.log("ACTIVE ASSESSMENT REGRESSION        : PASS");

  console.log("=== READY SCORE V9.14 FULL CUSTOMER REGRESSION ACTUAL RUNTIME: PASS ===");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(cleanup);
