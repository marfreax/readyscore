import { spawn } from "node:child_process";
import net from "node:net";

const baseFromEnv = process.env.BASE_URL?.replace(/\/$/, "");
let baseUrl = baseFromEnv || "";
let server = null;

const TYPES = ["free", "riasec", "disc", "eq", "cognitive"];
const PAID = new Set(["riasec", "disc", "eq", "cognitive"]);

function fail(message) { throw new Error(`V17.11 runtime regression failed: ${message}`); }

async function findFreePort(start = 3450) {
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
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  fail("local Next.js server did not become ready");
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
  await new Promise((resolve) => setTimeout(resolve, 300));
  if (!server.killed) server.kill("SIGKILL");
}

async function request(type, cookie = "") {
  const response = await fetch(`${baseUrl}/api/assessment/start`, {
    method: "POST",
    headers: { "content-type": "application/json", ...(cookie ? { cookie } : {}) },
    body: JSON.stringify({ type }),
  });
  let body = null;
  try { body = await response.json(); } catch {}
  return { response, body };
}

function assertFree(body, response) {
  if (!response.ok || !body?.ok) fail(`free start: HTTP ${response.status} ${JSON.stringify(body)}`);
  if (!body.attemptId) fail("free start: attemptId missing");
  if (!Array.isArray(body.questions) || body.questions.length === 0) fail("free start: questions missing");
  if (!body.snapshot?.assessmentConfigurationVersion) fail("free start: configuration snapshot missing");
  if (!body.snapshot?.package?.packageVersionId) fail("free start: package snapshot missing");
  if (body.snapshot.selectedQuestionVersionIds?.length !== body.questions.length) {
    fail("free start: selectedQuestionVersionIds mismatch");
  }
}

async function main() {
  console.log("=== READY SCORE V17.11 QUESTION ARCHITECTURE RUNTIME REGRESSION ===");
  console.log("Mode: read-safe HTTP regression; no database fixtures are created.");
  if (!baseUrl) await startFresh();
  console.log(`Base URL: ${baseUrl}`);

  const free = await request("free");
  assertFree(free.body, free.response);
  console.log("FREE start + package + snapshot : PASS");

  for (const type of TYPES.filter((value) => PAID.has(value))) {
    const result = await request(type);
    if (result.response.status !== 422 || result.body?.error?.code !== "AUTHENTICATION_REQUIRED") {
      fail(`${type}: unauthenticated contract changed: HTTP ${result.response.status} ${JSON.stringify(result.body)}`);
    }
    console.log(`${type.toUpperCase()} unauthenticated access guard : PASS`);
  }

  console.log("V17.11 read-safe runtime regression : PASS");
  console.log("");
  console.log("Paid start/answer/submit/scoring regression is intentionally opt-in because it consumes real entitlements and writes attempts.");
  console.log("To run that existing mutating suite, use the established paid E2E commands separately.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(cleanup);
