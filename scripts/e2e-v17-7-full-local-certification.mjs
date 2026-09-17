import { spawn } from "node:child_process";

const steps = [
  ["v17:0:gate", "V17.0 architecture contract"],
  ["v17:1:gate", "V17.1 webhook static gate"],
  ["v17:2:gate", "V17.2 persistence static gate"],
  ["v17:3:gate", "V17.3 inbox static gate"],
  ["v17:4:gate", "V17.4 reply static gate"],
  ["v17:5:gate", "V17.5 context static gate"],
  ["v17:6:gate", "V17.6 hardening static gate"],
  ["e2e:v16:5-8:certification", "V15.2 + V16.5–V16.8 comprehensive regression"],
  ["e2e:v17:1:webhook", "V17.1 webhook runtime"],
  ["e2e:v17:2:persistence", "V17.2 persistence runtime"],
  ["e2e:v17:3:inbox", "V17.3 inbox runtime"],
  ["e2e:v17:4:reply", "V17.4 admin reply runtime"],
  ["e2e:v17:5:context", "V17.5 Business Lead/context runtime"],
  ["e2e:v17:6:hardening", "V17.6 production hardening runtime"],
];

function run(script) {
  return new Promise((resolve, reject) => {
    console.log(`\n>>> pnpm ${script}`);
    const child = spawn("pnpm", script.split(" "), {
      cwd: process.cwd(),
      env: { ...process.env, READYSCORE_V17_LOCAL_CERTIFICATION: "1" },
      stdio: "inherit",
    });
    child.on("error", reject);
    child.on("exit", (code, signal) => {
      if (code === 0) resolve();
      else reject(new Error(`${script} failed with code ${code ?? "null"}${signal ? ` signal ${signal}` : ""}`));
    });
  });
}

try {
  console.log("=== READY SCORE V17 FULL LOCAL E2E CERTIFICATION ===");
  console.log("Purpose : certify V15.2 + V16.5–V16.8 regression and V17.0–V17.6 locally");
  console.log("Scope   : local only; no deployment or production mutation");
  console.log("Order   : static contracts → legacy regression → V17 runtime sequence");

  for (const [script, label] of steps) {
    await run(script);
    console.log(`${label}: PASS`);
  }

  console.log("\n=== READY SCORE V17 FULL LOCAL E2E CERTIFICATION: PASS ===");
  console.log("Production deployment is NOT performed by this suite.");
  console.log("Next phase: V17.8 Production Deployment & Runtime Certification.");
} catch (error) {
  console.error("\n=== READY SCORE V17 FULL LOCAL E2E CERTIFICATION: FAIL ===");
  console.error(error instanceof Error ? error.message : error);
  console.error("Production deployment is NOT performed by this suite.");
  process.exitCode = 1;
}
