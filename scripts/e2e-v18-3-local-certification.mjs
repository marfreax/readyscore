import { spawnSync } from "node:child_process";

const steps = [
  ["V17.11 Question Architecture gate", ["pnpm", "v17.11:architecture:gate"]],
  ["V18.0 Architecture gate", ["pnpm", "v18.0:gate"]],
  ["V18.1 Core Runtime gate", ["pnpm", "v18.1:gate"]],
  ["V18.2 Admin Inbox gate", ["pnpm", "v18.2:gate"]],
  ["V18.3 Production Certification static gate", ["pnpm", "v18.3:gate"]],
  ["V17.11 Question Architecture runtime regression", ["pnpm", "v17.11:regression"]],
  ["V18.1 WhatsApp Core Runtime E2E", ["pnpm", "e2e:v18.1:whatsapp"]],
  ["V18.2 Admin Inbox & Customer Context E2E", ["pnpm", "e2e:v18.2:admin-inbox"]],
  ["V17.6 Production Hardening E2E", ["pnpm", "e2e:v17:6:hardening"]],
  ["V18.3 New Hardening E2E", ["pnpm", "e2e:v18.3:hardening"]],
];

console.log("=== READY SCORE V18.3 LOCAL CERTIFICATION ===");
console.log("Production deployment is intentionally excluded. This gate certifies local runtime only.");

for (const [label, command] of steps) {
  console.log(`\n--- ${label} ---`);
  const result = spawnSync(command[0], command.slice(1), { stdio: "inherit", shell: false, env: process.env });
  if (result.status !== 0) {
    console.error(`\nV18.3 LOCAL CERTIFICATION: FAIL at ${label}`);
    process.exit(result.status || 1);
  }
}

console.log("\n=== READY SCORE V18.3 LOCAL CERTIFICATION — PASS ===");
console.log("V17.11 regression: PASS");
console.log("V18.1 core runtime: PASS");
console.log("V18.2 admin inbox/customer context: PASS");
console.log("V17.6 hardening regression: PASS");
console.log("V18.3 static certification: PASS");
console.log("Production smoke and real WhatsApp evidence: PENDING OPERATOR CERTIFICATION");
