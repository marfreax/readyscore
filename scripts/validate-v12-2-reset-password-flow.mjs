import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const required = [
  "lib/auth/password-reset.ts",
  "app/api/auth/reset-password/route.ts",
  "app/reset-password/page.tsx",
  "lib/auth/password-recovery.ts",
  "prisma/schema.prisma",
];
for (const file of required) if (!fs.existsSync(path.join(root, file))) throw new Error(`FAIL: missing ${file}`);
const reset = fs.readFileSync(path.join(root, "lib/auth/password-reset.ts"), "utf8");
const route = fs.readFileSync(path.join(root, "app/api/auth/reset-password/route.ts"), "utf8");
const page = fs.readFileSync(path.join(root, "app/reset-password/page.tsx"), "utf8");
const recovery = fs.readFileSync(path.join(root, "lib/auth/password-recovery.ts"), "utf8");
const schema = fs.readFileSync(path.join(root, "prisma/schema.prisma"), "utf8");
const checks = [
  ["reset service present", reset.includes("export async function resetPassword")],
  ["token hash lookup", reset.includes("where: { tokenHash }")],
  ["used token rejection", reset.includes("reset.usedAt")],
  ["expiry rejection", reset.includes("reset.expiresAt <= now")],
  ["active account protection", reset.includes('reset.user.status !== "ACTIVE"')],
  ["password policy", reset.includes("PASSWORD_TOO_SHORT")],
  ["confirmation validation", reset.includes("PASSWORD_CONFIRMATION_MISMATCH")],
  ["atomic transaction", reset.includes("prisma.$transaction")],
  ["single-use compare-and-consume", reset.includes("updateMany") && reset.includes("usedAt: null")],
  ["password mutation", reset.includes("passwordHash: newPasswordHash")],
  ["invalidate other pending tokens", reset.includes("tx.passwordResetToken.deleteMany")],
  ["local auth store synchronization", reset.includes("upsertUserRecord")],
  ["no auto-login", !route.includes("startSession") && !reset.includes("startSession")],
  ["reset API route", route.includes('export async function POST') && route.includes('resetPassword')],
  ["invalid token response", route.includes("PASSWORD_RESET_INVALID_MESSAGE")],
  ["reset UI", page.includes("Buat password baru") && page.includes("Reset Password")],
  ["token from URL", page.includes('get("token")')],
  ["new password autocomplete", page.includes('autoComplete="new-password"')],
  ["foundation token model retained", schema.includes("model PasswordResetToken")],
  ["foundation reset link", recovery.includes("/reset-password?token=")],
  ["no V12.2 migration", !fs.existsSync(path.join(root, "prisma/migrations/20260906122000_v12_2_reset_password_flow"))],
];
for (const [name, ok] of checks) if (!ok) throw new Error(`FAIL: ${name}`);
console.log("V12.2 RESET PASSWORD FLOW STATIC GATE: PASS");
console.log(`Checks: ${checks.length}/${checks.length}`);
