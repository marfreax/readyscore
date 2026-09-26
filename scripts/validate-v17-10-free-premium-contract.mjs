import fs from "node:fs";
const read=p=>fs.readFileSync(p,"utf8");
const files=["app/api/admin/assessment-config/route.ts","components/admin/AssessmentConfigurationWorkspace.tsx","scripts/v17-10-align-runtime-data.mjs","scripts/v17-10-runtime-preflight.mjs","lib/question-package-runtime.ts","lib/assessment/runtime-configuration.ts"];
const text=files.map(read).join("\n");
for(const type of ["FREE","RIASEC","DISC","EQ","COGNITIVE"])if(!text.includes(type))throw new Error(`Missing current assessment type marker: ${type}`);
for(const marker of ["PREMIUM_GLOBAL","PREMIUM_TAXONOMY_V1","test-type-premium-runtime","PREMIUM_RUNTIME_V1"])if(text.includes(marker))throw new Error(`Premium runtime marker must be removed: ${marker}`);
if(!text.includes("composition")||!text.includes("requiredCount"))throw new Error("Composition setting contract missing");
if(!text.includes("Question Bank")||!text.includes("Assessment setting"))throw new Error("Admin setting/content separation missing");
console.log("V17.10 CURRENT ASSESSMENT + COMPOSITION CONTRACT GATE — PASS");
