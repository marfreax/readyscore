import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const required = [
  "lib/free-report-pdf.ts",
  "lib/free-delivery.ts",
  "app/api/free/report/pdf/route.ts",
];

const failures = [];
for (const file of required) {
  const full = path.join(root, file);
  if (!fs.existsSync(full)) {
    failures.push(`MISSING:${file}`);
    continue;
  }
  const text = fs.readFileSync(full, "utf8");
  if (file === "lib/free-report-pdf.ts") {
    for (const token of [
      "READYSCORE_CHROMIUM_PATH",
      "CHROME_BIN",
      "PDF_RENDERER_NOT_FOUND",
      "isValidPdfBuffer",
      "--headless=new",
    ]) {
      if (!text.includes(token)) failures.push(`PDF_RENDERER_CONTRACT:${token}`);
    }
  }
  if (file === "lib/free-delivery.ts") {
    for (const token of [
      "isValidPdfBuffer",
      'pdfStatus: "FAILED"',
      "pdfContent: null",
    ]) {
      if (!text.includes(token)) failures.push(`DELIVERY_HARDENING_CONTRACT:${token}`);
    }
  }
  if (file === "app/api/free/report/pdf/route.ts") {
    for (const token of [
      "PDF_GENERATION_FAILED",
      "PDF_OUTPUT_INVALID",
      '"Content-Type": "application/pdf"',
      '"X-Content-Type-Options": "nosniff"',
    ]) {
      if (!text.includes(token)) failures.push(`PDF_ROUTE_CONTRACT:${token}`);
    }
  }
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("V16.5 PDF & Delivery Hardening static gate: PASS");
