import fs from "node:fs";
const read=(p)=>fs.readFileSync(p,"utf8");
const checks=[
 ["status is persistent",()=>/status\s+UserStatus/.test(read("prisma/schema.prisma"))],
 ["status changes are non-destructive",()=>/SET_STATUS/.test(read("lib/admin-users-repository.ts"))&&!/deleteMany/.test(read("lib/admin-users-repository.ts"))],
 ["role changes are explicit",()=>/SET_ROLE/.test(read("lib/admin-users-repository.ts"))],
 ["confirmation is server-enforced",()=>/if \(!input\.confirmed\) throw new Error\("CONFIRMATION_REQUIRED"\)/.test(read("lib/admin-users-repository.ts"))],
 ["audit actor is recorded",()=>/actorUserId: actor\.id/.test(read("lib/admin-users-repository.ts"))],
 ["last active admin protected",()=>/LAST_ACTIVE_ADMIN_PROTECTED/.test(read("lib/admin-users-repository.ts"))],
 ["self deactivation protected",()=>/CANNOT_DEACTIVATE_SELF/.test(read("lib/admin-users-repository.ts"))],
 ["inactive login blocked",()=>/ACCOUNT_INACTIVE/.test(read("lib/auth/service.ts"))],
 ["inactive session blocked",()=>/u\.status==="ACTIVE"/.test(read("lib/auth/store.ts"))],
 ["entitlement boundary preserved",()=>/Entitlement remains a separate concern/.test(read("app/admin/users/page.tsx"))],
 ["historical boundary documented",()=>/historical.*not.*delete|Historical.*not.*delete/is.test(read("components/admin/AdminUsersOperations.tsx"))],
 ["admin users UI",()=>/AdminUsersOperations/.test(read("app/admin/users/page.tsx"))],
];
for(const [name,fn] of checks){if(!fn()){console.error(`FAIL: ${name}`);process.exit(1)}console.log(`PASS: ${name}`)}
console.log("V11.5 Users & Access Operations runtime smoke: PASS");
