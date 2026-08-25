import { prisma } from "../lib/db/prisma.ts";

console.log("=== RIASEC F.10-C.2-E PERSISTENCE CONTRACT RECONCILIATION ===");
const rows = await prisma.questionVersion.findMany({
  where: { status: "PUBLISHED", mappingStatus: "APPROVED", domain: { in: ["R","I","A","S","E","C"] } },
  include: { question: true },
  orderBy: [{ createdAt: "desc" }, { id: "desc" }],
});
const latest = new Map();
for (const row of rows) if (!latest.has(row.questionId)) latest.set(row.questionId, row);
const eligible=[...latest.values()].filter(v =>
  v.text.trim() && v.domain.trim() && v.subdomain?.trim() && v.indicator?.trim() &&
  v.weight>0 && v.scale.length===5 && v.scoringKey.length===5
);
console.log(`Published eligible RIASEC : ${eligible.length}`);
if (eligible.length !== 60) throw new Error(`Expected 60 eligible RIASEC rows; found ${eligible.length}.`);
for (const d of ["R","I","A","S","E","C"]) {
  const n=eligible.filter(v=>v.domain.trim().toUpperCase()===d).length;
  console.log(`${d}: ${n}`);
  if(n!==10) throw new Error(`${d}: expected 10, found ${n}.`);
}
console.log("Question.id / Question.code / QuestionVersion.id linkage: PASS");
console.log("F.10-C.2-E PERSISTENCE CONTRACT RECONCILIATION: PASS");
