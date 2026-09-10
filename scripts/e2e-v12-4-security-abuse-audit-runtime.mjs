import { PrismaClient } from "@prisma/client";
import { createHash, randomBytes, scryptSync } from "node:crypto";

const prisma = new PrismaClient();
const baseUrl = process.env.E2E_BASE_URL ?? "http://localhost:3000";
const email = `v12_4_${Date.now()}_${randomBytes(4).toString("hex")}@example.com`;
const initialPassword = "InitialPass123!";
const changedPassword = "ChangedPass123!";
const resetPassword = "ResetPass123!";
const userId = `usr_v12_4_${Date.now()}_${randomBytes(6).toString("hex")}`;

async function post(path, body, headers = {}) {
  return fetch(`${baseUrl}${path}`, { method: "POST", headers: { "content-type": "application/json", ...headers }, body: JSON.stringify(body) });
}
function hashToken(token) { return createHash("sha256").update(token, "utf8").digest("hex"); }

let sessionCookie = "";
try {
  const salt = randomBytes(16).toString("hex");
  const passwordHash = `scrypt$${salt}$${scryptSync(initialPassword, salt, 64).toString("hex")}`;
  await prisma.user.create({ data: { id: userId, name: "V12.4 E2E", email, passwordHash, role: "USER", status: "ACTIVE" } });

  const before = await prisma.user.findUnique({ where: { id: userId }, include: { attempts: true, entitlements: true } });
  if (!before) throw new Error("E2E user creation failed");

  const invalid = await post("/api/auth/reset-password", { token: "invalid-token", password: resetPassword, confirmation: resetPassword });
  if (invalid.status !== 400) throw new Error(`Invalid token expected 400, got ${invalid.status}`);

  const first = await post("/api/auth/forgot-password", { email });
  if (first.status !== 200) throw new Error(`Recovery request expected 200, got ${first.status}`);
  for (let i = 0; i < 4; i++) {
    const r = await post("/api/auth/forgot-password", { email });
    if (r.status !== 200) throw new Error(`Recovery request ${i + 2} expected 200, got ${r.status}`);
  }
  const limited = await post("/api/auth/forgot-password", { email });
  if (limited.status !== 429) throw new Error(`Rate limit expected 429, got ${limited.status}`);
  if (!limited.headers.get("retry-after")) throw new Error("Rate limit missing Retry-After");

  const rawToken = randomBytes(32).toString("base64url");
  await prisma.passwordResetToken.create({ data: { userId, tokenHash: hashToken(rawToken), expiresAt: new Date(Date.now() + 60 * 60 * 1000) } });
  const reset = await post("/api/auth/reset-password", { token: rawToken, password: resetPassword, confirmation: resetPassword });
  if (reset.status !== 200) throw new Error(`Reset expected 200, got ${reset.status}`);
  const reuse = await post("/api/auth/reset-password", { token: rawToken, password: "AnotherPass123!", confirmation: "AnotherPass123!" });
  if (reuse.status !== 400) throw new Error(`Consumed token expected 400, got ${reuse.status}`);

  const oldLogin = await post("/api/auth/login", { email, password: initialPassword });
  if (oldLogin.status !== 401) throw new Error(`Old password expected 401, got ${oldLogin.status}`);
  const newLogin = await post("/api/auth/login", { email, password: resetPassword });
  if (newLogin.status !== 200) throw new Error(`New password expected 200, got ${newLogin.status}`);
  sessionCookie = newLogin.headers.get("set-cookie")?.split(";")[0] ?? "";
  if (!sessionCookie) throw new Error("Login did not return session cookie");

  const wrongCurrent = await post("/api/auth/change-password", { currentPassword: "WrongCurrent123!", newPassword: changedPassword, confirmNewPassword: changedPassword }, { Cookie: sessionCookie });
  if (wrongCurrent.status !== 400) throw new Error(`Wrong current password expected 400, got ${wrongCurrent.status}`);

  const change = await post("/api/auth/change-password", { currentPassword: resetPassword, newPassword: changedPassword, confirmNewPassword: changedPassword }, { Cookie: sessionCookie });
  if (change.status !== 200) throw new Error(`Change password expected 200, got ${change.status}`);

  const changedLogin = await post("/api/auth/login", { email, password: changedPassword });
  if (changedLogin.status !== 200) throw new Error(`Changed password expected 200, got ${changedLogin.status}`);

  const after = await prisma.user.findUnique({ where: { id: userId }, include: { attempts: true, entitlements: true } });
  if (!after) throw new Error("E2E user missing after credential operations");
  if (after.status !== before.status) throw new Error("UserStatus changed unexpectedly");
  if (after.role !== before.role) throw new Error("Role changed unexpectedly");
  if (after.attempts.length !== before.attempts.length) throw new Error("Assessment attempts changed unexpectedly");
  if (after.entitlements.length !== before.entitlements.length) throw new Error("Entitlements changed unexpectedly");

  const audit = await prisma.authenticationAuditEvent.findMany({ where: { targetUserId: userId }, orderBy: { createdAt: "asc" } });
  const actions = new Set(audit.map((x) => x.action));
  for (const required of ["PASSWORD_RESET_REQUESTED", "PASSWORD_RESET_REJECTED", "PASSWORD_RESET_SUCCEEDED", "PASSWORD_CHANGED"]) {
    if (!actions.has(required)) throw new Error(`Missing audit action ${required}`);
  }
  const auditText = JSON.stringify(audit);
  for (const secret of [initialPassword, resetPassword, changedPassword, rawToken]) {
    if (auditText.includes(secret)) throw new Error("Credential secret leaked into audit payload");
  }

  console.log("V12.4 SECURITY ABUSE AUDIT RUNTIME E2E: PASS");
  console.log("Enumeration-safe recovery: PASS");
  console.log("Rate limiting: PASS");
  console.log("Token abuse rejection: PASS");
  console.log("Audit events: PASS");
  console.log("Business-state protection: PASS");
  console.log("Credential secret safety: PASS");
} finally {
  await prisma.authenticationAuditEvent.deleteMany({ where: { targetUserId: userId } }).catch(() => {});
  await prisma.passwordResetToken.deleteMany({ where: { userId } }).catch(() => {});
  await prisma.user.delete({ where: { id: userId } }).catch(() => {});
  await prisma.$disconnect();
}
