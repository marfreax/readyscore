import { spawnSync } from "node:child_process";
import readline from "node:readline/promises";
import process from "node:process";

const host = process.env.READYSCORE_VPS_HOST || "139.190.96.89";
const user = process.env.READYSCORE_VPS_USER || "adminready";
const remotePath = process.env.READYSCORE_VPS_PATH || "/var/www/readyscore";
const pm2App = process.env.READYSCORE_PM2_APP || "readyscore";
const baseUrl = process.env.READYSCORE_PRODUCTION_URL || "https://app.readyscore.id";
const sshOptions = process.env.READYSCORE_SSH_OPTIONS || "";
const approved = process.env.READYSCORE_PRODUCTION_APPROVED === "YES";

function fail(message) {
  console.error(`\nV17.8 PRODUCTION RUNTIME: FAIL\n${message}`);
  process.exit(1);
}
function runLocal(cmd, args, options = {}) {
  const r = spawnSync(cmd, args, { stdio: "inherit", shell: false, ...options });
  if (r.status !== 0) fail(`${cmd} ${args.join(" ")} failed with code ${r.status}`);
}
function ssh(command, options = {}) {
  const args = [];
  if (sshOptions.trim()) args.push(...sshOptions.trim().split(/\s+/));
  args.push(`${user}@${host}`, `cd ${shellQuote(remotePath)} && ${command}`);
  return spawnSync("ssh", args, { stdio: "inherit", shell: false, ...options });
}
function shellQuote(value) { return `'${String(value).replaceAll("'", "'\\''")}'`; }
function assertCleanGit() {
  const r = spawnSync("git", ["status", "--porcelain"], { encoding: "utf8" });
  if (r.status !== 0) fail("git status failed.");
  if (r.stdout.trim()) fail("Working tree is not clean. Commit changes first; production deployment is blocked.");
}
async function ask(rl, prompt) {
  const answer = (await rl.question(`${prompt}\nType YES to confirm: `)).trim();
  if (answer !== "YES") fail("Certification stopped; required confirmation was not provided.");
}

console.log("=== READY SCORE V17.8 PRODUCTION DEPLOYMENT & RUNTIME CERTIFICATION ===");
console.log(`Target : ${baseUrl}`);
console.log(`VPS    : ${user}@${host}:${remotePath}`);
console.log(`PM2    : ${pm2App}`);
console.log("Rule   : V17.7 PASS is a prerequisite; real WhatsApp traffic is mandatory.");

if (!approved) fail("Production approval guard is active. Set READYSCORE_PRODUCTION_APPROVED=YES only after confirming V17.7 PASS and intended production deployment.");

console.log("\n[1/8] Repository preflight");
assertCleanGit();
runLocal("git", ["fetch", "origin", "main"]);
const localHead = spawnSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).stdout.trim();
const remoteHead = spawnSync("git", ["rev-parse", "origin/main"], { encoding: "utf8" }).stdout.trim();
if (localHead !== remoteHead) {
  console.log(`Local HEAD ${localHead}`);
  console.log(`origin/main ${remoteHead}`);
  console.log("The V17.7 baseline is not yet pushed. Pushing the clean committed baseline now.");
  runLocal("git", ["push", "origin", "main"]);
}
assertCleanGit();

console.log("\n[2/8] VPS deployment");
const deploy = `git fetch origin main && git checkout main && git pull --ff-only origin main && pnpm install --frozen-lockfile && pnpm exec prisma migrate deploy && pnpm exec prisma generate && pnpm build && pm2 restart ${shellQuote(pm2App)}`;
const r = ssh(deploy);
if (r.status !== 0) fail("VPS deployment sequence failed.");

console.log("\n[3/8] Production smoke");
for (const path of ["/", "/free"]) {
  const response = await fetch(`${baseUrl}${path}`, { redirect: "manual" });
  if (response.status !== 200) fail(`${path} expected HTTP 200, got ${response.status}`);
  console.log(`${path}: HTTP ${response.status} PASS`);
}
for (const [path, expected] of [["/api/auth/session", [200, 401]], ["/api/admin/leads", [401, 403]]]) {
  const response = await fetch(`${baseUrl}${path}`, { redirect: "manual" });
  if (!expected.includes(response.status)) fail(`${path} unexpected HTTP ${response.status}`);
  console.log(`${path}: HTTP ${response.status} PASS`);
}
const webhook = await fetch(`${baseUrl}/api/webhooks/whatsapp`, { redirect: "manual" });
if (![400, 403, 404, 405, 500, 503].includes(webhook.status)) fail(`Webhook endpoint returned unexpected HTTP ${webhook.status}`);
console.log(`/api/webhooks/whatsapp reachable: HTTP ${webhook.status} PASS`);

console.log("\n[4/8] Meta webhook verification");
console.log("Verification uses the server-side WHATSAPP_VERIFY_TOKEN and does not print it.");
const verify = ssh(`set -a; [ -f .env ] && . ./.env; [ -f .env.local ] && . ./.env.local || true; test -n "$WHATSAPP_VERIFY_TOKEN" && curl -fsS --get ${shellQuote(`${baseUrl}/api/webhooks/whatsapp`)} --data-urlencode 'hub.mode=subscribe' --data-urlencode "hub.verify_token=$WHATSAPP_VERIFY_TOKEN" --data-urlencode 'hub.challenge=readyscore-v17-8-check' | grep -Fx 'readyscore-v17-8-check' >/dev/null`);
if (verify.status !== 0) fail("Meta webhook verification did not PASS. Token remains server-side; no token was printed.");
console.log("Meta webhook verification: PASS");

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
try {
  console.log("\n[5/8] REAL INBOUND WhatsApp");
  await ask(rl, "Send a real WhatsApp text to +62 811-9696-2200, then confirm it appears in the ReadyScore admin Inbox.");
  console.log("Real inbound WhatsApp: CONFIRMED");

  console.log("\n[6/8] ADMIN REPLY");
  await ask(rl, "Open https://app.readyscore.id/admin/whatsapp, reply to the conversation, and confirm the outbound message is persisted with a provider message ID.");
  console.log("Admin reply: CONFIRMED");

  console.log("\n[7/8] REAL OUTBOUND");
  await ask(rl, "Confirm the customer/test phone actually received the ReadyScore reply.");
  console.log("Real outbound WhatsApp: CONFIRMED");

  console.log("\n[8/8] STATUS VERIFICATION");
  await ask(rl, "Confirm the inbox reflects the actual provider status (SENT/DELIVERED/READ or FAILED) and does not claim delivery without provider confirmation.");
  console.log("Provider status synchronization: CONFIRMED");
} finally {
  rl.close();
}

console.log("\n=== READY SCORE V17 PRODUCTION RUNTIME — PASS ===");
console.log("V17.7 local certification prerequisite: PASS (operator-confirmed)");
console.log("Production deployment: PASS");
console.log("Production smoke: PASS");
console.log("Meta webhook verification: PASS");
console.log("Real inbound WhatsApp: PASS");
console.log("Admin reply: PASS");
console.log("Real outbound WhatsApp: PASS");
console.log("Provider status verification: PASS");
