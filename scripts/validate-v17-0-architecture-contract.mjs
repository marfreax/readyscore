import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const exists = (file) => fs.existsSync(path.join(root, file));
const failures = [];

const spec = "architecture/phase-17.0/ReadyScore_V17_0_Architecture_Contract_Lock.md";
const record = "architecture/phase-17.0/PHASE_17_0_IMPLEMENTATION_RECORD.md";

if (!exists(spec)) failures.push("V17.0 canonical specification missing");
if (!exists(record)) failures.push("V17.0 implementation record missing");

if (exists(spec)) {
  const text = read(spec);
  const required = [
    "Previous baseline",
    "New V17 focus",
    "Own the customer conversation layer",
    "Meta WhatsApp Cloud API",
    "Inbound Webhook",
    "Admin WhatsApp Inbox",
    "BusinessLead",
    "externalMessageId",
    "X-Hub-Signature-256",
    "/api/webhooks/whatsapp",
    "/api/admin/whatsapp/conversations",
    "/admin/whatsapp",
    "V17 Definition of Done",
    "Phase 17.1 — WhatsApp Webhook Foundation",
    "Phase 17.2 — Conversation & Message Persistence",
    "Phase 17.3 — Admin Inbox Read Model",
    "Phase 17.4 — Admin Reply",
    "Phase 17.5 — Business Lead & ReadyScore Context",
    "Phase 17.6 — Production Hardening",
    "Phase 17.7 — Full Local E2E Certification",
    "Phase 17.8 — Production Deployment & Runtime Certification",
    "No WhatsApp Web automation",
    "No unofficial WhatsApp API",
    "AI chatbot",
  ];
  for (const token of required) {
    if (!text.includes(token)) failures.push(`V17.0 contract missing: ${token}`);
  }
}

if (exists(record)) {
  const text = read(record);
  const required = [
    "LOCKED / IMPLEMENTATION NOT STARTED",
    "Phase 17.0 MUST NOT implement",
    "V16.8.4 baseline remains unchanged",
    "Next phase:** Phase 17.1",
  ];
  for (const token of required) {
    if (!text.includes(token)) failures.push(`V17.0 boundary missing: ${token}`);
  }
}

const certificationMode = process.env.READYSCORE_V17_LOCAL_CERTIFICATION === "1";

// Phase 17.0 is a lock phase. During later full-local certification,
// the V17 runtime artifacts are expected to exist and are validated by
// their own phase gates/E2Es, so only enforce their absence in standalone lock mode.
const forbiddenRuntimeArtifacts = [
  "app/admin/whatsapp/page.tsx",
  "app/api/webhooks/whatsapp/route.ts",
  "app/api/admin/whatsapp/conversations/route.ts",
  "prisma/migrations/20260917020000_v17_1_whatsapp_webhook",
];
if (!certificationMode) {
  for (const artifact of forbiddenRuntimeArtifacts) {
    if (exists(artifact)) failures.push(`V17.0 runtime artifact must not exist yet: ${artifact}`);
  }
}

// Baseline V16.8.4 contracts must remain available.
const baselineChecks = [
  ["V16.5 gate", "scripts/validate-v16-5-pdf-delivery.mjs"],
  ["V16.6 gate", "scripts/validate-v16-6-delivery.mjs"],
  ["V16.7 gate", "scripts/validate-v16-7-business-lead.mjs"],
  ["V16.8 gate", "scripts/validate-v16-8-production-certification.mjs"],
  ["V16.8.4 gate", "scripts/validate-v16-8-4-whatsapp-copy.mjs"],
  ["V16 comprehensive certification", "scripts/e2e-v16-5-8-comprehensive-certification.mjs"],
  ["Free delivery", "lib/free-delivery.ts"],
  ["Business lead", "lib/business-lead.ts"],
  ["Admin authorization", "lib/auth/admin.ts"],
];
for (const [label, file] of baselineChecks) {
  if (!exists(file)) failures.push(`V16.8.4 baseline missing: ${label}`);
}

if (exists("lib/free-delivery.ts")) {
  const delivery = read("lib/free-delivery.ts");
  for (const token of [
    "WHATSAPP_ACCESS_TOKEN",
    "WHATSAPP_PHONE_NUMBER_ID",
    "READYSCORE_EMAIL_FROM",
    "processingToken",
  ]) {
    if (!delivery.includes(token)) failures.push(`V16.8.4 delivery contract missing: ${token}`);
  }
}

if (exists("lib/auth/admin.ts") && !read("lib/auth/admin.ts").includes("requireAdmin")) {
  failures.push("existing admin authorization contract changed");
}

if (failures.length) {
  console.error("ReadyScore V17.0 Architecture & Contract Lock: FAIL");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("ReadyScore V17.0 Architecture & Contract Lock: PASS");
console.log("Architecture: LOCKED");
if (certificationMode) {
  console.log("Certification mode: legacy V17.0 contract revalidated; later V17 runtime artifacts are allowed");
} else {
  console.log("Runtime implementation: NOT STARTED");
  console.log("Next phase: V17.1 WhatsApp Webhook Foundation");
}
console.log("V16.8.4 baseline boundaries: PRESENT");
