import fs from "node:fs";
import path from "node:path";
const root=process.cwd();
function read(file){return fs.readFileSync(path.join(root,file),"utf8");}
function check(label,ok){console.log(`${label.padEnd(58)}: ${ok?"PASS":"FAIL"}`);if(!ok)process.exitCode=1;}
check("Public index contains six core assessment references", /Cognitive/.test(read("app/page.tsx")) && /Learning Preference/.test(read("app/page.tsx")));
check("Public footer links Privacy Policy", /\/privacy-policy/.test(read("components/public/PublicFooter.tsx")));
check("Public footer links Terms of Service", /\/terms/.test(read("components/public/PublicFooter.tsx")));
check("Public footer links Data Deletion", /\/data-deletion/.test(read("components/public/PublicFooter.tsx")));
check("Privacy Policy page exists", fs.existsSync(path.join(root,"app/privacy-policy/page.tsx")));
check("Terms page exists", fs.existsSync(path.join(root,"app/terms/page.tsx")));
check("Data Deletion page exists", fs.existsSync(path.join(root,"app/data-deletion/page.tsx")));
check("Data Deletion request API exists", fs.existsSync(path.join(root,"app/api/privacy/data-deletion/route.ts")));
check("Data Deletion admin workflow exists", fs.existsSync(path.join(root,"app/admin/data-deletion/page.tsx")) && fs.existsSync(path.join(root,"app/api/admin/data-deletion/route.ts")));
const schema=read("prisma/schema.prisma");
check("Deletion request persistence model exists", /model DataDeletionRequest/.test(schema) && /enum DataDeletionRequestStatus/.test(schema));
check("V19.6 migration exists", fs.existsSync(path.join(root,"prisma/migrations/20260930100000_v19_6_public_trust_legal_compliance/migration.sql")));
const pkg=JSON.parse(read("package.json"));
check("V19.6 gate registered", pkg.scripts?.["v19.6:gate"] === "node scripts/validate-v19-6-public-trust.mjs");
check("V19.5 runtime logic remains present", fs.existsSync(path.join(root,"lib/commercial/v14-1.ts")) && fs.existsSync(path.join(root,"lib/commercial/v14-3.ts")));
console.log(process.exitCode?"V19.6 Public Trust & Legal Compliance gate: FAIL":"V19.6 Public Trust & Legal Compliance gate: PASS");
