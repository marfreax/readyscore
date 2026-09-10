import { createHash, randomBytes, scryptSync } from "node:crypto";
import { PrismaClient } from "@prisma/client";

const base = process.env.BASE_URL || "http://localhost:3000";
const prisma = new PrismaClient();
const runToken = `${Date.now()}_${process.pid}`;
const email = `v12_2_e2e_${runToken}@example.test`;
const userId = `v12_2_e2e_${runToken}`;
const oldPassword = "OldPassword123!";
const newPassword = "NewPassword456!";
const rawToken = randomBytes(32).toString("base64url");
const tokenHash = createHash("sha256").update(rawToken, "utf8").digest("hex");

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  return `scrypt$${salt}$${scryptSync(password, salt, 64).toString("hex")}`;
}
function assert(condition, message) { if (!condition) throw new Error(`FAIL — ${message}`); }
function json(text) { try { return JSON.parse(text); } catch { return null; } }
async function request(pathname, options = {}) { return fetch(`${base}${pathname}`, { redirect: "manual", ...options }); }

try {
  await prisma.user.create({
    data: { id: userId, name: "V12.2 E2E", email, passwordHash: hashPassword(oldPassword), role: "USER", status: "ACTIVE" },
  });
  await prisma.passwordResetToken.create({
    data: { userId, tokenHash, expiresAt: new Date(Date.now() + 60 * 60 * 1000) },
  });

  console.log("=== READY SCORE V12.2 RESET PASSWORD RUNTIME E2E ===");
  console.log(`Base URL: ${base}`);

  const reset = await request("/api/auth/reset-password", {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({ token: rawToken, password: newPassword, confirmation: newPassword }),
  });
  const resetBody = json(await reset.text());
  assert(reset.ok && resetBody?.ok, `reset request failed: ${reset.status}`);
  assert(resetBody?.message === "Password berhasil diubah. Silakan login kembali.", "reset success message mismatch");
  console.log("PASS — valid token resets password");

  const oldLogin = await request("/api/auth/login", {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password: oldPassword }),
  });
  assert(oldLogin.status === 401, `old password unexpectedly accepted: ${oldLogin.status}`);
  console.log("PASS — old password rejected");

  const newLogin = await request("/api/auth/login", {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password: newPassword }),
  });
  assert(newLogin.ok, `new password login failed: ${newLogin.status}`);
  console.log("PASS — new password accepted");

  const reused = await request("/api/auth/reset-password", {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ token: rawToken, password: "AnotherPassword789!", confirmation: "AnotherPassword789!" }),
  });
  const reusedBody = json(await reused.text());
  assert(reused.status === 400 && reusedBody?.error?.code === "INVALID_RESET_TOKEN", `consumed token accepted: ${reused.status}`);
  console.log("PASS — consumed token rejected");

  const dbUser = await prisma.user.findUnique({ where: { id: userId }, select: { status: true, role: true, passwordHash: true } });
  assert(dbUser?.status === "ACTIVE", "UserStatus changed during reset");
  assert(dbUser?.role === "USER", "role changed during reset");
  assert(dbUser?.passwordHash, "password hash missing after reset");
  console.log("PASS — business state unchanged");

  console.log("V12.2 RESET PASSWORD RUNTIME E2E: PASS");
} finally {
  await prisma.passwordResetToken.deleteMany({ where: { userId } });
  await prisma.user.deleteMany({ where: { id: userId } });
  await prisma.$disconnect();
}
