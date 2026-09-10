import { spawn } from "node:child_process";

const run = (command, args) => new Promise((resolve, reject) => {
  console.log(`\n>>> ${command} ${args.join(" ")}`);
  const child = spawn(command, args, {
    cwd: process.cwd(),
    env: { ...process.env },
    stdio: "inherit",
  });
  child.on("error", reject);
  child.on("exit", (code) => code === 0 ? resolve() : reject(new Error(`${command} ${args.join(" ")} exited with code ${code}`)));
});

const main = async () => {
  console.log("=== READY SCORE V9.15 FINAL ACCEPTANCE / FREEZE ACTUAL RUNTIME ===");
  console.log("Mode     : Real development-environment acceptance chain");
  console.log("Baseline : V9.14");
  console.log("Mutation : Acceptance verification only; no schema/question-bank/scoring mutation");

  const gates = [
    "v9:0:gate","v9:1:gate","v9:2:gate","v9:3:gate","v9:4:gate",
    "v9:5:gate","v9:6:gate","v9:7:gate","v9:8:gate","v9:9:gate",
    "v9:10:gate","v9:11:gate","v9:12:gate","v9:13:gate","v9:14:gate",
  ];

  await run("pnpm", ["typecheck"]);
  console.log("TYPECHECK : PASS");
  await run("pnpm", ["build"]);
  console.log("BUILD     : PASS");

  for (const gate of gates) await run("pnpm", [gate]);
  console.log("V9.0–V9.14 CONTRACT GATES : PASS");

  await run("pnpm", ["e2e:v9:14:full-customer"]);
  console.log("V9.14 FULL CUSTOMER RUNTIME : PASS");

  await run("pnpm", ["v9:15:gate"]);
  console.log("V9.15 CONTRACT GATE : PASS");

  console.log("=== READY SCORE V9.15 FINAL ACCEPTANCE / FREEZE ACTUAL RUNTIME: PASS ===");
  console.log("FROZEN BASELINE: V9.14 + V9.15 ACCEPTANCE/FREEZE BOUNDARY");
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
