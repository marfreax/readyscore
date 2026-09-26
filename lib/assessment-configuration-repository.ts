import { AssessmentConfigurationStatus, AssessmentType, Prisma } from "@prisma/client";
import { prisma } from "./db/prisma";

type CompositionItem = { code: string; name?: string; requiredCount: number };
export type SupportedAssessmentType = Exclude<AssessmentType, "PREMIUM">;
export type ReadinessCheck = { key:string; label:string; status:"PASS"|"WARN"|"BLOCK"; detail:string };
export type ReadinessReport = { status:"READY"|"WARNING"|"BLOCKED"; checks:ReadinessCheck[]; eligibleCount:number; requiredCount:number; coverage:Record<string,number>; composition:CompositionItem[] };
export type AdminAssessmentConfiguration = { id:string;code:string;name:string;assessmentType:AssessmentType;description:string|null;versionId:string;version:string;questionBankVersion:string;taxonomyVersion:string;scoringVersion:string;selectionAlgorithmVersion:string;questionCount:number;composition:CompositionItem[];status:AssessmentConfigurationStatus;readiness:ReadinessReport;createdAt:string;updatedAt:string };

type ConfigurationRow = any;
const SUPPORTED = new Set<SupportedAssessmentType>(["FREE","RIASEC","DISC","EQ","COGNITIVE"]);
const OPERATIONAL_CONFIG_CODES: Record<SupportedAssessmentType,string> = {
 FREE:"free-v1",
 RIASEC:"riasec-v1",
 DISC:"disc-v1",
 EQ:"eq-v1",
 COGNITIVE:"cognitive-v1",
};
const OPERATIONAL_CONFIG_CODE_SET = new Set(Object.values(OPERATIONAL_CONFIG_CODES));
function isOperationalConfiguration(row:{code?:string;assessmentType?:AssessmentType}){
 const code=String(row.code??"").trim().toLowerCase();
 const type=row.assessmentType as SupportedAssessmentType;
 return SUPPORTED.has(type) && OPERATIONAL_CONFIG_CODE_SET.has(code) && OPERATIONAL_CONFIG_CODES[type]===code;
}
const groupForType:Partial<Record<AssessmentType,string>>={DISC:"DISC",RIASEC:"RIASEC",EQ:"EQ",COGNITIVE:"IQ_COGNITIVE",FREE:"RIASEC"};
const DEFAULT_COMPOSITION:Record<SupportedAssessmentType,CompositionItem[]>={
 FREE:["R","I","A","S","E","C"].map((code,i)=>({code,requiredCount:i<4?2:1})),
 RIASEC:["R","I","A","S","E","C"].map(code=>({code,requiredCount:10})),
 DISC:["TARGET_D","TARGET_I","TARGET_S","TARGET_C"].map(code=>({code,requiredCount:20})),
 EQ:["EMOTION_AWARENESS","EMOTION_REGULATION","EMPATHY_SOCIAL_AWARENESS","RELATIONSHIP_SOCIAL_RESPONSE"].map((code,i)=>({code,requiredCount:i<2?13:12})),
 COGNITIVE:["VERBAL_REASONING","NUMERICAL_REASONING","LOGICAL_REASONING","ABSTRACT_REASONING"].map(code=>({code,requiredCount:10})),
};

function normalizeComposition(type:SupportedAssessmentType, value:unknown):CompositionItem[]{
 const source=Array.isArray(value)?value:[];
 const byCode=new Map(source.map((x:any)=>[String(x?.code??"").trim().toUpperCase(),Math.max(0,Number(x?.requiredCount??0))]));
 const defaults=DEFAULT_COMPOSITION[type]??[];
 return defaults.map(d=>({code:d.code,requiredCount:byCode.has(d.code)?Number(byCode.get(d.code)):d.requiredCount,name:d.name}));
}
function compositionFromVersion(type:SupportedAssessmentType,v:any):CompositionItem[]{
 const metadata=v?.metadata&&typeof v.metadata==="object"&&!Array.isArray(v.metadata)?v.metadata as Record<string,unknown>:{};
 if(Array.isArray(metadata.composition))return normalizeComposition(type,metadata.composition);
 const rules=v?.questionPackageVersion?.compositionRules??[];
 if(rules.length)return rules.map((r:any)=>({code:r.taxonomyNode.code,name:r.taxonomyNode.name,requiredCount:r.requiredCount}));
 return normalizeComposition(type,null);
}
function total(comp:CompositionItem[]){return comp.reduce((s,x)=>s+x.requiredCount,0);}
function eligibleFor(type:SupportedAssessmentType,row:any){
 const q=row;
 if(q.status!=="PUBLISHED"||q.mappingStatus!=="APPROVED"||!String(q.text??"").trim())return false;
 if(type==="FREE")return q.testType?.code==="RIASEC"&&q.taxonomyVersion==="RIASEC_TAXONOMY_V2"&&/^[RIASEC]$/.test(String(q.domain??"").trim().toUpperCase())&&q.answerType==="LIKERT_5"&&q.scale.length===5&&q.scoringKey.length===5&&q.weight>0;
 return q.testType?.code===type&&String(q.taxonomyVersion??"").trim().length>0;
}
function matches(node:any,q:any){const meta=node.metadata&&typeof node.metadata==="object"&&!Array.isArray(node.metadata)?node.metadata:{};const aliases=Array.isArray(meta.aliases)?meta.aliases.map(String).map((x:string)=>x.trim().toUpperCase()):[];const values=[q.domain,q.subdomain,q.indicator].filter(Boolean).map((x:any)=>String(x).trim().toUpperCase());return values.includes(String(node.code).toUpperCase())||values.includes(String(node.name).trim().toUpperCase())||values.some(x=>aliases.includes(x));}

async function evaluateVersion(type:SupportedAssessmentType,v:any):Promise<ReadinessReport>{
 const composition=compositionFromVersion(type,v); const requiredCount=total(composition); const checks:ReadinessCheck[]=[];
 const fields=["questionBankVersion","taxonomyVersion","scoringVersion","selectionAlgorithmVersion"] as const;
 for(const key of fields)checks.push({key,label:key,status:String(v[key]??"").trim()?"PASS":"BLOCK",detail:String(v[key]??"").trim()?"Configured":"Missing"});
 if(!SUPPORTED.has(type))checks.push({key:"assessment-type",label:"Supported assessment type",status:"BLOCK",detail:`${type} is not part of the current runtime catalog`});
 if(requiredCount!==v.questionCount)checks.push({key:"count-derived",label:"Question count matches composition",status:"BLOCK",detail:`composition=${requiredCount} / stored=${v.questionCount}`});else checks.push({key:"count-derived",label:"Question count matches composition",status:"PASS",detail:`${requiredCount} questions configured`});
 const rows=await prisma.questionVersion.findMany({where:{status:"PUBLISHED",mappingStatus:"APPROVED",text:{not:""}},include:{testType:true},orderBy:[{questionId:"asc"},{createdAt:"desc"},{id:"desc"}]});
 const latest=new Map<string,any>();for(const row of rows)if(!latest.has(row.questionId))latest.set(row.questionId,row);
 const eligible=[...latest.values()].filter(q=>eligibleFor(type,q)); const coverage:Record<string,number>={};
 for(const item of composition){const count=eligible.filter(q=>{const code=item.code;return String(q.domain??"").trim().toUpperCase()===code||String(q.subdomain??"").trim().toUpperCase()===code||String(q.indicator??"").trim().toUpperCase()===code;}).length;coverage[item.code]=count;checks.push({key:`coverage-${item.code}`,label:`${item.code} coverage`,status:count>=item.requiredCount?"PASS":"BLOCK",detail:`${count} available / ${item.requiredCount} required`});}
 checks.push({key:"question-inventory",label:"Published question pool",status:eligible.length>=requiredCount?"PASS":"BLOCK",detail:`${eligible.length} eligible / ${requiredCount} required`});
 const pkg=v.questionPackageVersion;
 checks.push({key:"runtime-package",label:"Runtime package linkage",status:pkg?"PASS":"BLOCK",detail:pkg?`${pkg.id}`:"Missing internal runtime package"});
 if(pkg){const internal=pkg.metadata&&typeof pkg.metadata==="object"&&!Array.isArray(pkg.metadata)&&Boolean((pkg.metadata as Record<string,unknown>).internalRuntime);checks.push({key:"runtime-package-published",label:"Runtime package state",status:pkg.status==="PUBLISHED"||internal?"PASS":"BLOCK",detail:pkg.status==="PUBLISHED"?"PUBLISHED":internal?"READY TO PUBLISH ON ACTIVATION":pkg.status});checks.push({key:"runtime-package-composition",label:"Runtime package follows configuration",status:pkg.compositionRules?.length?"PASS":"BLOCK",detail:`${pkg.compositionRules?.length??0} rules`});}
 const status=checks.some(c=>c.status==="BLOCK")?"BLOCKED":checks.some(c=>c.status==="WARN")?"WARNING":"READY";
 return {status,checks,eligibleCount:eligible.length,requiredCount,coverage,composition};
}
function sortVersions(vs:any[]){return [...vs].sort((a,b)=>{if(a.status==="ACTIVE"&&b.status!=="ACTIVE")return-1;if(b.status==="ACTIVE"&&a.status!=="ACTIVE")return 1;return b.createdAt.getTime()-a.createdAt.getTime();});}
function mapRow(row:any,readiness:ReadinessReport):AdminAssessmentConfiguration|null{const v=sortVersions(row.versions)[0];if(!v)return null;return {id:row.id,code:row.code,name:row.name,assessmentType:row.assessmentType,description:row.description,versionId:v.id,version:v.version,questionBankVersion:v.questionBankVersion,taxonomyVersion:v.taxonomyVersion,scoringVersion:v.scoringVersion,selectionAlgorithmVersion:v.selectionAlgorithmVersion,questionCount:v.questionCount,composition:readiness.composition,status:v.status,readiness,createdAt:row.createdAt.toISOString(),updatedAt:v.updatedAt.toISOString()};}
const PACKAGE_INCLUDE={
  compositionRules:{include:{taxonomyNode:true}},
  taxonomy:true,
  package:{include:{testType:true}},
};
async function load(){
  return prisma.assessmentConfiguration.findMany({
    include:{versions:{include:{questionPackageVersion:{include:PACKAGE_INCLUDE}},orderBy:[{updatedAt:"desc"},{id:"desc"}]}},
    orderBy:[{assessmentType:"asc"},{code:"asc"}],
  });
}
export async function listAssessmentConfigurations(){
  const rows=await load(); const out:AdminAssessmentConfiguration[]=[];
  for(const row of rows){
    if(!isOperationalConfiguration(row)) continue;
    const v=sortVersions(row.versions)[0];
    if(v) out.push(mapRow(row,await evaluateVersion(row.assessmentType as SupportedAssessmentType,v))!);
  }
  return out.sort((a,b)=>Object.keys(OPERATIONAL_CONFIG_CODES).indexOf(a.assessmentType)-Object.keys(OPERATIONAL_CONFIG_CODES).indexOf(b.assessmentType));
}
export async function getAssessmentConfiguration(id:string){
  const row=await prisma.assessmentConfiguration.findUnique({where:{id},include:{versions:{include:{questionPackageVersion:{include:PACKAGE_INCLUDE}},orderBy:{createdAt:"desc"}}}});
  if(!row)return null;
  if(!isOperationalConfiguration(row)) throw new Error("CONFIGURATION_NOT_FOUND");
  const supportedType=row.assessmentType as SupportedAssessmentType; const versions=await Promise.all(row.versions.map(async(v:any)=>({id:v.id,version:v.version,questionBankVersion:v.questionBankVersion,taxonomyVersion:v.taxonomyVersion,scoringVersion:v.scoringVersion,selectionAlgorithmVersion:v.selectionAlgorithmVersion,questionCount:v.questionCount,composition:compositionFromVersion(supportedType,v),status:v.status,createdAt:v.createdAt.toISOString(),updatedAt:v.updatedAt.toISOString(),readiness:await evaluateVersion(supportedType,v)})));
  return {logical:row,versions};
}
async function nextVersion(tx:Prisma.TransactionClient,configurationId:string){const rows=await tx.assessmentConfigurationVersion.findMany({where:{configurationId},select:{version:true}});const max=rows.reduce((n,r)=>{const m=/^v(\d+)$/i.exec(r.version.trim());return m?Math.max(n,Number(m[1])):n;},0);return `v${max+1}`;}
type Input={id?:string;code:string;name:string;assessmentType:SupportedAssessmentType;description?:string|null;version?:string;questionBankVersion:string;taxonomyVersion:string;scoringVersion:string;selectionAlgorithmVersion:string;composition:CompositionItem[]};
function metadataFor(type:SupportedAssessmentType,input:{composition:CompositionItem[]}){const composition=normalizeComposition(type,input.composition);return {questionGroup:groupForType[type]??null,composition,selectionConstraints:{requiredCount:total(composition)},governance:{historicalAttemptsImmutable:true,activationRequiresReadiness:true,runtimePackageInternal:true}};}
async function resolveTaxonomy(tx:Prisma.TransactionClient,type:SupportedAssessmentType,version:string){const tt=await tx.testType.findUnique({where:{code:type}});if(!tt)throw new Error(`TEST_TYPE_NOT_FOUND:${type}`);const tax=await tx.taxonomyVersion.findFirst({where:{testTypeId:tt.id,version:version,status:"ACTIVE"},include:{nodes:true}});if(!tax)throw new Error(`TAXONOMY_NOT_FOUND:${type}:${version}`);return {tt,tax};}
async function ensureRuntimePackage(tx:Prisma.TransactionClient,type:SupportedAssessmentType,configVersionId:string,version:string,composition:CompositionItem[],questionCount:number,questionBankVersion:string){
  const {tt,tax}=await resolveTaxonomy(tx,type,version);
  let pkg=await tx.questionPackage.findUnique({where:{code:`${type.toLowerCase()}-runtime`},include:{versions:true}});
  if(!pkg)pkg=await tx.questionPackage.create({data:{id:`${type.toLowerCase()}-runtime-package`,testTypeId:tt.id,code:`${type.toLowerCase()}-runtime`,name:`${type} Internal Runtime Package`,description:"Internal runtime artifact. Admins configure the assessment; this package is maintained automatically."},include:{versions:true}});
  const nodes=composition.map(c=>({c,node:tax.nodes.find(n=>n.code.toUpperCase()===c.code.toUpperCase())}));
  if(nodes.some(x=>!x.node))throw new Error(`COMPOSITION_NODE_NOT_FOUND:${type}`);
  const existing=await tx.questionPackageVersion.findFirst({where:{packageId:pkg.id,metadata:{path:["configurationVersionId"],equals:configVersionId}},include:PACKAGE_INCLUDE});
  if(existing)return existing;
  return tx.questionPackageVersion.create({data:{packageId:pkg.id,version:`v${pkg.versions.length+1}`,totalQuestions:questionCount,timeLimitSeconds:type==="FREE"?0:1200,status:"DRAFT",taxonomyVersionId:tax.id,metadata:{internalRuntime:true,configurationVersionId:configVersionId,questionBankVersion,selectionScope:type==="FREE"?"RIASEC_FREE":"TEST_TYPE"},compositionRules:{create:nodes.map(({c,node})=>({taxonomyNodeId:node!.id,requiredCount:c.requiredCount}))}},include:PACKAGE_INCLUDE});
}
export async function createConfiguration(input:Input){
  if(!SUPPORTED.has(input.assessmentType))throw new Error("INVALID_ASSESSMENT_TYPE");
  const composition=normalizeComposition(input.assessmentType,input.composition);const questionCount=total(composition);
  if(!input.code.trim()||!input.name.trim())throw new Error("INVALID_CONFIGURATION");
  return prisma.$transaction(async tx=>{const logical=await tx.assessmentConfiguration.create({data:{id:input.id?.trim()||`${input.code.trim().toLowerCase()}-config`,code:input.code.trim(),name:input.name.trim(),assessmentType:input.assessmentType,description:input.description?.trim()||null}});const temp=await tx.assessmentConfigurationVersion.create({data:{configurationId:logical.id,version:input.version?.trim()||"v1",questionBankVersion:input.questionBankVersion.trim(),taxonomyVersion:input.taxonomyVersion.trim(),scoringVersion:input.scoringVersion.trim(),selectionAlgorithmVersion:input.selectionAlgorithmVersion.trim(),questionCount,status:"DRAFT",metadata:metadataFor(input.assessmentType,{...input,composition})}});const pkg=await ensureRuntimePackage(tx,input.assessmentType,temp.id,input.taxonomyVersion,composition,questionCount,input.questionBankVersion);return tx.assessmentConfigurationVersion.update({where:{id:temp.id},data:{questionPackageVersionId:pkg.id}});});
}
export async function createConfigurationVersion(id:string,input:Omit<Input,"id"|"code"|"name"|"assessmentType">){
  return prisma.$transaction(async tx=>{const logical=await tx.assessmentConfiguration.findUnique({where:{id}});if(!logical||!SUPPORTED.has(logical.assessmentType as SupportedAssessmentType))throw new Error("CONFIGURATION_NOT_FOUND");const supportedType=logical.assessmentType as SupportedAssessmentType;const composition=normalizeComposition(supportedType,input.composition);const questionCount=total(composition);const temp=await tx.assessmentConfigurationVersion.create({data:{configurationId:id,version:await nextVersion(tx,id),questionBankVersion:input.questionBankVersion.trim(),taxonomyVersion:input.taxonomyVersion.trim(),scoringVersion:input.scoringVersion.trim(),selectionAlgorithmVersion:input.selectionAlgorithmVersion.trim(),questionCount,status:"DRAFT",metadata:metadataFor(supportedType,{...input,composition})}});const pkg=await ensureRuntimePackage(tx,supportedType,temp.id,input.taxonomyVersion,composition,questionCount,input.questionBankVersion);return tx.assessmentConfigurationVersion.update({where:{id:temp.id},data:{questionPackageVersionId:pkg.id}});});
}
export async function getConfigurationVersionReadiness(versionId:string){
  const v=await prisma.assessmentConfigurationVersion.findUnique({where:{id:versionId},include:{configuration:true,questionPackageVersion:{include:PACKAGE_INCLUDE}}});
  if(!v)throw new Error("VERSION_NOT_FOUND");if(!isOperationalConfiguration(v.configuration)) throw new Error("CONFIGURATION_NOT_FOUND");const readiness=await evaluateVersion(v.configuration.assessmentType as SupportedAssessmentType,v);return {versionId,version:v.version,configurationId:v.configurationId,configurationType:v.configuration.assessmentType,readiness};
}
async function promotePackageIfReady(tx:Prisma.TransactionClient,v:any){
  const pkg=v.questionPackageVersion;if(!pkg)return false;
  if(!SUPPORTED.has(v.configuration.assessmentType as SupportedAssessmentType)) return false; const readiness=await evaluateVersion(v.configuration.assessmentType as SupportedAssessmentType,{...v,questionPackageVersion:{...pkg,status:"PUBLISHED"}});
  if(readiness.status!=="READY")return false;
  if(pkg.status!=="PUBLISHED")await tx.questionPackageVersion.update({where:{id:pkg.id},data:{status:"PUBLISHED"}});return true;
}
export async function activateConfigurationVersion(versionId:string){
  const current=await prisma.assessmentConfigurationVersion.findUnique({where:{id:versionId},include:{configuration:true,questionPackageVersion:{include:PACKAGE_INCLUDE}}});
  if(!current)throw new Error("VERSION_NOT_FOUND");if(!isOperationalConfiguration(current.configuration))throw new Error("CONFIGURATION_NOT_FOUND");if(current.status==="ARCHIVED")throw new Error("ARCHIVED_VERSION");
  return prisma.$transaction(async tx=>{const fresh=await tx.assessmentConfigurationVersion.findUnique({where:{id:versionId},include:{configuration:true,questionPackageVersion:{include:PACKAGE_INCLUDE}}});if(!fresh)throw new Error("VERSION_NOT_FOUND");const ok=await promotePackageIfReady(tx,fresh);if(!ok)throw new Error("CONFIGURATION_NOT_READY");await tx.assessmentConfigurationVersion.updateMany({where:{configurationId:fresh.configurationId,status:"ACTIVE",id:{not:fresh.id}},data:{status:"ARCHIVED"}});return tx.assessmentConfigurationVersion.update({where:{id:fresh.id},data:{status:"ACTIVE"}});});
}
export async function archiveConfigurationVersion(versionId:string){const current=await prisma.assessmentConfigurationVersion.findUnique({where:{id:versionId},include:{configuration:true}});if(!current)throw new Error("VERSION_NOT_FOUND");if(!isOperationalConfiguration(current.configuration))throw new Error("CONFIGURATION_NOT_FOUND");if(current.status==="ACTIVE")throw new Error("ACTIVE_VERSION_CANNOT_ARCHIVE");return prisma.assessmentConfigurationVersion.update({where:{id:versionId},data:{status:"ARCHIVED"}});}
export async function getAssessmentConfigurationStats(){const codes=[...OPERATIONAL_CONFIG_CODE_SET];const where={code:{in:codes}};const [logical,versions,active,attention]=await Promise.all([prisma.assessmentConfiguration.count({where}),prisma.assessmentConfigurationVersion.count({where:{configuration:where}}),prisma.assessmentConfigurationVersion.count({where:{status:"ACTIVE",configuration:where}}),prisma.assessmentConfigurationVersion.count({where:{status:{in:["DRAFT","REVIEW","APPROVED"]},configuration:where}})]);return {logical,versions,active,attention};}
