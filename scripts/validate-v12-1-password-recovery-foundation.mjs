import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const required = [
  "lib/auth/password-recovery.ts",
  "lib/auth/password-recovery-email.ts",
  "app/api/auth/forgot-password/route.ts",
  "app/forgot-password/page.tsx",
  "prisma/schema.prisma",
];
for (const file of required) if (!fs.existsSync(path.join(root, file))) throw new Error(`FAIL: missing ${file}`);
const schema = fs.readFileSync(path.join(root, "prisma/schema.prisma"), "utf8");
const recovery = fs.readFileSync(path.join(root, "lib/auth/password-recovery.ts"), "utf8");
const email = fs.readFileSync(path.join(root, "lib/auth/password-recovery-email.ts"), "utf8");
const route = fs.readFileSync(path.join(root, "app/api/auth/forgot-password/route.ts"), "utf8");
const page = fs.readFileSync(path.join(root, "app/forgot-password/page.tsx"), "utf8");
const checks = [
  ["PasswordResetToken model", schema.includes("model PasswordResetToken")],
  ["tokenHash unique", schema.includes("tokenHash String   @unique")],
  ["expiry persisted", schema.includes("expiresAt DateTime")],
  ["single-use state", schema.includes("usedAt    DateTime?")],
  ["crypto random token", recovery.includes("randomBytes(32)")],
  ["token hashing", recovery.includes("createHash(\"sha256\")")],
  ["generic response", recovery.includes("PASSWORD_RESET_GENERIC_MESSAGE") && route.includes("PASSWORD_RESET_GENERIC_MESSAGE")],
  ["no token response", !route.includes("rawToken") && !route.includes("tokenHash")],
  ["reset link boundary", recovery.includes("/reset-password?token=")],
  ["email abstraction", email.includes("sendPasswordResetEmail")],
  ["production provider guard", email.includes("PASSWORD_RESET_EMAIL_NOT_CONFIGURED")],
  ["forgot password UI", page.includes("Kirim Link Reset Password")],
  ["login recovery link", fs.readFileSync(path.join(root, "app/login/page.tsx"), "utf8").includes("/forgot-password")],
  ["V12.1 migration present", fs.existsSync(path.join(root, "prisma/migrations/20260906122000_v12_1_password_recovery_foundation/migration.sql"))],
];
for (const [name, ok] of checks) if (!ok) throw new Error(`FAIL: ${name}`);
console.log("V12.1 PASSWORD RECOVERY FOUNDATION STATIC GATE: PASS");
console.log(`Checks: ${checks.length}/${checks.length}`);
