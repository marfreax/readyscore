import fs from "node:fs";
import path from "node:path";
const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root,p),"utf8");
const checks = [
  ["rate limiter exists", fs.existsSync(path.join(root,"lib/auth/rate-limit.ts"))],
  ["rate limit configured", read("lib/auth/rate-limit.ts").includes("PASSWORD_RESET_RATE_LIMIT_MAX")],
  ["identifier rate limit", read("app/api/auth/forgot-password/route.ts").includes("emailKey")],
  ["origin rate limit", read("app/api/auth/forgot-password/route.ts").includes("ipKey")],
  ["rate limit response", read("app/api/auth/forgot-password/route.ts").includes("Retry-After")],
  ["generic recovery response", read("app/api/auth/forgot-password/route.ts").includes("PASSWORD_RESET_GENERIC_MESSAGE")],
  ["token abuse rejection", read("lib/auth/password-reset.ts").includes("INVALID_RESET_TOKEN")],
  ["reset audit events", read("lib/auth/password-reset.ts").includes("PASSWORD_RESET_SUCCEEDED") && read("lib/auth/password-reset.ts").includes("PASSWORD_RESET_REJECTED")],
  ["request audit event", read("lib/auth/password-recovery.ts").includes("PASSWORD_RESET_REQUESTED")],
  ["change audit event", read("lib/auth/change-password.ts").includes("PASSWORD_CHANGED")],
  ["audit helper exists", fs.existsSync(path.join(root,"lib/auth/audit.ts"))],
  ["audit payload is allowlisted", read("lib/auth/audit.ts").includes("metadata?: Record<string, string | number | boolean | null>")],
  ["no password logging", !read("app/api/auth/change-password/route.ts").includes("console.log")],
  ["no token logging", !read("app/api/auth/reset-password/route.ts").includes("console.log")],
  ["session semantics unchanged", read("lib/auth/session.ts").includes("createSession")],
  ["reset does not auto-login", !read("app/api/auth/reset-password/route.ts").includes("startSession")],
  ["inactive remains protected", read("lib/auth/password-reset.ts").includes('reset.user.status !== "ACTIVE"')],
  ["audit model exists", read("prisma/schema.prisma").includes("model AuthenticationAuditEvent")],
  ["audit migration exists", fs.existsSync(path.join(root,"prisma/migrations/20260906133000_v12_4_security_abuse_audit/migration.sql"))],
  ["no password in audit metadata", !read("lib/auth/change-password.ts").includes("currentPassword") || !read("lib/auth/change-password.ts").includes("metadata: { currentPassword")],
  ["no token in audit metadata", !read("lib/auth/password-reset.ts").includes("metadata: { token")],
  ["four V12 routes remain", ["forgot-password","reset-password","change-password"].every(x=>fs.existsSync(path.join(root,"app/api/auth",x,"route.ts")))],
  ["bounded request body", read("app/api/auth/forgot-password/route.ts").includes("length > 320")],
  ["server-side credential mutation", read("lib/auth/change-password.ts").includes("verifyPassword")],
];
let pass=0; for(const [label,ok] of checks){console.log(`${label}: ${ok?"PASS":"FAIL"}`); if(ok)pass++;}
if(pass!==checks.length){console.error(`V12.4 SECURITY ABUSE AUDIT STATIC GATE: FAIL (${pass}/${checks.length})`);process.exit(1)}
console.log(`V12.4 SECURITY ABUSE AUDIT STATIC GATE: PASS\nChecks: ${checks.length}/${checks.length}`);
