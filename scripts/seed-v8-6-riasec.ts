import { Prisma, PrismaClient, MappingStatus, QuestionDifficulty, QuestionStatus, TaxonomyStatus } from "@prisma/client";
import bank from "../data/question-bank/riasec/RIASEC_V2_PREFERENCE_PRODUCTION_BANK.json";
const prisma=new PrismaClient();
const D=["R","I","A","S","E","C"] as const;
const isD=(x:string):x is typeof D[number]=>D.includes(x as any);
async function main(){
 if(bank.length!==60) throw new Error(`RIASEC_V2_BANK_COUNT:${bank.length}`);
 const c=Object.fromEntries(D.map(x=>[x,0])) as Record<typeof D[number],number>;
 for(const q of bank){if(!isD(q.dimension)||q.type!=="PREFERENCE"||q.answerType!=="LIKERT_5"||JSON.stringify(q.scale)!=="[1,2,3,4,5]"||JSON.stringify(q.scoringKey)!=="[1,2,3,4,5]"||q.reverseScore!==false||q.weight!==1) throw new Error(`RIASEC_V2_INVALID:${q.code}`);c[q.dimension]++;}
 if(new Set(bank.map(q=>q.code)).size!==60) throw new Error("RIASEC_V2_DUPLICATE_CODES");
 for(const x of D)if(c[x]!==10)throw new Error(`RIASEC_V2_DIMENSION_COUNT:${x}:${c[x]}`);
 const tt=await prisma.testType.findUnique({where:{code:"RIASEC"}});if(!tt)throw new Error("TEST_TYPE_NOT_FOUND:RIASEC");
 const tax=await prisma.taxonomyVersion.findUnique({where:{testTypeId_version:{testTypeId:tt.id,version:"RIASEC_TAXONOMY_V2"}}});if(!tax||tax.status!==TaxonomyStatus.ACTIVE)throw new Error("RIASEC_V2_TAXONOMY_NOT_ACTIVE");
 const now=new Date();
 await prisma.$transaction(async tx=>{for(const q of bank){
  const question=await tx.question.upsert({where:{code:q.code},create:{id:q.id,code:q.code},update:{}});
  await tx.questionVersion.upsert({where:{questionId_version:{questionId:question.id,version:q.version}},create:{
   questionId:question.id,version:q.version,testTypeId:tt.id,taxonomyVersion:"RIASEC_TAXONOMY_V2",text:q.text,domain:q.dimension,subdomain:q.subdomain,indicator:q.indicator,type:q.type,answerType:q.answerType,reverseScore:false,weight:1,scale:[1,2,3,4,5],scoringKey:[1,2,3,4,5],options:Prisma.JsonNull,correctOption:null,difficulty:QuestionDifficulty.MEDIUM,status:QuestionStatus.PUBLISHED,mappingStatus:MappingStatus.APPROVED,sourceFile:"RIASEC_V2_PREFERENCE_PRODUCTION_BANK.json",createdAt:now,updatedAt:now
  },update:{taxonomyVersion:"RIASEC_TAXONOMY_V2",text:q.text,domain:q.dimension,subdomain:q.subdomain,indicator:q.indicator,type:q.type,answerType:q.answerType,reverseScore:false,weight:1,scale:[1,2,3,4,5],scoringKey:[1,2,3,4,5],options:Prisma.JsonNull,correctOption:null,difficulty:QuestionDifficulty.MEDIUM,status:QuestionStatus.PUBLISHED,mappingStatus:MappingStatus.APPROVED,sourceFile:"RIASEC_V2_PREFERENCE_PRODUCTION_BANK.json",updatedAt:now}});
 }});
 console.log(`Seeded/verified ${bank.length} RIASEC V2 questions.`);
}
main().catch(e=>{console.error(e);process.exit(1)}).finally(()=>prisma.$disconnect());
