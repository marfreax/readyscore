import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const required = [
  'V11_7_15_ARCHITECTURE.md',
  'V11_7_15_DELIVERY_NOTES.md',
  'V11_7_15_MANIFEST.md',
  'package.json',
  'tsconfig.json',
  'prisma/schema.prisma',
];

function assertFile(rel, label) {
  if (!fs.existsSync(path.join(root, rel))) throw new Error(`FAIL: ${label}`);
  console.log(`PASS: ${label}`);
}

for (const rel of required) assertFile(rel, `${rel} present`);

const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
if (pkg.scripts?.build !== 'next build') throw new Error('FAIL: canonical production build script must remain next build');
console.log('PASS: canonical production build package script');
if (pkg.scripts?.typecheck !== 'prisma generate && tsc --noEmit') throw new Error('FAIL: canonical typecheck script changed');
console.log('PASS: canonical typecheck package script preserved');
if (pkg.scripts?.['v11:7:15:gate'] !== 'node scripts/validate-v11-7-15-production-build.mjs') throw new Error('FAIL: V11.7.15 gate package script');
console.log('PASS: V11.7.15 gate package script');

const nextConfigCandidates = ['next.config.ts', 'next.config.js', 'next.config.mjs'];
const presentNextConfigs = nextConfigCandidates.filter((rel) => fs.existsSync(path.join(root, rel)));
if (presentNextConfigs.length > 1) throw new Error(`FAIL: multiple Next.js config files present: ${presentNextConfigs.join(', ')}`);
if (presentNextConfigs.length === 1) console.log(`PASS: Next.js configuration baseline present (${presentNextConfigs[0]})`);
else console.log('PASS: Next.js configuration baseline uses framework defaults (no next.config file)');

const tsconfig = JSON.parse(fs.readFileSync(path.join(root, 'tsconfig.json'), 'utf8'));
if (!tsconfig.compilerOptions || tsconfig.compilerOptions.noEmit !== true) throw new Error('FAIL: TypeScript noEmit contract');
console.log('PASS: TypeScript noEmit contract');

const schema = fs.readFileSync(path.join(root, 'prisma/schema.prisma'), 'utf8');
if (!schema.includes('model Question') || !schema.includes('model QuestionVersion')) throw new Error('FAIL: canonical Question/QuestionVersion models missing');
console.log('PASS: canonical Question/QuestionVersion schema present');

const forbidden = fs.readdirSync(path.join(root, 'prisma/migrations'), { withFileTypes: true })
  .filter((e) => e.isDirectory())
  .map((e) => e.name)
  .filter((name) => name.includes('v11_7_15'));
if (forbidden.length) throw new Error(`FAIL: forbidden V11.7.15 Prisma migration: ${forbidden.join(', ')}`);
console.log('PASS: no V11.7.15 Prisma migration');

console.log('V11.7.15 STATIC GATE: PASS');
