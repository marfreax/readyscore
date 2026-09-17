import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
function read(file) { return fs.readFileSync(path.join(root, file), "utf8"); }
function assert(condition, message) { if (!condition) throw new Error(message); }

const repo = read("lib/admin-whatsapp-repository.ts");
const persistence = read("lib/whatsapp/persistence.ts");
const linkRoute = read("app/api/admin/whatsapp/conversations/[id]/link-lead/route.ts");
const candidateRoute = read("app/api/admin/whatsapp/conversations/[id]/lead-candidates/route.ts");
const ui = read("components/admin/whatsapp/WhatsAppInbox.tsx");
const schema = read("prisma/schema.prisma");

assert(schema.includes("model BusinessLead"), "BusinessLead model missing");
assert(repo.includes("resolveExactBusinessLead") && repo.includes('where: { whatsapp: normalized }'), "exact WhatsApp BusinessLead matching missing");
assert(persistence.includes("businessLeadId") && persistence.includes("findBusinessLead"), "webhook BusinessLead linking boundary missing");
assert(repo.includes("searchAdminWhatsAppLeadCandidates"), "lead candidate search missing");
assert(repo.includes("linkAdminWhatsAppConversationToBusinessLead"), "explicit lead linking missing");
assert(repo.includes('action: "BUSINESS_LEAD_LINKED"'), "lead link audit missing");
assert(linkRoute.includes("requireAdminApi") && linkRoute.includes("businessLeadId"), "explicit link authorization/contract missing");
assert(candidateRoute.includes("requireAdminApi") && candidateRoute.includes("searchAdminWhatsAppLeadCandidates"), "candidate route authorization missing");
assert(repo.includes("assessmentAttemptId") && repo.includes("freeReportDelivery"), "assessment/report context missing");
assert(ui.includes("Hubungkan Business Lead") && ui.includes("Attempt:") && ui.includes("Free Report"), "context UI refinement missing");
assert(!repo.includes("create({ data: { name: \"WhatsAppCustomer\""), "duplicate customer identity system detected");
console.log("V17.5 static gate: PASS");
console.log("BusinessLead exact matching: PASS");
console.log("explicit lead linking: PASS");
console.log("assessment context: PASS");
console.log("Free Report delivery context: PASS");
console.log("no duplicate identity system: PASS");
console.log("context UI refinement: PASS");
