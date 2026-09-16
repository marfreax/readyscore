import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const exists = (file) => fs.existsSync(path.join(root, file));
const failures = [];

const requiredFiles = [
  "scripts/validate-v16-5-pdf-delivery.mjs",
  "scripts/validate-v16-6-delivery.mjs",
  "scripts/validate-v16-7-business-lead.mjs",
  "scripts/validate-v16-8-production-certification.mjs",
  "scripts/e2e-v16-8-full-funnel-runtime.mjs",
  "scripts/e2e-v15-2-customer-report-runtime.mjs",
  "scripts/e2e-v16-5-8-comprehensive-certification.mjs",
  "architecture/v16.8/ReadyScore_V16_8_Full_Funnel_Production_Certification.md",
];
for (const file of requiredFiles) if (!exists(file)) failures.push(`MISSING:${file}`);

if (!failures.length) {
  const pkg = JSON.parse(read("package.json"));
  const expected = {
    "v16:5:gate": "node scripts/validate-v16-5-pdf-delivery.mjs",
    "v16:6:gate": "node scripts/validate-v16-6-delivery.mjs",
    "v16:7:gate": "node scripts/validate-v16-7-business-lead.mjs",
    "v16:8:gate": "node scripts/validate-v16-8-production-certification.mjs",
    "e2e:v16:8:full-funnel": "node scripts/e2e-v16-8-full-funnel-runtime.mjs",
    "e2e:v16:5-8:certification": "node scripts/e2e-v16-5-8-comprehensive-certification.mjs",
  };
  for (const [name, command] of Object.entries(expected)) {
    if (pkg.scripts?.[name] !== command) failures.push(`PACKAGE_SCRIPT:${name}`);
  }

  const suite = read("scripts/e2e-v16-5-8-comprehensive-certification.mjs");
  const requiredSuiteTokens = [
    "v16:5:gate",
    "v16:6:gate",
    "v16:7:gate",
    "v16:8:gate",
    "v15.2:gate",
    "e2e:v15.2:customer",
    "e2e:v16:8:full-funnel",
    "V16.5 PDF",
    "V16.6 DELIVERY CONTRACT",
    "V16.7 BUSINESS LEAD CONTRACT",
    "V16.8 FULL FUNNEL CONTRACT",
    "V15.2 REGRESSION",
    "ANALYTICS",
    "PREMIUM OFFER",
    "CHECKOUT",
    "ENTITLEMENT",
    "ADMIN AUTHORIZATION",
  ];
  for (const token of requiredSuiteTokens) if (!suite.includes(token)) failures.push(`SUITE_CONTRACT:${token}`);

  const architecture = read("architecture/v16.8/ReadyScore_V16_8_Full_Funnel_Production_Certification.md");
  for (const token of [
    "V16.5–V16.8 Comprehensive E2E Certification",
    "V16.5",
    "V16.6",
    "V16.7",
    "V16.8",
    "V15.2 Regression",
    "Production",
  ]) if (!architecture.includes(token)) failures.push(`ARCHITECTURE:${token}`);
}

if (failures.length) {
  console.error("V16.5–V16.8 Comprehensive Certification static gate: FAIL");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}
console.log("V16.5–V16.8 Comprehensive Certification static gate: PASS");
