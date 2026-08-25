import fs from "node:fs";
import path from "node:path";

const root=process.cwd();
const reviewPath=path.join(root,"data/question-bank/review/RIASEC_QB_V1_HUMAN_REVIEW_DECISIONS_84.csv");
const candidatePath=path.join(root,"data/question-bank/production/RIASEC_QB_V1_PRODUCTION_CANDIDATE_60.csv");
const manifestPath=path.join(root,"data/question-bank/production/RIASEC_QB_V1_APPROVED_PRODUCTION_MANIFEST.json");
const DIMS=["R","I","A","S","E","C"];

function fail(c,m){throw new Error(`${c}: ${m}`);}
function parse(text){
  const rows=[];let row=[],field="",quoted=false;
  for(let i=0;i<text.length;i++){const c=text[i],n=text[i+1];
    if(c==='"'&&quoted&&n==='"'){field+='"';i++;continue}
    if(c==='"'){quoted=!quoted;continue}
    if(c===','&&!quoted){row.push(field);field="";continue}
    if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&n==='\n')i++;row.push(field);field="";if(row.some(v=>v.trim()))rows.push(row);row=[];continue}
    field+=c;
  }
  if(quoted)fail("CSV_QUOTE_ERROR","Unclosed quote.");
  if(field.length||row.length){row.push(field);if(row.some(v=>v.trim()))rows.push(row);}
  const h=(rows.shift()??[]).map(v=>v.trim().toLowerCase());
  return rows.map(v=>Object.fromEntries(h.map((k,i)=>[k,(v[i]??"").trim()])));
}
function norm(v){return String(v??"").trim().toUpperCase();}
if(!fs.existsSync(reviewPath))fail("REVIEW_DECISIONS_NOT_FOUND",reviewPath);
if(!fs.existsSync(candidatePath))fail("CANDIDATE_FILE_NOT_FOUND",candidatePath);
const rows=parse(fs.readFileSync(reviewPath,"utf8"));
const candidates=parse(fs.readFileSync(candidatePath,"utf8"));
if(rows.length!==84)fail("REVIEW_COUNT_MISMATCH",`Expected 84, found ${rows.length}.`);
if(candidates.length!==60)fail("CANDIDATE_60_COUNT_MISMATCH",`Expected 60, found ${candidates.length}.`);

const candidateSet=new Set(candidates.map(r=>r.id));
const approved=rows.filter(r=>norm(r.decision)==="APPROVE");
if(approved.length!==60)fail("APPROVED_COUNT_MISMATCH",`Expected 60, found ${approved.length}.`);

const counts=Object.fromEntries(DIMS.map(d=>[d,0]));
for(const r of approved){
  if(!candidateSet.has(r.id))fail("APPROVED_ID_NOT_IN_CANDIDATE_60",r.id);
  if(norm(r.mapping_review_status)!=="APPROVED")fail("MAPPING_NOT_APPROVED",r.id);
  if(norm(r.content_review_status)!=="APPROVED")fail("CONTENT_NOT_APPROVED",r.id);
  counts[norm(r.domain)]++;
}
for(const d of DIMS)if(counts[d]!==10)fail("DIMENSION_QUOTA_MISMATCH",`${d}: ${counts[d]}`);

const manifest={
  manifestVersion:"RIASEC_PRODUCTION_MANIFEST_V1",
  assessmentType:"riasec",
  requiredCount:60,
  requiredPerDimension:10,
  candidateSource:"data/question-bank/source/RIASEC_QB_V1_FULL_84_CANDIDATE.csv",
  candidateSelection:"data/question-bank/production/RIASEC_QB_V1_PRODUCTION_CANDIDATE_60.csv",
  questionIds:approved.map(r=>r.id),
  humanReview:{
    mappingApproved:true,
    contentApproved:true,
    reviewerApproved:true,
  },
  status:"APPROVED_FOR_PUBLICATION",
};
fs.writeFileSync(manifestPath,JSON.stringify(manifest,null,2)+"\n");
console.log("=== RIASEC F.10-C.2-C PRODUCTION MANIFEST GENERATION ===");
console.log("Approved items : 60");
for(const d of DIMS)console.log(`${d}: ${counts[d]}`);
console.log(`Manifest       : ${path.relative(root,manifestPath)}`);
console.log("Database mutation: NONE");
console.log("F.10-C.2-C PRODUCTION MANIFEST GENERATION: PASS");
