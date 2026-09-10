import fs from "node:fs";
const read=f=>fs.readFileSync(f,'utf8');
const repo=read('lib/admin-review-repository.ts'); const api=read('app/api/admin/review/route.ts'); const ui=read('components/admin/AdminReviewContentOperations.tsx');
const checks=[
 ['canonical review action union',repo.includes('GovernedReviewAction')],
 ['mapping approval is explicit',repo.includes('APPROVE_MAPPING')],
 ['publish requires approved mapping',repo.includes('MAPPING_NOT_APPROVED')],
 ['publish requires approval',repo.includes('QUESTION_NOT_APPROVED')],
 ['duplicate validation',repo.includes('DUPLICATE_CONTENT')],
 ['archive protects published content',repo.includes('ACTIVE_CONTENT_REQUIRES_REPLACEMENT')],
 ['high-impact server confirmation',repo.includes('HIGH_IMPACT_CONFIRMATION_REQUIRED')],
 ['impact preview',repo.includes('getReviewImpactPreview')&&api.includes('impactAction')],
 ['UI confirmation',ui.includes('window.confirm')],
 ['audit trail',repo.includes('auditContentOperation')],
 ['admin authorization',repo.includes('UserRole.ADMIN')],
 ['historical impact none',repo.includes('historicalImpact: "NONE"')]
];
for(const [label,ok] of checks){if(!ok) throw new Error(`FAIL: ${label}`); console.log(`PASS: ${label}`);}
console.log('V11.3 Review & Publishing Governance runtime smoke: PASS');
