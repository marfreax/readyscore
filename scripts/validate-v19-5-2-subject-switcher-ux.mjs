import assert from "node:assert/strict";
import fs from "node:fs";

const shell = fs.readFileSync("components/app/CustomerPageShell.tsx", "utf8");
const appShell = fs.readFileSync("components/app/AppShell.tsx", "utf8");
const overview = fs.readFileSync("app/app/page.tsx", "utf8");

assert.doesNotMatch(shell, /SubjectSwitcher/, "CustomerPageShell must not render a secondary SubjectSwitcher");
assert.match(appShell, /<SubjectSwitcher \/>/, "AppShell must keep the global top SubjectSwitcher");
assert.match(appShell, /lg:hidden print-hidden/, "Mobile must retain the global SubjectSwitcher in the top shell");
assert.match(overview, /Halo, \{subject\.name\}\./, "Overview greeting must use the active subject name");

console.log("CustomerPageShell secondary Active Profile selector removed: PASS");
console.log("Global top Active Profile selector retained on desktop and mobile: PASS");
console.log("Overview greeting follows active subject: PASS");
console.log("V19.5.2 Subject Switcher UX gate: PASS");
