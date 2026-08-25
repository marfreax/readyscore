import fs from "node:fs";
import path from "node:path";
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

export default function RiasecReviewPage() {
  const file=path.join(process.cwd(),"data/question-bank/source/RIASEC_QB_V1_FULL_84_CANDIDATE.csv");
  const candidates=parseCsv(fs.readFileSync(file,"utf8"));
  return <RiasecHumanReviewWorkspace candidates={candidates} />;
}
