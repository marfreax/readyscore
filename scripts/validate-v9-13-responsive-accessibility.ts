import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (p: string) => fs.readFileSync(path.join(root, p), "utf8");
const exists = (p: string) => fs.existsSync(path.join(root, p));
const failures: string[] = [];
const pass = (label: string) => console.log(`PASS: ${label}`);
const fail = (label: string) => failures.push(label);

const required = [
  "V9_13_DELIVERY_MANIFEST.json",
  "V9_13_DELIVERY_NOTES.md",
  "architecture/phase-9.13/ReadyScore_V9_13_Responsive_Accessibility.md",
  "components/assessment/AssessmentRunner.tsx",
  "components/app/CustomerNavigation.tsx",
  "app/globals.css",
];
for (const p of required) exists(p) ? pass(`required artifact: ${p}`) : fail(`missing artifact: ${p}`);

const manifest = JSON.parse(read("V9_13_DELIVERY_MANIFEST.json"));
for (const [key, expected] of Object.entries({
  version: "V9.13",
  status: "IMPLEMENTED",
  databaseMigration: false,
  measurementRedesign: false,
  scoringRedesign: false,
  questionBankMutation: false,
  resultSemanticsMutation: false,
  reportsMutation: false,
  activityMutation: false,
  accessPlansMutation: false,
  responsiveMobile: true,
  accessibility: true,
  universalScore: false,
  rawAverageSynthesis: false,
  baseline: "V9.12",
})) {
  manifest[key] === expected ? pass(`manifest ${key}`) : fail(`manifest ${key} expected ${String(expected)}`);
}

const css = read("app/globals.css");
for (const marker of [".rs-a11y-target", ".rs-touch-target", "prefers-reduced-motion", "prefers-contrast: more", "forced-colors: active", "overflow-wrap: anywhere"]) {
  css.includes(marker) ? pass(`responsive/accessibility CSS: ${marker}`) : fail(`missing CSS marker: ${marker}`);
}

const runner = read("components/assessment/AssessmentRunner.tsx");
for (const marker of ["<main", "aria-label=\"Assessment runtime\"", "role=\"progressbar\"", "aria-labelledby=\"assessment-question-title\"", "role=\"dialog\"", "aria-modal=\"true\"", "rs-a11y-target"]) {
  runner.includes(marker) ? pass(`assessment accessibility marker: ${marker}`) : fail(`missing assessment marker: ${marker}`);
}

const nav = read("components/app/CustomerNavigation.tsx");
for (const marker of ["aria-expanded", "aria-controls", "rs-a11y-target"]) {
  nav.includes(marker) ? pass(`navigation accessibility marker: ${marker}`) : fail(`missing navigation marker: ${marker}`);
}

for (const p of ["app/activity/page.tsx", "app/profile/page.tsx", "app/reports/page.tsx", "app/access/page.tsx", "app/result/[attemptId]/page.tsx"]) {
  const s = read(p);
  /(?:^|\s)grid-cols-(?:3|4|5)(?:\s|")/.test(s) ? fail(`unresponsive dense grid remains in ${p}`) : pass(`customer grid responsive: ${p}`);
}

const architecture = read("architecture/phase-9.13/ReadyScore_V9_13_Responsive_Accessibility.md");
for (const marker of ["No database migration.", "No measurement redesign.", "No universal score.", "No raw-average synthesis."]) {
  architecture.includes(marker) ? pass(`architecture safety: ${marker}`) : fail(`missing architecture safety marker: ${marker}`);
}

if (failures.length) {
  console.error("V9.13 RESPONSIVE & ACCESSIBILITY GATE: FAIL");
  for (const failure of failures) console.error(`FAIL: ${failure}`);
  process.exit(1);
}
console.log("V9.13 RESPONSIVE & ACCESSIBILITY GATE: PASS");
