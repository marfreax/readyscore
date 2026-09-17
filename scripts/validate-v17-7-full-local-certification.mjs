import fs from "node:fs";

const required = [
  ["V17.0 architecture gate", "scripts/validate-v17-0-architecture-contract.mjs"],
  ["V17.1 webhook gate", "scripts/validate-v17-1-whatsapp-webhook.mjs"],
  ["V17.2 persistence gate", "scripts/validate-v17-2-whatsapp-persistence.mjs"],
  ["V17.3 inbox gate", "scripts/validate-v17-3-admin-inbox.mjs"],
  ["V17.4 reply gate", "scripts/validate-v17-4-admin-reply.mjs"],
  ["V17.5 context gate", "scripts/validate-v17-5-business-lead-context.mjs"],
  ["V17.6 hardening gate", "scripts/validate-v17-6-production-hardening.mjs"],
  ["V17.1 webhook E2E", "scripts/e2e-v17-1-whatsapp-webhook.mjs"],
  ["V17.2 persistence E2E", "scripts/e2e-v17-2-whatsapp-persistence.mjs"],
  ["V17.3 inbox E2E", "scripts/e2e-v17-3-admin-inbox.mjs"],
  ["V17.4 reply E2E", "scripts/e2e-v17-4-admin-reply.mjs"],
  ["V17.5 context E2E", "scripts/e2e-v17-5-business-lead-context.mjs"],
  ["V17.6 hardening E2E", "scripts/e2e-v17-6-production-hardening.mjs"],
  ["V16 comprehensive certification", "scripts/e2e-v16-5-8-comprehensive-certification.mjs"],
];

const certificationRunner = fs.readFileSync("scripts/e2e-v17-7-full-local-certification.mjs", "utf8");
const forbidden = ["git push", "pm2 restart", "VPS pull", "scp ", "ssh "];


let failed = false;
for (const [name, file] of required) {
  if (!fs.existsSync(file)) {
    console.log(`${name}: FAIL — missing ${file}`);
    failed = true;
  } else {
    console.log(`${name}: READY`);
  }
}

const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));
for (const key of ["v17:7:gate", "e2e:v17:7:full-local"]) {
  if (!packageJson.scripts?.[key]) {
    console.log(`package script ${key}: FAIL`);
    failed = true;
  } else console.log(`package script ${key}: PASS`);
}

for (const token of forbidden) {
  if (certificationRunner.toLowerCase().includes(token.toLowerCase())) {
    console.log(`production boundary certification runner / ${token}: FAIL`);
    failed = true;
  }
}
console.log("production deployment boundary: PASS");

if (failed) process.exit(1);
console.log("V17.7 Full Local Certification static gate: PASS");
