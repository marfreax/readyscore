import { PrismaClient } from "@prisma/client";
import { randomBytes } from "node:crypto";
const base = process.env.READYSCORE_BASE_URL ?? "http://localhost:3000";
const prisma = new PrismaClient();
let attemptId = null;
try {
  const start = await fetch(`${base}/api/assessment/start`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ type: "free" }) });
  const startData = await start.json();
  if (!start.ok || !startData.ok || startData.questions?.length !== 10) throw new Error(`start failed: ${JSON.stringify(startData)}`);
  attemptId = startData.attemptId;
  for (const question of startData.questions) {
    const response = await fetch(`${base}/api/assessment/${attemptId}/answer`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ questionId: question.id, value: 5 }) });
    if (!response.ok) throw new Error(`answer failed: ${response.status}`);
  }
  const submit = await fetch(`${base}/api/assessment/${attemptId}/submit`, { method: "POST" });
  if (!submit.ok) throw new Error(`submit failed: ${submit.status}`);
  const lead = await fetch(`${base}/api/free/unlock`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ attemptId, name: "Phase 3 Test", whatsapp: "081234567890", email: `phase3-${randomBytes(4).toString("hex")}@example.com`, consent: true, source: "phase3-e2e" }) });
  if (!lead.ok) throw new Error(`lead failed: ${lead.status}`);
  const delivery = await fetch(`${base}/api/free/delivery`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ attemptId }) });
  const deliveryData = await delivery.json();
  if (!delivery.ok || !deliveryData.ok || deliveryData.delivery?.pdfStatus !== "GENERATED") throw new Error(`delivery failed: ${JSON.stringify(deliveryData)}`);
  const pdf = await fetch(`${base}/api/free/report/pdf?attemptId=${encodeURIComponent(attemptId)}`);
  const pdfBytes = Buffer.from(await pdf.arrayBuffer());
  if (!pdf.ok || pdf.headers.get("content-type") !== "application/pdf" || pdfBytes.subarray(0, 5).toString() !== "%PDF-") throw new Error("PDF endpoint did not return a valid PDF");
  const deliveryRow = await prisma.freeReportDelivery.findUnique({ where: { attemptId }, select: { pdfStatus: true, whatsappStatus: true, emailStatus: true, pdfContent: true } });
  if (!deliveryRow?.pdfContent || deliveryRow.pdfStatus !== "GENERATED") throw new Error("PDF was not persisted");
  const products = await prisma.product.findMany({ where: { tier: { in: ["MEDIUM", "ADVANCE"] }, status: "ACTIVE" }, select: { tier: true, priceIdr: true } });
  if (!products.some((p) => p.tier === "MEDIUM") || !products.some((p) => p.tier === "ADVANCE")) throw new Error("Premium catalog is incomplete");
  console.log("V16 PHASE 3 RUNTIME E2E: PASS");
  console.log(`attemptId=${attemptId}`);
  console.log(`pdfBytes=${pdfBytes.length}`);
  console.log(`whatsapp=${deliveryRow.whatsappStatus} email=${deliveryRow.emailStatus}`);
} catch (error) {
  console.error("V16 PHASE 3 RUNTIME E2E: FAIL");
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  if (attemptId) await prisma.assessmentAttempt.delete({ where: { id: attemptId } }).catch(() => {});
  await prisma.$disconnect();
}
