import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const baseUrl = process.env.BASE_URL ?? "http://localhost:3000";

function fail(message) { throw new Error(message); }

async function fetchStatus(pathname, expected) {
  const response = await fetch(`${baseUrl}${pathname}`, { redirect: "manual" });
  if (!expected.includes(response.status)) {
    fail(`${pathname}: expected HTTP ${expected.join("/")}, received ${response.status}`);
  }
  return response;
}

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: root, stdio: "inherit", env: process.env });
    child.on("error", reject);
    child.on("exit", (code) => code === 0 ? resolve() : reject(new Error(`${command} ${args.join(" ")} exited with ${code}`)));
  });
}

async function main() {
  console.log("=== READY SCORE V6 L12 LAUNCH QA ACTUAL RUNTIME ===");
  console.log(`Base URL : ${baseUrl}`);
  console.log("Mode     : REAL HTTP + REAL PostgreSQL runtime");
  console.log("Scope    : launch surface + frozen regressions + paid customer journey");

  const publicPages = [
    "/",
    "/trial/riasec",
    "/trial/eq",
    "/trial/disc",
    "/trial/cognitive",
    "/app",
    "/profile",
    "/reports",
  ];
  for (const pathname of publicPages) await fetchStatus(pathname, [200, 302, 307]);
  console.log("Public/customer route reachability : PASS");

  const catalog = await fetch(`${baseUrl}/api/commercial/catalog`);
  if (!catalog.ok) fail(`Commercial catalog failed: HTTP ${catalog.status}`);
  const catalogBody = await catalog.json().catch(() => null);
  if (!catalogBody?.ok) fail("Commercial catalog response is not ok.");
  console.log("Commercial catalog API             : PASS");

  const tests = await fetch(`${baseUrl}/api/test-catalog`);
  if (!tests.ok) fail(`Test catalog failed: HTTP ${tests.status}`);
  const testsBody = await tests.json().catch(() => null);
  if (!testsBody?.ok) fail("Test catalog response is not ok.");
  console.log("Test catalog API                   : PASS");

  const unauthEntitlements = await fetch(`${baseUrl}/api/commercial/entitlements`);
  if (![401, 403].includes(unauthEntitlements.status)) fail(`Unauthenticated entitlement boundary failed: HTTP ${unauthEntitlements.status}`);
  console.log("Unauthenticated entitlement guard  : PASS");

  const unauthProfile = await fetch(`${baseUrl}/api/profile/cross-test`);
  if (![401, 403].includes(unauthProfile.status)) fail(`Unauthenticated profile boundary failed: HTTP ${unauthProfile.status}`);
  console.log("Unauthenticated profile guard       : PASS");

  const checks = [
    ["release:hardening:gate", []],
    ["commercial:gate", []],
    ["v6:l11:gate", []],
    ["e2e:riasec", []],
    ["e2e:result", []],
    ["e2e:reassessment", []],
    ["e2e:upgrade", []],
    ["e2e:profiling", []],
    ["e2e:paid", []],
  ];

  for (const [script, args] of checks) {
    console.log(`--- ${script} ---`);
    await run("pnpm", [script, ...args]);
  }

  console.log("Frozen RIASEC regression            : PASS");
  console.log("Result/reassessment/upgrade/profile : PASS");
  console.log("Paid customer E2E                   : PASS");
  console.log("=== READY SCORE V6 L12 LAUNCH QA ACTUAL RUNTIME: PASS ===");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
