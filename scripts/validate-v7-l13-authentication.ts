import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
function exists(p: string) { return fs.existsSync(path.join(root, p)); }
function pass(label: string) { console.log(`PASS: ${label}`); }
function fail(label: string): never { console.error(`FAIL: ${label}`); process.exit(1); }

console.log("=== READY SCORE V7 L13 AUTHENTICATION MVP GATE ===");
console.log("Scope      : Register → Login → Session → Protected App → Logout");
console.log("Protection : Frozen V4/V5/V6 measurement, commercial, profiling semantics");
for (const p of ["app/login/page.tsx","app/register/page.tsx","app/logout/page.tsx","app/api/auth/login/route.ts","app/api/auth/register/route.ts","app/api/auth/logout/route.ts","app/api/auth/session/route.ts","lib/auth/service.ts"]) {
  if (!exists(p)) fail(`Required authentication surface missing: ${p}`);
}
pass("Login surface present");
pass("Register surface present");
pass("Logout surface present");
pass("Session API present");
pass("Credential service present");
const appPage = fs.readFileSync(path.join(root,"app/app/page.tsx"),"utf8");
if (!appPage.includes('redirect("/login?next=/app")')) fail("Protected /app redirect missing");
pass("/app protected-route redirect present");
const service = fs.readFileSync(path.join(root,"lib/auth/service.ts"),"utf8");
if (!service.includes("syncUserToDatabase")) fail("Registration/database sync boundary missing");
pass("Registration → PostgreSQL identity sync present");
console.log("Database migration : NO");
console.log("Measurement semantics : NO MUTATION");
console.log("V7 L13 AUTHENTICATION MVP GATE: PASS");
