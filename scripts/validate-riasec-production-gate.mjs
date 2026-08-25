import fs from "node:fs";
import path from "node:path";
const root=process.cwd();
const manifestPath=path.join(root,"data/question-bank/production/RIASEC_QB_V1_APPROVED_PRODUCTION_MANIFEST.json");
const reviewPath=path.join(root,"data/question-bank/review/RIASEC_QB_V1_HUMAN_REVIEW_DECISIONS_84.csv");
function fail(c,m){throw new Error(`${c}: ${m}`)}
function parse(text){const rows=[];let row=[],field="",q=false;for(let i=0;i<text.length;i++){const c=text[i],n=text[i+1];if(c==='"'&&q&&n==='"'){field+='"';i++;continue}if(c==='"'){q=!q;continue}if(c===','&&!q){row.push(field);field="";continue}if((c==='\n'||c==='\r')&&!q){if(c==='\r'&&n==='\n')i++;row.push(field);field="";if(row.some(v=>v.trim()))rows.push(row);row=[];continue}field+=c}if(q)fail('CSV_QUOTE_ERROR','Unclosed quote');if(field.length||row.length){row.push(field);if(row.some(v=>v.trim()))rows.push(row)}const h=(rows.shift()??[]).map(v=>v.trim().toLowerCase());return rows.map(v=>Object.fromEntries(h.map((k,i)=>[k,(v[i]??'').trim()])))}
const m=JSON.parse(fs.readFileSync(manifestPath,'utf8'));const r=parse(fs.readFileSync(reviewPath,'utf8'));
if(m.status!=="APPROVED_FOR_PUBLICATION")fail("MANIFEST_NOT_APPROVED",`Current manifest status: ${m.status}`);
if(!Array.isArray(m.questionIds)||m.questionIds.length!==60)fail("MANIFEST_COUNT",`Expected 60, found ${m.questionIds?.length??0}`);
if(m.humanReview?.mappingApproved!==true||m.humanReview?.contentApproved!==true||m.humanReview?.reviewerApproved!==true)fail("HUMAN_REVIEW_GATE","All explicit approval flags must be true.");
const ids=new Set(m.questionIds);const rr=new Map(r.map(x=>[x.id,x]));
for(const id of ids){const x=rr.get(id);if(!x)fail("REVIEW_ID_MISSING",id);if(x.decision!=="APPROVE"||x.mapping_review_status!=="APPROVED"||x.content_review_status!=="APPROVED")fail("REVIEW_NOT_APPROVED",id)}
const c=Object.fromEntries(['R','I','A','S','E','C'].map(d=>[d,0]));for(const id of ids)c[rr.get(id).domain]++;for(const d of Object.keys(c))if(c[d]!==10)fail("DIMENSION_QUOTA",`${d}: ${c[d]}`);
console.log("=== RIASEC PRODUCTION GATE ===");console.log("Manifest status      : APPROVED_FOR_PUBLICATION");console.log("Human review         : EXPLICITLY APPROVED");console.log("Production questions : 60");console.log("R/I/A/S/E/C          : 10/10/10/10/10/10");console.log("Database mutation    : NONE");console.log("RIASEC PRODUCTION GATE: PASS");
