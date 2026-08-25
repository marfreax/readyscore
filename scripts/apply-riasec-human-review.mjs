import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const inputPath = path.resolve(process.argv[2] ?? "data/question-bank/review/RIASEC_QB_V1_HUMAN_REVIEW_TEMPLATE.json");
const outputPath = path.join(root, "data/question-bank/review/RIASEC_QB_V1_HUMAN_REVIEW_DECISIONS_84.csv");
const sourcePath = path.join(root, "data/question-bank/review/RIASEC_QB_V1_CONTENT_REVIEW_84.csv");

const DIMS = ["R","I","A","S","E","C"];

function fail(code, message) {
  throw new Error(`${code}: ${message}`);
}

function csvParse(text) {
  const rows = [];
  let row=[], field="", quoted=false;
  for (let i=0;i<text.length;i++) {
    const c=text[i], n=text[i+1];
    if(c==='"' && quoted && n==='"'){field+='"';i++;continue;}
    if(c==='"'){quoted=!quoted;continue;}
    if(c===','&&!quoted){row.push(field);field="";continue;}
    if((c==='\n'||c==='\r')&&!quoted){
      if(c==='\r'&&n==='\n')i++;
      row.push(field);field="";
      if(row.some(v=>v.trim()))rows.push(row);
      row=[];continue;
    }
    field+=c;
  }
  if(quoted)fail("CSV_QUOTE_ERROR","Unclosed quote.");
  if(field.length||row.length){row.push(field);if(row.some(v=>v.trim()))rows.push(row);}
  const headers=(rows.shift()??[]).map(v=>v.trim().toLowerCase());
  return rows.map(values=>Object.fromEntries(headers.map((h,i)=>[h,(values[i]??"").trim()])));
}

function csvEscape(v) {
  const s=String(v??"");
  return /[",\n\r]/.test(s) ? `"${s.replaceAll('"','""')}"` : s;
}

function norm(v){return String(v??"").trim().toUpperCase();}

if(!fs.existsSync(inputPath))fail("REVIEW_INPUT_NOT_FOUND",inputPath);
if(!fs.existsSync(sourcePath))fail("REVIEW_SOURCE_NOT_FOUND",sourcePath);

let input;
try { input=JSON.parse(fs.readFileSync(inputPath,"utf8")); }
catch(e){ fail("REVIEW_INPUT_INVALID_JSON",e instanceof Error?e.message:String(e)); }

if(input.schemaVersion!=="RIASEC_HUMAN_REVIEW_DECISION_V1")fail("REVIEW_SCHEMA_MISMATCH","Unexpected schemaVersion.");
if(input.assessmentType!=="riasec")fail("REVIEW_ASSESSMENT_TYPE","Expected riasec.");
if(!Array.isArray(input.decisions)||input.decisions.length!==84)fail("REVIEW_COUNT_MISMATCH","Exactly 84 decisions are required.");

const source=csvParse(fs.readFileSync(sourcePath,"utf8"));
if(source.length!==84)fail("SOURCE_COUNT_MISMATCH",`Expected 84, found ${source.length}.`);

const sourceIds=source.map(r=>r.id);
const inputIds=input.decisions.map(r=>String(r.id??"").trim());
if(new Set(inputIds).size!==84)fail("DUPLICATE_REVIEW_ID","Review IDs must be unique.");
if(new Set(sourceIds).size!==84)fail("DUPLICATE_SOURCE_ID","Source IDs must be unique.");

const sourceSet=new Set(sourceIds);
for(const id of inputIds)if(!sourceSet.has(id))fail("UNKNOWN_REVIEW_ID",id);

const byId=new Map(input.decisions.map(r=>[String(r.id).trim(),r]));
const allowed=new Set(["APPROVE","RESERVE","REJECT"]);
const rows=source.map(sourceRow=>{
  const decision=norm(byId.get(sourceRow.id)?.decision);
  const note=String(byId.get(sourceRow.id)?.reviewerNote??"").trim();
  if(!allowed.has(decision))fail("INCOMPLETE_HUMAN_REVIEW",`${sourceRow.id}: decision must be APPROVE, RESERVE, or REJECT.`);
  return {
    id:sourceRow.id,
    domain:sourceRow.domain,
    subdomain:sourceRow.subdomain,
    indicator:sourceRow.indicator,
    text:sourceRow.text,
    role:sourceRow.role,
    mapping_review_status:"APPROVED",
    content_review_status:decision==="APPROVE"?"APPROVED":"REVIEWED",
    decision,
    review_flags:"",
    reviewer_note:note,
  };
});

const approved=rows.filter(r=>r.decision==="APPROVE");
const counts=Object.fromEntries(DIMS.map(d=>[d,0]));
for(const r of approved)counts[r.domain.trim().toUpperCase()]++;

console.log("=== RIASEC F.10-C.2-B HUMAN REVIEW DECISION CAPTURE ===");
console.log(`Review population : ${rows.length}`);
console.log(`Approved         : ${approved.length}`);
for(const d of DIMS)console.log(`${d}: ${counts[d]} approved / 10 required`);

if(approved.length!==60)fail("APPROVAL_COUNT_MISMATCH",`Need exactly 60 APPROVE decisions; found ${approved.length}.`);
for(const d of DIMS)if(counts[d]!==10)fail("DIMENSION_QUOTA_MISMATCH",`${d}: expected 10, found ${counts[d]}.`);

const headers=["id","domain","subdomain","indicator","text","role","mapping_review_status","content_review_status","decision","review_flags","reviewer_note"];
const out=[headers.join(",")];
for(const r of rows)out.push(headers.map(h=>csvEscape(r[h])).join(","));
fs.writeFileSync(outputPath,out.join("\n")+"\n");

console.log(`Decision file     : ${path.relative(root,outputPath)}`);
console.log("Database mutation : NONE");
console.log("F.10-C.2-B HUMAN REVIEW DECISION CAPTURE: PASS");
