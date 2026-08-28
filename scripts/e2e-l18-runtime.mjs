import { spawn } from "node:child_process";
import net from "node:net";

const requestedBase = process.env.BASE_URL;
let server = null;
let baseUrl = requestedBase || "";

function fail(message) {
  throw new Error(message);
}

async function waitForServer(url, timeoutMs = 30000) {
  const started = Date.now();
  let lastError = "unknown";
  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(`${url}/`, { redirect: "manual" });
      if (response.status >= 200 && response.status < 500) return;
      lastError = `HTTP ${response.status}`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  fail(`local Next.js server did not become ready: ${lastError}`);
}

async function findFreePort(start = 3101) {
  for (let port = start; port < start + 100; port += 1) {
    const available = await new Promise((resolve) => {
      const probe = net.createServer();
      probe.once("error", () => resolve(false));
      probe.once("listening", () => probe.close(() => resolve(true)));
      probe.listen(port, "127.0.0.1");
    });
    if (available) return port;
  }
  fail("Could not find a free local port for L18 runtime E2E.");
}

async function startFreshProductionServer() {
  const port = await findFreePort();
  baseUrl = `http://127.0.0.1:${port}`;
  server = spawn("pnpm", ["exec", "next", "start", "-p", String(port)], {
    cwd: process.cwd(),
    env: { ...process.env, BASE_URL: baseUrl },
    stdio: ["ignore", "pipe", "pipe"],
  });

  let stdout = "";
  let stderr = "";
  server.stdout?.on("data", (chunk) => {
    stdout += chunk.toString();
    process.stdout.write(`[next] ${chunk}`);
  });
  server.stderr?.on("data", (chunk) => {
    stderr += chunk.toString();
    process.stderr.write(`[next] ${chunk}`);
  });
  server.once("exit", (code, signal) => {
    if (code !== 0 && code !== null) {
      process.stderr.write(`\n[next] exited early: code=${code} signal=${signal}\n${stdout}${stderr}\n`);
    }
  });

  await waitForServer(baseUrl);
}

async function runScript(script) {
  await new Promise((resolve, reject) => {
    const child = spawn("node", [script], {
      cwd: process.cwd(),
      env: { ...process.env, BASE_URL: baseUrl },
      stdio: "inherit",
    });
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (code === 0) resolve();
      else reject(new Error(`${script} failed: code=${code} signal=${signal ?? "none"}`));
    });
  });
}

async function cleanup() {
  if (!server || server.killed) return;
  server.kill("SIGTERM");
  await new Promise((resolve) => setTimeout(resolve, 250));
  if (!server.killed) server.kill("SIGKILL");
}

process.once("SIGINT", async () => { await cleanup(); process.exit(130); });
process.once("SIGTERM", async () => { await cleanup(); process.exit(143); });

try {
  if (requestedBase) {
    baseUrl = requestedBase.replace(/\/$/, "");
    console.log(`L18 runtime server    : EXTERNAL (${baseUrl})`);
  } else {
    await startFreshProductionServer();
    console.log(`L18 runtime server    : FRESH NEXT START (${baseUrl})`);
  }

  await runScript("scripts/e2e-v7-l18-customer-page-completion-runtime.mjs");
  await runScript("scripts/e2e-result-experience-runtime.mjs");
} finally {
  await cleanup();
}
