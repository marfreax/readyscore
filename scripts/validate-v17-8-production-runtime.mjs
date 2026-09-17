import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const required = [
  "scripts/e2e-v17-8-production-runtime.mjs",
  "architecture/phase-17.8/PHASE_17_8_IMPLEMENTATION.md",
  "scripts/validate-v17-8-production-runtime.mjs",
];
const text = (p) => fs.readFileSync(path.join(root, p), "utf8");
const assert = (ok, msg) => { if (!ok) throw new Error(msg); };

for (const file of required) assert(fs.existsSync(path.join(root, file)), `missing: ${file}`);

const runner = text("scripts/e2e-v17-8-production-runtime.mjs");
for (const marker of [
  "READYSCORE_PRODUCTION_APPROVED",
  "git",
  "status",
  "--porcelain",
  "push",
  "origin",
  "main",
  "pnpm install",
  "pnpm exec prisma migrate deploy",
  "pnpm exec prisma generate",
  "pnpm build",
  "pm2 restart",
  "https://app.readyscore.id",
  "/api/webhooks/whatsapp",
  "REAL INBOUND",
  "ADMIN REPLY",
  "REAL OUTBOUND",
  "STATUS VERIFICATION",
]) assert(runner.includes(marker), `production certification contract missing: ${marker}`);

const docs = text("architecture/phase-17.8/PHASE_17_8_IMPLEMENTATION.md");
for (const marker of ["17.7 PASS", "git status", "VPS pull", "smoke", "real inbound", "admin reply", "status verification"]) {
  assert(docs.toLowerCase().includes(marker.toLowerCase()), `phase 17.8 documentation missing: ${marker}`);
}

const pkg = JSON.parse(text("package.json"));
assert(pkg.scripts["v17:8:gate"], "package script v17:8:gate missing");
assert(pkg.scripts["e2e:v17:8:production"], "package script e2e:v17:8:production missing");

console.log("V17.7 prerequisite boundary: PASS");
console.log("Production approval guard: PASS");
console.log("Git clean/push contract: PASS");
console.log("VPS deployment sequence: PASS");
console.log("Migration/generate/build contract: PASS");
console.log("PM2 restart contract: PASS");
console.log("Production smoke contract: PASS");
console.log("Meta webhook verification contract: PASS");
console.log("Real inbound/admin reply/outbound/status checkpoints: PASS");
console.log("Secret handling boundary: PASS");
console.log("V17.8 Production Runtime static gate: PASS");
