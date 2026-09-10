import { AssessmentConfigurationStatus, AssessmentType, Prisma } from "@prisma/client";
import { prisma } from "./db/prisma";
import { getPublishedEligibleQuestions } from "./question-bank-repository";

export type AdminAssessmentConfiguration = {
  id: string; code: string; name: string; assessmentType: AssessmentType; description: string | null;
  versionId: string; version: string; questionBankVersion: string; taxonomyVersion: string;
  scoringVersion: string; selectionAlgorithmVersion: string; questionCount: number;
  status: AssessmentConfigurationStatus; readiness: ReadinessReport; createdAt: string; updatedAt: string;
};

type ConfigurationRow = Prisma.AssessmentConfigurationGetPayload<{ include: { versions: true } }>;
type ReadinessCheck = { key:string; label:string; status:"PASS"|"WARN"|"BLOCK"; detail:string };
export type ReadinessReport = { status:"READY"|"WARNING"|"BLOCKED"; checks:ReadinessCheck[]; eligibleCount:number; requiredCount:number; coverage:Record<string,number> };

const groupForType: Partial<Record<AssessmentType,string>> = { DISC:"DISC", RIASEC:"RIASEC", EQ:"EQ", COGNITIVE:"IQ_COGNITIVE" };

function requiredDomains(type: AssessmentType, count:number) {
  if (type === "RIASEC") return Object.fromEntries(["R","I","A","S","E","C"].map(d=>[d, Math.floor(count/6)]));
  if (type === "DISC") return {};
  return {};
}

async function evaluateVersion(configurationType: AssessmentType, v: { questionCount:number; questionBankVersion:string; taxonomyVersion:string; scoringVersion:string; selectionAlgorithmVersion:string; metadata: Prisma.JsonValue | null }): Promise<ReadinessReport> {
  const checks: ReadinessCheck[] = [];
  const requiredCount = v.questionCount;
  const group = groupForType[configurationType];
  let eligible:any[] = [];
  try { eligible = await getPublishedEligibleQuestions(group); } catch { eligible = []; }
  const coverage:Record<string,number> = {};
  for (const q of eligible) coverage[String(q.domain).trim().toUpperCase()] = (coverage[String(q.domain).trim().toUpperCase()] ?? 0) + 1;
  checks.push({key:"question-inventory",label:"Eligible question inventory",status:eligible.length>=requiredCount?"PASS":"BLOCK",detail:`${eligible.length} eligible / ${requiredCount} required`});
  for (const [domain,min] of Object.entries(requiredDomains(configurationType, requiredCount))) {
    const actual=coverage[domain]??0; checks.push({key:`coverage-${domain}`,label:`Domain ${domain} coverage`,status:actual>=min?"PASS":"BLOCK",detail:`${actual} available / ${min} required`});
  }
  const fields=["questionBankVersion","taxonomyVersion","scoringVersion","selectionAlgorithmVersion"] as const;
  for(const key of fields) checks.push({key,label:key,status:String(v[key]??"").trim()?"PASS":"BLOCK",detail:String(v[key]??"").trim()?"Configured":"Missing"});
  const groupMeta = v.metadata && typeof v.metadata === "object" && !Array.isArray(v.metadata) ? (v.metadata as Record<string,unknown>).questionGroup : undefined;
  if(group){ checks.push({key:"question-group",label:"Question Group linkage",status:groupMeta===group?"PASS":"BLOCK",detail:groupMeta===group?`Linked to ${group}`:`Expected ${group}`}); }
  const status = checks.some(c=>c.status==="BLOCK") ? "BLOCKED" : checks.some(c=>c.status==="WARN") ? "WARNING" : "READY";
  return {status,checks,eligibleCount:eligible.length,requiredCount,coverage};
}

function mapRow(row: ConfigurationRow, readiness: ReadinessReport): AdminAssessmentConfiguration | null {
  const versions=[...row.versions].sort((a,b)=>{if(a.status==="ACTIVE"&&b.status!=="ACTIVE")return -1;if(b.status==="ACTIVE"&&a.status!=="ACTIVE")return 1;return b.createdAt.getTime()-a.createdAt.getTime();});
  const v=versions[0]; if(!v)return null;
  return {id:row.id,code:row.code,name:row.name,assessmentType:row.assessmentType,description:row.description,versionId:v.id,version:v.version,questionBankVersion:v.questionBankVersion,taxonomyVersion:v.taxonomyVersion,scoringVersion:v.scoringVersion,selectionAlgorithmVersion:v.selectionAlgorithmVersion,questionCount:v.questionCount,status:v.status,readiness,createdAt:row.createdAt.toISOString(),updatedAt:v.updatedAt.toISOString()};
}

async function load(){return prisma.assessmentConfiguration.findMany({include:{versions:{orderBy:[{updatedAt:"desc"},{id:"desc"}]}},orderBy:[{assessmentType:"asc"},{code:"asc"}]});}

export async function listAssessmentConfigurations(){const rows=await load();const out:AdminAssessmentConfiguration[]=[];for(const row of rows){const versions=[...row.versions].sort((a,b)=>{if(a.status==="ACTIVE"&&b.status!=="ACTIVE")return -1;if(b.status==="ACTIVE"&&a.status!=="ACTIVE")return 1;return b.createdAt.getTime()-a.createdAt.getTime();});if(versions[0])out.push(mapRow(row,await evaluateVersion(row.assessmentType,versions[0]))!);}return out;}

export async function getAssessmentConfiguration(id:string){const row=await prisma.assessmentConfiguration.findUnique({where:{id},include:{versions:{orderBy:[{createdAt:"desc"},{id:"desc"}]}}});if(!row)return null;const versions=await Promise.all(row.versions.map(async v=>({id:v.id,version:v.version,questionBankVersion:v.questionBankVersion,taxonomyVersion:v.taxonomyVersion,scoringVersion:v.scoringVersion,selectionAlgorithmVersion:v.selectionAlgorithmVersion,questionCount:v.questionCount,status:v.status,createdAt:v.createdAt.toISOString(),updatedAt:v.updatedAt.toISOString(),readiness:await evaluateVersion(row.assessmentType,v)})));return {logical:row,versions};}

async function nextVersion(tx:Prisma.TransactionClient,configurationId:string){const rows=await tx.assessmentConfigurationVersion.findMany({where:{configurationId},select:{version:true}});const max=rows.reduce((n,r)=>{const m=/^v(\d+)$/i.exec(r.version.trim());return m?Math.max(n,Number(m[1])):n;},0);return `v${max+1}`;}

type Input={id?:string;code:string;name:string;assessmentType:AssessmentType;description?:string|null;version?:string;questionBankVersion:string;taxonomyVersion:string;scoringVersion:string;selectionAlgorithmVersion:string;questionCount:number};
function metadataFor(type:AssessmentType, input:Pick<Input,"questionCount">){const group=groupForType[type];return {questionGroup:group??null,selectionConstraints:{requiredCount:input.questionCount},coverageRequirements:requiredDomains(type,input.questionCount),governance:{historicalAttemptsImmutable:true,activationRequiresReadiness:true}};}

export async function createConfiguration(input:Input){if(!input.code.trim()||!input.name.trim())throw new Error("INVALID_CONFIGURATION");if(!Number.isInteger(input.questionCount)||input.questionCount<=0)throw new Error("INVALID_QUESTION_COUNT");const id=input.id?.trim()||`${input.code.trim().toLowerCase()}-config`;const version=input.version?.trim()||"v1";return prisma.$transaction(async tx=>{const logical=await tx.assessmentConfiguration.create({data:{id,code:input.code.trim(),name:input.name.trim(),assessmentType:input.assessmentType,description:input.description?.trim()||null}});const v=await tx.assessmentConfigurationVersion.create({data:{configurationId:logical.id,version,questionBankVersion:input.questionBankVersion.trim(),taxonomyVersion:input.taxonomyVersion.trim(),scoringVersion:input.scoringVersion.trim(),selectionAlgorithmVersion:input.selectionAlgorithmVersion.trim(),questionCount:input.questionCount,status:"DRAFT",metadata:metadataFor(input.assessmentType,input)}});return {logical,version:v};});}

export async function createConfigurationVersion(id:string,input:Omit<Input,"id"|"code"|"name"|"assessmentType">){if(!Number.isInteger(input.questionCount)||input.questionCount<=0)throw new Error("INVALID_QUESTION_COUNT");return prisma.$transaction(async tx=>{const logical=await tx.assessmentConfiguration.findUnique({where:{id}});if(!logical)throw new Error("CONFIGURATION_NOT_FOUND");const version=await nextVersion(tx,id);const v=await tx.assessmentConfigurationVersion.create({data:{configurationId:id,version,questionBankVersion:input.questionBankVersion.trim(),taxonomyVersion:input.taxonomyVersion.trim(),scoringVersion:input.scoringVersion.trim(),selectionAlgorithmVersion:input.selectionAlgorithmVersion.trim(),questionCount:input.questionCount,status:"DRAFT",metadata:metadataFor(logical.assessmentType,input)}});return {logical,version:v};});}

export async function getConfigurationVersionReadiness(versionId:string){const v=await prisma.assessmentConfigurationVersion.findUnique({where:{id:versionId},include:{configuration:true}});if(!v)throw new Error("VERSION_NOT_FOUND");return {versionId,version:v.version,configurationId:v.configurationId,configurationType:v.configuration.assessmentType,readiness:await evaluateVersion(v.configuration.assessmentType,v)};}

export async function activateConfigurationVersion(versionId:string){const check=await getConfigurationVersionReadiness(versionId);if(check.readiness.status==="BLOCKED")throw new Error("CONFIGURATION_NOT_READY");return prisma.$transaction(async tx=>{const current=await tx.assessmentConfigurationVersion.findUnique({where:{id:versionId}});if(!current)throw new Error("VERSION_NOT_FOUND");if(current.status==="ARCHIVED")throw new Error("ARCHIVED_VERSION");await tx.assessmentConfigurationVersion.updateMany({where:{configurationId:current.configurationId,status:"ACTIVE"},data:{status:"ARCHIVED"}});return tx.assessmentConfigurationVersion.update({where:{id:versionId},data:{status:"ACTIVE"}});});}

export async function archiveConfigurationVersion(versionId:string){const current=await prisma.assessmentConfigurationVersion.findUnique({where:{id:versionId},include:{configuration:true}});if(!current)throw new Error("VERSION_NOT_FOUND");if(current.status==="ACTIVE")throw new Error("ACTIVE_VERSION_CANNOT_ARCHIVE");return prisma.assessmentConfigurationVersion.update({where:{id:versionId},data:{status:"ARCHIVED"}});}

export async function getAssessmentConfigurationStats(){const [logical,versions,active,blocked]=await Promise.all([prisma.assessmentConfiguration.count(),prisma.assessmentConfigurationVersion.count(),prisma.assessmentConfigurationVersion.count({where:{status:"ACTIVE"}}),prisma.assessmentConfigurationVersion.count({where:{status:{in:["DRAFT","REVIEW","APPROVED"]}}})]);return {logical,versions,active,attention:blocked};}
