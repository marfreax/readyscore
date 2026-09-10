#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const report = JSON.parse(fs.readFileSync(path.join(root,'V13_6/reports/V13_6_MAPPING_CONTENT_REVIEW_REPORT.json'),'utf8'));
const required = [
  'V13_6/mapping/RIASEC_MAPPING_REVIEW.json',
  'V13_6/mapping/DISC_MAPPING_REVIEW.json',
  'V13_6/mapping/EQ_MAPPING_REVIEW.json',
  'V13_6/mapping/COGNITIVE_MAPPING_REVIEW.json',
  'V13_6/review/RIASEC_CONTENT_REVIEW.json',
  'V13_6/review/DISC_CONTENT_REVIEW.json',
  'V13_6/review/EQ_CONTENT_REVIEW.json',
  'V13_6/review/COGNITIVE_CONTENT_REVIEW.json'
];
console.log('========================================');
console.log('V13.6 — MAPPING & CONTENT REVIEW');
console.log('========================================');
for (const f of required) console.log(`${f.padEnd(55)}: ${fs.existsSync(path.join(root,f)) ? 'PASS' : 'FAIL'}`);
for (const [k,v] of Object.entries(report.acceptanceStatus)) console.log(`${k.padEnd(55)}: ${v}`);
console.log('');
console.log('Blocking findings:');
for (const [a, findings] of Object.entries(report.blockingFindings)) {
  for (const finding of findings) console.log(`- ${a}: ${finding}`);
}
console.log('');
console.log('V13.6 MAPPING & CONTENT REVIEW GATE: FAIL');
console.log('Reason: upstream V13.5 content blockers and incomplete real lifecycle/review evidence.');
process.exit(1);
