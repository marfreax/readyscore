import { spawn } from "node:child_process";

const commands = [
  ["v17.11:architecture:gate", "Architecture Freeze"],
  ["v17.10.1:admin:gate", "V17.10.1 Admin Gate"],
  ["v17.10:runtime:gate", "V17.10 Runtime Gate"],
  ["v17.10:free-premium:contract", "Free/Premium Contract"],
  ["typecheck", "Typecheck"],
  ["build", "Build"],
];

function run(script, label) {
  return new Promise((resolve, reject) => {
    console.log(`\n=== ${label} ===`);
    const child = spawn("pnpm", [script], {
      cwd: process.cwd(),
      env: process.env,
      stdio: "inherit",
    });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${script} exited with code ${code}`));
    });
  });
}

async function main() {
  console.log("=== READY SCORE V17.11 FREEZE CHECK ===");
  console.log("No database migration, data deletion, or production deployment is performed.");

  for (const [script, label] of commands) await run(script, label);

  console.log("\nV17.11 FREEZE STATIC/BUILD GATE — PASS");
  console.log("Next: run pnpm v17.11:regression against the locally running production build.");
  console.log("Paid mutating E2E remains an explicit separate regression action.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
