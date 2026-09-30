import assert from "node:assert/strict";
import fs from "node:fs";

const switcher = fs.readFileSync("components/app/SubjectSwitcher.tsx", "utf8");
const navigation = fs.readFileSync("lib/subjects/navigation.ts", "utf8");

assert.match(switcher, /usePathname\(\)/, "SubjectSwitcher must read the current route");
assert.match(switcher, /useRouter\(\)/, "SubjectSwitcher must use Next router navigation");
assert.match(switcher, /getSubjectSwitchFallback\(pathname\)/, "SubjectSwitcher must use common subject fallback rules");
assert.match(switcher, /router\.replace\(fallback\)/, "SubjectSwitcher must leave stale subject-detail routes");
assert.match(switcher, /router\.refresh\(\)/, "SubjectSwitcher must refresh subject-safe routes");

assert.match(navigation, /\/\^\\\/result\\\//, "Result detail route must have a safe fallback");
assert.match(navigation, /return "\/results"/, "Result/report/assessment subject contexts must return to safe collections");
assert.match(navigation, /\/\^\\\/reports\\\//, "Report detail route must have a safe fallback");
assert.match(navigation, /\/\^\\\/assessments\\\//, "Assessment runner detail route must have a safe fallback");
assert.match(navigation, /\/\^\\\/reassessment\\\//, "Reassessment detail route must have a safe fallback");
assert.match(navigation, /\/\^\\\/checkout\\\//, "Checkout route must have a safe fallback");
assert.match(navigation, /return "\/access"/, "Checkout fallback must return to Access & Plans");

console.log("Subject switcher uses centralized subject-safe navigation: PASS");
console.log("Result/report/assessment/reassessment/checkout stale-route fallbacks: PASS");
console.log("V19.5.1 Subject Context gate: PASS");
