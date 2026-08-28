import { PrismaClient } from "@prisma/client";
const prisma=new PrismaClient(); const fail=(c,m)=>{throw new Error(`${c}: ${m}`)};
try{
 console.log("=== READY SCORE V3 PHASE 3.2 TEST CATALOG & TAXONOMY V2 GATE ===");
 console.log("Scope      : Test Type catalog / taxonomy versioning / QuestionVersion ownership boundary");
 console.log("Protection : No assessment/question/result lifecycle mutation");
 const types=await prisma.testType.findMany({orderBy:{code:"asc"},include:{taxonomies:{include:{nodes:true}}}});
 const expected=["AQ","COGNITIVE","DISC","EQ","LEARNING","RIASEC","STRENGTH"];
 const actual=types.map(t=>t.code);
 if(types.length!==7||expected.some(c=>!actual.includes(c)))fail("TEST_CATALOG_MISMATCH",`Expected ${expected.join(",")}; actual ${actual.join(",")}`);
 const active=types.filter(t=>t.status==="ACTIVE").map(t=>t.code); if(active.length!==1||active[0]!=="RIASEC")fail("ACTIVE_TEST_TYPE_MISMATCH",`Expected only RIASEC; actual ${active.join(",")}`);
 const r=types.find(t=>t.code==="RIASEC"); const tax=r?.taxonomies.find(t=>t.status==="ACTIVE"); if(!tax)fail("RIASEC_TAXONOMY_MISSING","RIASEC has no active taxonomy");
 const domains=tax.nodes.filter(n=>n.level===0).map(n=>n.code).sort().join(","); if(domains!=="A,C,E,I,R,S")fail("RIASEC_DOMAIN_TAXONOMY_MISMATCH",domains); if(tax.nodes.length!==36)fail("RIASEC_TAXONOMY_NODE_COUNT_MISMATCH",String(tax.nodes.length));
 const pub=await prisma.questionVersion.findMany({where:{status:"PUBLISHED",question:{code:{startsWith:"RIASEC-"}}},select:{id:true,testTypeId:true,taxonomyVersion:true}}); if(pub.length!==60)fail("RIASEC_PUBLISHED_COUNT_MISMATCH",String(pub.length)); if(pub.some(q=>q.testTypeId!==r.id||q.taxonomyVersion!==tax.version))fail("QUESTION_VERSION_OWNERSHIP_MISMATCH","Published RIASEC versions are not fully mapped to RIASEC/active taxonomy");
 console.log(`Test types       : ${types.length}`); console.log(`Active instrument: ${active.join(",")}`); console.log(`RIASEC taxonomy  : ${tax.version}`); console.log(`Taxonomy nodes   : ${tax.nodes.length}`); console.log(`Published RIASEC : ${pub.length}`); console.log("QuestionVersion → TestType / Taxonomy ownership: PASS"); console.log("Assessment/question/result lifecycle mutation: NONE"); console.log("F.3.2 TEST CATALOG & TAXONOMY V2 GATE: PASS");
}catch(e){console.error("F.3.2 TEST CATALOG & TAXONOMY V2 GATE: FAIL");console.error(e);process.exitCode=1}finally{await prisma.$disconnect()}
