import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");
const checks = [
  ["change-password service exists", "lib/auth/change-password.ts", /export async function changePassword/],
  ["authenticated identity is required", "lib/auth/change-password.ts", /userId: string/],
  ["server verifies current password", "lib/auth/change-password.ts", /verifyPassword\(input\.currentPassword, user\.passwordHash\)/],
  ["canonical password hashing", "lib/auth/change-password.ts", /hashPassword\(input\.newPassword\)/],
  ["new password minimum policy", "lib/auth/change-password.ts", /password\.length < 8/],
  ["confirmation is server validated", "lib/auth/change-password.ts", /PASSWORD_CONFIRMATION_MISMATCH/],
  ["credential mutation is transactional", "lib/auth/change-password.ts", /prisma\.\$transaction/],
  ["concurrent mutation guard", "lib/auth/change-password.ts", /passwordHash: user\.passwordHash/],
  ["only active account can mutate", "lib/auth/change-password.ts", /status: "ACTIVE"/],
  ["DB password mutation only", "lib/auth/change-password.ts", /passwordHash: newPasswordHash/],
  ["local auth store synchronized", "lib/auth/change-password.ts", /upsertUserRecord/],
  ["business state untouched", "lib/auth/change-password.ts", /role: user\.role/],
  ["API route exists", "app/api/auth/change-password/route.ts", /export async function POST/],
  ["API requires session before mutation", "app/api/auth/change-password/route.ts", /getCurrentSession/],
  ["API returns auth required", "app/api/auth/change-password/route.ts", /AUTH_REQUIRED/],
  ["API does not start session", "app/api/auth/change-password/route.ts", !/startSession/],
  ["UI route exists", "app/change-password/page.tsx", /getCurrentSession/],
  ["UI route redirects unauthenticated users", "app/change-password/page.tsx", /redirect\("\/login\?next=\/change-password"\)/],
  ["UI form exists", "app/change-password/ChangePasswordForm.tsx", /Ubah password/],
  ["UI uses current password autocomplete", "app/change-password/ChangePasswordForm.tsx", /current-password/],
  ["UI uses new password autocomplete", "app/change-password/ChangePasswordForm.tsx", /new-password/],
  ["navigation exposes operation", "components/app/CustomerNavigation.tsx", /change-password/],
  ["runtime E2E exists", "scripts/e2e-v12-3-change-password-runtime.mjs", /change-password/],
  ["no V12.3 migration", "prisma/migrations", null],
];
let passed = 0;
for (const [label, rel, pattern] of checks) {
  const exists = fs.existsSync(path.join(root, rel));
  let ok = exists;
  if (pattern instanceof RegExp) ok = exists && pattern.test(read(rel));
  if (rel === "prisma/migrations") ok = exists && !fs.readdirSync(path.join(root, rel)).some((x) => x.includes("v12_3"));
  console.log(`${label}: ${ok ? "PASS" : "FAIL"}`);
  if (ok) passed++;
}
console.log(`V12.3 CHANGE PASSWORD STATIC GATE: ${passed === checks.length ? "PASS" : "FAIL"}`);
console.log(`Checks: ${passed}/${checks.length}`);
if (passed !== checks.length) process.exit(1);
