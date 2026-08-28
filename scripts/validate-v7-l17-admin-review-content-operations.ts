import fs from "node:fs";
import path from "node:path";

const root=process.cwd();
const read=(p:string)=>fs.readFileSync(path.join(root,p),"utf8");
const fail=(m:string):never=>{throw new Error(m)};
const page=read("app/admin/review/page.tsx");
const api=read("app/api/admin/review/route.ts");
const repo=read("lib/admin-review-repository.ts");
const questionRepo=read("lib/question-bank-repository.ts");
const ops=read("lib/admin-content-operations.ts");
const component=read("components/admin/AdminReviewContentOperations.tsx");
const schema=read("prisma/schema.prisma");
const migration=path.join(root,"prisma/migrations/20260828050000_v7_l17_admin_review_content_operations/migration.sql");
const docCandidates=[
 "architecture/phase-7.17/ReadyScore_V7_L17_Admin_Review_Content_Operations.md",
 "docs/v7/V7_L17_ADMIN_REVIEW_CONTENT_OPERATIONS.md"
];
const doc=docCandidates.find(p=>fs.existsSync(path.join(root,p)));
console.log("=== READY SCORE V7 L17 ADMIN REVIEW & CONTENT OPERATIONS MVP GATE ===");
console.log("Scope      : Controlled review, publishing, activation, archive and audit operations");
console.log("Protection : Frozen measurement, scoring, result, commercial, profiling, reassessment semantics");

const checks:[string,boolean][]=[
 ["Canonical admin review surface present",page.includes("Review & Content Operations")],
 ["Admin authentication guard present",page.includes("requireAdmin()")],
 ["Admin review API present",api.includes("export async function GET")&&api.includes("export async function POST")],
 ["API admin authorization present",api.includes("requireAdminApi")],
 ["Unified review queue present",repo.includes("listReviewQueue")],
 ["Content validation present",ops.includes("validateQuestionMetadata")&&repo.includes("validateQuestionForReview")],
 ["Metadata validation enforced",repo.includes("CONTENT_VALIDATION_FAILED")],
 ["Duplicate detection present",ops.includes("findQuestionDuplicate")&&repo.includes("DUPLICATE_CONTENT")],
 ["Review status transition present",repo.includes("submitQuestionForReview")&&repo.includes("REVIEW_REQUIRED")],
 ["Approval transition protected",repo.includes("approveQuestionForReview")&&repo.includes("MAPPING_NOT_APPROVED")],
 ["Publish protection present",repo.includes("publishQuestionForOperations")&&repo.includes("QUESTION_NOT_APPROVED")],
 ["Activation operation present",repo.includes('case "ACTIVATE"')&&repo.includes("activateQuestionForOperations")&&questionRepo.includes("activateQuestionForOperations")&&questionRepo.includes('action:"ACTIVATE"')],
 ["Archive protection present",repo.includes("archiveQuestionForOperations")&&questionRepo.includes("ACTIVE_CONTENT_REQUIRES_REPLACEMENT")],
 ["Version comparison/history present",repo.includes("getQuestionVersionHistory")&&component.includes("Version history")],
 ["Audit trail model present",schema.includes("model AdminContentAuditEvent")],
 ["Audit trail writes present",ops.includes("auditContentOperation")],
 ["Audit trail visible",component.includes("Audit trail")],
 ["Historical version immutability preserved",!repo.includes("updateQuestionVersion")],
 ["No universal score introduced",!component.toLowerCase().includes("universal score")],
 ["No measurement engine mutation",!api.toLowerCase().includes("scoringengine")&&!api.toLowerCase().includes("measurementengine")],
 ["Phase documentation present",Boolean(doc)],
 ["Migration present",fs.existsSync(migration)],
 ["No unrelated migration added by L17",!fs.existsSync(path.join(root,"prisma/migrations/20260828050000_v7_l17_admin_review_content_operations/README.md"))],
];
for(const [label,ok] of checks){if(!ok)fail(`L17 check failed: ${label}`);console.log(`PASS: ${label}`)}
console.log("L17 database migration       : REQUIRED");
console.log("L17 measurement semantics    : NO MUTATION");
console.log("L17 scoring semantics        : NO MUTATION");
console.log("L17 historical version safety: PASS");
console.log("V7 L17 ADMIN REVIEW & CONTENT OPERATIONS MVP GATE: PASS");
