import fs from "node:fs";
import path from "node:path";
import { requireAdmin } from "../../../lib/auth/admin";
import RiasecHumanReviewWorkspace from "../../../components/admin/RiasecHumanReviewWorkspace";

type Candidate = {
  id: string; domain: string; subdomain: string | null; indicator: string | null; text: string;
};

function parseCsv(text: string): Candidate[] {
  const rows: string[][]=[]; let row:string[]=[]; let field=""; let quoted=false;
  for(let i=0;i<text.length;i++){const c=text[i],n=text[i+1];
    if(c==='"'&&quoted&&n==='"'){field+='"';i++;continue}
    if(c==='"'){quoted=!quoted;continue}
    if(c===','&&!quoted){row.push(field);field="";continue}
    if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&n==='\n')i++;row.push(field);field="";if(row.some(v=>v.trim()))rows.push(row);row=[];continue}
    field+=c;
  }
  if(field.length||row.length){row.push(field);if(row.some(v=>v.trim()))rows.push(row)}
  const headers=(rows.shift()??[]).map(v=>v.trim().toLowerCase());
  return rows.map(v=>Object.fromEntries(headers.map((h,i)=>[h,(v[i]??"").trim()])) as Candidate);
}

export default async function RiasecReviewPage() {
  await requireAdmin();
  const file=path.join(process.cwd(),"data/question-bank/source/RIASEC_QB_V1_FULL_84_CANDIDATE.csv");
  const candidates=parseCsv(fs.readFileSync(file,"utf8"));
  return <section className="rs-container py-8 sm:py-10"><div className="mb-8"><p className="rs-eyebrow">Content · Review</p><h1 className="rs-section-title mt-1 text-3xl">RIASEC Human Review</h1><p className="rs-subtitle mt-2">Specialized review workspace for the RIASEC candidate set.</p></div><RiasecHumanReviewWorkspace candidates={candidates} /></section>;
}
