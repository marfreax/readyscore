import { spawn } from "node:child_process";
import net from "node:net";

const requestedBase = process.env.BASE_URL;
let server = null;
let baseUrl = requestedBase || "";
function fail(message) { throw new Error(message); }
async function waitForServer(url, timeoutMs = 30000) {
  const started = Date.now();
  let lastError = "unknown";
  while (Date.now() - started < timeoutMs) {
    try {
      const r = await fetch(`${url}/`, { redirect: "manual" });
      if (r.status >= 200 && r.status < 500) return;
      lastError = `HTTP ${r.status}`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  fail(`local Next.js server did not become ready: ${lastError}`);
}
async function findFreePort(start = 3120) {
  for (let port = start; port < start + 100; port += 1) {
    const ok = await new Promise((resolve) => {
      const socket = net.createServer();
      socket.once("error", () => resolve(false));
      socket.once("listening", () => socket.close(() => resolve(true)));
      socket.listen(port, "127.0.0.1");
    });
    if (ok) return port;
  }
  fail("Could not find a free local port for L19A runtime E2E.");
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
process.once("SIGINT", async () => { await cleanup(); process.exit(130); });
process.once("SIGTERM", async () => { await cleanup(); process.exit(143); });
try {
  if (requestedBase) {
    baseUrl = requestedBase.replace(/\/$/, "");
    console.log(`L19A runtime server : EXTERNAL (${baseUrl})`);
  } else {
    await startFresh();
    console.log(`L19A runtime server : FRESH NEXT START (${baseUrl})`);
  }
  await new Promise((resolve, reject) => {
    const child = spawn("node", ["scripts/e2e-v7-l19a-customer-shell-navigation-runtime.mjs"], {
      cwd: process.cwd(),
      env: { ...process.env, BASE_URL: baseUrl },
      stdio: "inherit",
    });
    child.once("error", reject);
    child.once("exit", (code, signal) => code === 0 ? resolve() : reject(new Error(`L19A runtime failed: code=${code} signal=${signal ?? "none"}`)));
  });
} finally {
  await cleanup();
}
