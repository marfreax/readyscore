import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const fail = (message) => { console.error(`V19.3 Assessment Summary gate: FAIL — ${message}`); process.exit(1); };

const summary = read("lib/result-summary-v19-3.ts");
const result = read("app/result/[attemptId]/page.tsx");
const report = read("lib/reports/v19-3-engine.ts");
const pdf = read("lib/reports/pdf-v19-3.ts");
const parent = read("app/reports/[attemptId]/parent/page.tsx");
const switcher = read("components/app/SubjectSwitcher.tsx");

for (const type of ["RIASEC", "DISC", "EQ", "COGNITIVE", "WORK_ATTITUDE", "LEARNING_PREFERENCE"]) {
  if (!summary.includes(type)) fail(`summary contract missing assessment type ${type}`);
}
if (!summary.includes("Assessment Summary") || !summary.includes("areasToWatch") || !summary.includes("strengths")) fail("summary reading contract incomplete");
if (!result.includes("06 · Assessment Summary") || !result.includes("04 · Strengths") || !result.includes("05 · Areas to Watch")) fail("customer result summary blocks missing");
if (!report.includes("assessmentSummary") || !report.includes("buildAssessmentSummaryV19_3")) fail("report engine does not consume the shared summary contract");
if (!pdf.includes("report.assessmentSummary.reading") || !pdf.includes("report.participantName")) fail("PDF does not render summary/identity");
if (!parent.includes("assessmentReport.assessmentSummary.reading")) fail("parent report does not render summary");
if (!switcher.includes('subject.type === "OWNER" ? " — Utama" : " — Tambahan"')) fail("active profile terminology not updated");
if (!switcher.includes("+ Tambah Profil")) fail("add profile label not updated");
if (result.includes('06 · Interpretation & Limitations')) fail("old governance section numbering remains");
if (!result.includes('07 · Interpretation & Limitations')) fail("governance section was not moved after summary");

console.log("PASS — shared Assessment Summary contract covers six assessment types");
console.log("PASS — Result renders Strengths, Areas to Watch, and Assessment Summary");
console.log("PASS — Report uses the same summary contract");
console.log("PASS — PDF includes participant identity and Assessment Summary");
console.log("PASS — Parent Report includes Assessment Summary");
console.log("PASS — Active Profile labels are Utama / Tambahan");
console.log("V19.3 Assessment Summary static gate: PASS");
