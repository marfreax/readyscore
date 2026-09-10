import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
const fail = (message) => { console.error(`FAIL: ${message}`); process.exitCode = 1; };
const pass = (message) => console.log(`PASS: ${message}`);

console.log("=== READY SCORE V11.7.2 SEARCH UI RELIABILITY / DEBOUNCE / STALE RESPONSE GATE ===");

const workspacePath = "components/admin/UnifiedQuestionBankWorkspace.tsx";
const workspace = read(workspacePath);
const pkg = JSON.parse(read("package.json"));

for (const artifact of [workspacePath, "app/admin/question-bank/page.tsx", "app/api/admin/question-bank/route.ts", "lib/question-bank-repository.ts", "prisma/schema.prisma"]) {
  if (fs.existsSync(path.join(root, artifact))) pass(`required artifact: ${artifact}`);
  else fail(`missing artifact: ${artifact}`);
}

if (pkg.scripts?.["v11:7:2:gate"] === "node scripts/validate-v11-7-2-search-ui-reliability.mjs") pass("package script: v11:7:2:gate");
else fail("package script v11:7:2:gate missing or incorrect");

for (const marker of [
  'useEffect, useRef, useState',
  'searchDebounceRef=useRef',
  'requestSequenceRef=useRef',
  'activeControllerRef=useRef',
  'new AbortController()',
  'controller.signal',
  'requestSequence!==requestSequenceRef.current',
  'if(requestSequence===requestSequenceRef.current)',
  'clearTimeout(searchDebounceRef.current)',
  'setTimeout(()=>{',
  '},350)',
  'cancelPendingQuestionBankRequest()',
  'useEffect(()=>()=>{cancelPendingQuestionBankRequest();requestSequenceRef.current+=1},[])',
]) {
  if (workspace.includes(marker)) pass(`reliability contract: ${marker}`);
  else fail(`reliability contract missing: ${marker}`);
}

const searchStart = workspace.indexOf("function setSearchAndReset(value:string)");
const searchEnd = workspace.indexOf("function setStatusAndReset", searchStart);
const searchHandler = searchStart >= 0 && searchEnd > searchStart ? workspace.slice(searchStart, searchEnd) : "";
if (searchHandler.includes('setSearch(value)')) pass("search input updates local state immediately");
else fail("search input state update missing");
if (searchHandler.includes('setTimeout')) pass("search requests are debounced");
else fail("search handler does not debounce requests");
if (!searchHandler.includes('refresh(group,1,pagination.pageSize,value,status)') || searchHandler.includes('setSearch(value);refresh(')) {
  fail("search handler still performs an immediate refresh on every keystroke");
} else pass("no immediate refresh on every keystroke");

if (workspace.includes('fetch(`/api/admin/question-bank?${params.toString()}`,{cache:"no-store",signal:controller.signal})')) pass("search requests carry AbortController signal");
else fail("Question Bank search fetch is not wired to AbortController");

if (workspace.includes('setQuestions(j.questions);setPagination(j.pagination);setStats(j.stats)') && workspace.includes('if(requestSequence!==requestSequenceRef.current)return;setQuestions')) pass("only latest response may update workspace state");
else fail("latest-response guard is incomplete before workspace state updates");

if (workspace.includes('if(controller.signal.aborted||requestSequence!==requestSequenceRef.current)return;setMessage')) pass("stale/aborted errors are ignored");
else fail("stale/aborted error guard missing");

if (workspace.includes('if(requestSequence===requestSequenceRef.current){setLoading(false);')) pass("stale responses cannot clear current loading state");
else fail("loading state lacks latest-request guard");

if (workspace.includes('activeControllerRef.current?.abort();activeControllerRef.current=null')) pass("previous active request is cancelled before a new request");
else fail("previous request cancellation boundary missing");

const migrationDir = path.join(root, "prisma", "migrations");
const migrations = fs.existsSync(migrationDir) ? fs.readdirSync(migrationDir).filter((name) => name.includes("v11_7_2")) : [];
if (migrations.length === 0) pass("no V11.7.2 Prisma migration");
else fail(`unexpected V11.7.2 migration: ${migrations.join(", ")}`);

if (workspace.includes('refresh(group,1,pagination.pageSize,value,status)')) pass("debounced search preserves active group/status and resets to page 1");
else fail("debounced search does not preserve query context");

console.log(process.exitCode ? "V11.7.2 STATIC GATE: FAIL" : "V11.7.2 STATIC GATE: PASS");
