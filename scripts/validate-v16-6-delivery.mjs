import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const failures = [];

const required = [
  "lib/free-delivery.ts",
  "components/free/FreeReportDeliveryStatus.tsx",
  "components/free/FreeLeadGate.tsx",
  "app/api/free/delivery/route.ts",
  "prisma/schema.prisma",
  "prisma/migrations/20260916130000_v16_6_delivery_concurrency/migration.sql",
];

for (const file of required) {
  if (!fs.existsSync(path.join(root, file))) failures.push(`MISSING:${file}`);
}

if (!failures.length) {
  const delivery = read("lib/free-delivery.ts");
  const status = read("components/free/FreeReportDeliveryStatus.tsx");
  const leadGate = read("components/free/FreeLeadGate.tsx");
  const route = read("app/api/free/delivery/route.ts");
  const schema = read("prisma/schema.prisma");
  const migration = read("prisma/migrations/20260916130000_v16_6_delivery_concurrency/migration.sql");

  for (const token of [
    "WHATSAPP_ACCESS_TOKEN",
    "WHATSAPP_PHONE_NUMBER_ID",
    "WHATSAPP_GRAPH_VERSION",
    "WHATSAPP_MEDIA_UPLOAD_FAILED",
    "WHATSAPP_MESSAGE_FAILED",
    "WHATSAPP_MEDIA_UPLOAD_TIMEOUT",
    "WHATSAPP_MESSAGE_TIMEOUT",
    "RESEND_API_KEY",
    "READYSCORE_EMAIL_FROM",
    "EMAIL_SEND_FAILED",
    "EMAIL_SEND_TIMEOUT",
    '"Idempotency-Key"',
    "free-report-email/",
    "processingUntil",
    "processingToken",
    "DELIVERY_LOCK_MS",
    "providerMessageId",
    "cache: \"no-store\"",
  ]) {
    if (!delivery.includes(token)) failures.push(`DELIVERY_CONTRACT:${token}`);
  }

  for (const token of ["whatsappStatus", "emailStatus", "Coba kirim lagi", "inFlightDeliveries", "deliveryInProgress"]) {
    if (!status.includes(token)) failures.push(`STATUS_UI_CONTRACT:${token}`);
  }

  if (leadGate.includes('void fetch("/api/free/delivery"')) {
    failures.push("DUPLICATE_DELIVERY_TRIGGER:FreeLeadGate");
  }

  for (const token of ["POST", "deliverFreeReport", "FREE_REPORT_DELIVERY_FAILED"]) {
    if (!route.includes(token)) failures.push(`ROUTE_CONTRACT:${token}`);
  }

  for (const token of ["whatsappStatus", "emailStatus", "whatsappError", "emailError", "processingUntil", "processingToken"]) {
    if (!schema.includes(token)) failures.push(`SCHEMA_CONTRACT:${token}`);
  }

  for (const token of ["processingUntil", "processingToken", "FreeReportDelivery_processingUntil_idx"]) {
    if (!migration.includes(token)) failures.push(`MIGRATION_CONTRACT:${token}`);
  }

  for (const token of [
    "Halo",
    "Free Report ReadyScore kamu terlampir.",
    "app.readyscore.id/register",
    "+62 811 9696 2200",
    "hola@readyscore.id",
    "Tim ReadyScore",
  ]) {
    if (!delivery.includes(token)) failures.push(`EMAIL_COPY_CONTRACT:${token}`);
  }
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("V16.6 WhatsApp & Email Delivery hardening static gate: PASS");
