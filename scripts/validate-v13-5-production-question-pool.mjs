#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";

const root = process.cwd();
const phase = path.join(root, "V13_5");
const fail = [];
const ok = (name, condition, detail="") => {
  if (!condition) fail.push(`${name}${detail ? `: ${detail}` : ""}`);
  console.log(`${name.padEnd(30)} : ${condition ? "PASS" : "FAIL"}${detail ? ` (${detail})` : ""}`);
};
const readCsv = (file) => {
  const text=fs.readFileSync(file,"utf8").trim();
  const lines=text.split(/\r?\n/);
  const headers=lines.shift().split(",");
  return lines.map(line=>{
    const vals=[]; let cur="",q=false;
    for(let i=0;i<line.length;i++){const c=line[i],n=line[i+1];if(c==='"'&&q&&n==='"'){cur+='"';i++;continue}if(c==='"'){q=!q;continue}if(c===","&&!q){vals.push(cur);cur="";continue}cur+=c}
    vals.push(cur); return Object.fromEntries(headers.map((h,i)=>[h,vals[i]??""]));
  });
};
const specs = {
 RIASEC:{p:"RIASEC_PRODUCTION_60.csv",r:"RIASEC_RESERVE_12.csv",pt:60,rt:12,key:"domain",comp:{R:10,I:10,A:10,S:10,E:10,C:10}},
 DISC:{p:"DISC_PRODUCTION_80.csv",r:"DISC_RESERVE_16.csv",pt:80,rt:16,key:"subdomain",comp:{TARGET_D:20,TARGET_I:20,TARGET_S:20,TARGET_C:20}},
 EQ:{p:"EQ_PRODUCTION_AVAILABLE_29.csv",r:null,pt:50,rt:10,key:"domain",comp:{EMOTION_AWARENESS:13,EMOTION_REGULATION:13,EMPATHY_SOCIAL_AWARENESS:12,RELATIONSHIP_SOCIAL_RESPONSE:12}},
 COGNITIVE:{p:"COGNITIVE_PRODUCTION_AVAILABLE_33.csv",r:"COGNITIVE_RESERVE_AVAILABLE_3.csv",pt:40,rt:8,key:"domain",comp:{VERBAL_REASONING:10,NUMERICAL_REASONING:10,LOGICAL_REASONING:10,ABSTRACT_REASONING:10}}
};
console.log("========================================");
console.log("V13.5 — PRODUCTION QUESTION POOL");
console.log("========================================");
for(const [name,s] of Object.entries(specs)){
 const p=readCsv(path.join(phase,"production",s.p)), r=s.r ? readCsv(path.join(phase,"reserve",s.r)) : [];
 const all=[...p,...r];
 const ids=all.map(x=>x.id), texts=all.map(x=>x.text.toLowerCase().replace(/\W+/g," ").trim());
 ok(`${name} required fields`,all.every(x=>x.id&&x.domain&&x.text&&x.type&&x.answerType&&x.weight&&x.difficulty));
 ok(`${name} unique IDs`,new Set(ids).size===ids.length);
 ok(`${name} duplicate text`,new Set(texts).size===texts.length);
 ok(`${name} production count`,p.length===s.pt,`actual ${p.length}, target ${s.pt}`);
 ok(`${name} reserve count`,r.length>=s.rt,`actual ${r.length}, minimum ${s.rt}`);
 const pc=Object.fromEntries(Object.keys(s.comp).map(k=>[k,p.filter(x=>x[s.key]===k).length]));
 for(const [k,n] of Object.entries(s.comp)) ok(`${name} composition ${k}`,pc[k]>=n,`actual ${pc[k]}, required ${n}`);
 ok(`${name} all DRAFT-oriented`,all.every(x=>x.status==="DRAFT"||!x.status));
 if(name==="DISC") ok(`${name} forced-choice structure`,all.every(x=>x.options?.length>0 && x.correctOption===""),"CSV contract has no correct option");
 if(name==="EQ"||name==="COGNITIVE") ok(`${name} objective structure`,all.every(x=>x.options?.split("||").length===4 && /^[1-4]$/.test(x.correctOption)));
 if(name==="RIASEC") ok(`${name} Likert structure`,all.every(x=>x.scale==="1,2,3,4,5" && x.scoringKey==="1,2,3,4,5"));
}
const cogP=readCsv(path.join(phase,"production","COGNITIVE_PRODUCTION_AVAILABLE_33.csv"));
const cogR=readCsv(path.join(phase,"reserve","COGNITIVE_RESERVE_AVAILABLE_3.csv"));
ok("COGNITIVE source completeness",cogP.length===40&&cogR.length>=8,"supplied source set lacks six required abstract-reasoning items");
const eqP=readCsv(path.join(phase,"production","EQ_PRODUCTION_AVAILABLE_29.csv"));
ok("EQ source completeness",eqP.length===50,"supplied source set contains only 29 unique eligible EQ items; required target is 50 plus reserve");
ok("EQ import scoring contract",eqP.every(x=>x.scoringKey==="1" && /^[1-4]$/.test(x.correctOption)),"available V2 EQ source uses 4-value scoringKey and no correctOption; current importer requires 1-value scoringKey + correctOption");
const legacyPath=path.join(root,"data","question-bank.json");
if(fs.existsSync(legacyPath)){
 const legacy=fs.readFileSync(legacyPath,"utf8");
 ok("Legacy boundary",!legacy.includes("V13_5"),"legacy bank is not referenced by pool artifacts");
}
console.log("");
if(fail.length){
 console.log("V13.5 PRODUCTION QUESTION POOL GATE: FAIL");
 console.log("Blocking findings:");
 fail.forEach(x=>console.log(`- ${x}`));
 process.exitCode=1;
}else{
 console.log("V13.5 PRODUCTION QUESTION POOL GATE: PASS");
}
