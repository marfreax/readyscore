import fs from "node:fs";
import path from "node:path";

const base = "fixtures/v11-7-11/four-group";
const fixtures = [
  { file: "disc-question-bank-sample-100.csv", group: "DISC", headers: ["id","domain","subdomain","indicator","text","type","answerType","options","scoringKey","weight","difficulty"] },
  { file: "riasec-question-bank-sample-100.csv", group: "RIASEC", headers: ["id","domain","subdomain","indicator","text","type","answerType","scale","scoringKey","reverseScore","weight","difficulty"] },
  { file: "iq_cognitive-question-bank-sample-100.csv", group: "COGNITIVE", headers: ["id","domain","subdomain","indicator","text","type","answerType","options","correctOption","scoringKey","weight","difficulty"] },
  { file: "eq-question-bank-sample-100.csv", group: "EQ", headers: ["id","domain","subdomain","indicator","text","type","answerType","options","correctOption","scoringKey","weight","difficulty"] },
];
let failures = 0;
const allIds = new Set();
function check(ok, label) { if (ok) console.log(`PASS: ${label}`); else { console.error(`FAIL: ${label}`); failures += 1; } }
function parseCsv(text) {
  const lines = text.replaceAll("\r\n", "\n").replaceAll("\r", "\n").trimEnd().split("\n");
  return lines.map(line => {
    const out=[]; let cur=""; let q=false;
    for (let i=0;i<line.length;i++) { const c=line[i], n=line[i+1]; if(c==='"'&&q&&n==='"'){cur+='"';i++;continue;} if(c==='"'){q=!q;continue;} if(c===','&&!q){out.push(cur);cur='';continue;} cur+=c; }
    out.push(cur); return out;
  });
}
check(fs.existsSync(base), "four-group fixture directory");
check(fs.existsSync(`${base}/README.md`), "fixture README");
for (const f of fixtures) {
  const p=path.join(base,f.file);
  check(fs.existsSync(p), `${f.group} fixture exists`);
  if(!fs.existsSync(p)) continue;
  const rows=parseCsv(fs.readFileSync(p,"utf8"));
  check(rows.length===101, `${f.group} fixture has exactly 100 data rows`);
  const headers=rows[0];
  check(JSON.stringify(headers)===JSON.stringify(f.headers), `${f.group} canonical headers`);
  const ids=new Set();
  for(let i=1;i<rows.length;i++){
    const r=Object.fromEntries(headers.map((h,j)=>[h,rows[i][j]??""]));
    check(r.id.startsWith(`V11_7_11_${f.group}_`), `${f.group} fixture ID namespace` + ` row ${i}`);
    check(!ids.has(r.id), `${f.group} no duplicate ID row ${i}`);
    ids.add(r.id); allIds.add(r.id);
    check(Boolean(r.domain&&r.subdomain&&r.indicator&&r.text), `${f.group} mapped content row ${i}`);
    check(Number(r.weight)>0, `${f.group} positive weight row ${i}`);
    if(f.group==="DISC") { check(r.answerType==="SINGLE_CHOICE_4" && r.options.split("||").length===4 && r.scoringKey.split(",").length===4, `DISC contract row ${i}`); }
    if(f.group==="RIASEC") { check(r.answerType==="LIKERT_5" && r.scale.split(",").length===5 && r.scoringKey.split(",").length===5, `RIASEC contract row ${i}`); }
    if(f.group==="COGNITIVE"||f.group==="EQ") { check(r.answerType==="SINGLE_CHOICE_4" && r.options.split("||").length===4 && /^[1-4]$/.test(r.correctOption) && r.scoringKey==="1", `${f.group} objective contract row ${i}`); }
  }
  check(ids.size===100, `${f.group} IDs unique`);
}
check(allIds.size===400, "all four fixtures have 400 unique logical IDs");
check(!fs.existsSync("prisma/migrations/20260906100000_v11_7_11_four_group_fixtures"), "no V11.7.11 Prisma migration");
if(failures){ console.error(`V11.7.11 STATIC GATE: FAIL (${failures} failure${failures===1?"":"s"})`); process.exit(1); }
console.log("V11.7.11 STATIC GATE: PASS");
