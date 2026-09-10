import fs from "node:fs";
import path from "node:path";
const root=process.cwd();
const read=(p)=>fs.readFileSync(path.join(root,p),"utf8");
const checks=[
 ["schema user status",()=>/enum UserStatus[\s\S]*ACTIVE[\s\S]*INACTIVE/.test(read("prisma/schema.prisma"))&&/status\s+UserStatus/.test(read("prisma/schema.prisma"))],
 ["additive migration",()=>fs.existsSync(path.join(root,"prisma/migrations/20260905100000_v11_5_users_access_operations/migration.sql"))],
 ["users repository",()=>fs.existsSync(path.join(root,"lib/admin-users-repository.ts"))],
 ["users API",()=>/requireAdminApi/.test(read("app/api/admin/users/route.ts"))&&/POST/.test(read("app/api/admin/users/route.ts"))],
 ["persistent status semantics",()=>/ACTIVE/.test(read("lib/admin-users-repository.ts"))&&/INACTIVE/.test(read("lib/admin-users-repository.ts"))],
 ["role operations",()=>/SET_ROLE/.test(read("lib/admin-users-repository.ts"))],
 ["server confirmation",()=>/CONFIRMATION_REQUIRED/.test(read("lib/admin-users-repository.ts"))],
 ["admin authorization",()=>/requireAdminApi/.test(read("app/api/admin/users/route.ts"))&&/actorRole/.test(read("lib/admin-users-repository.ts"))],
 ["audit trail",()=>/adminContentAuditEvent\.create/.test(read("lib/admin-users-repository.ts"))&&/entityType:\s*"USER"/.test(read("lib/admin-users-repository.ts"))],
 ["self protection",()=>/CANNOT_DEACTIVATE_SELF/.test(read("lib/admin-users-repository.ts"))],
 ["last admin protection",()=>/LAST_ACTIVE_ADMIN_PROTECTED/.test(read("lib/admin-users-repository.ts"))],
 ["historical preservation",()=>/historicalImpact:\s*"NONE"/.test(read("lib/admin-users-repository.ts"))&&!/deleteMany\(/.test(read("lib/admin-users-repository.ts"))],
 ["login inactive protection",()=>/ACCOUNT_INACTIVE/.test(read("lib/auth/service.ts"))&&/ACCOUNT_INACTIVE/.test(read("lib/auth/store.ts"))],
 ["spec V11.5",()=>fs.existsSync(path.join(root,"architecture/phase-11.5/ReadyScore_V11_5_Users_Access_Operations.md"))],
];
for(const [name,fn] of checks){if(!fn()){console.error(`FAIL: ${name}`);process.exit(1)}console.log(`PASS: ${name}`)}
console.log("V11.5 USERS & ACCESS OPERATIONS GATE: PASS");
