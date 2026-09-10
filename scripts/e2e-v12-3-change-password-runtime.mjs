import fs from "node:fs";
import path from "node:path";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const base = process.env.E2E_BASE_URL ?? "http://localhost:3000";
const authFile = path.join(process.cwd(), "data", "auth-state.json");
const original = fs.readFileSync(authFile, "utf8");
const email = `v12_3_${Date.now()}_${randomBytes(4).toString("hex")}@example.test`;
const oldPassword = "OldPassword123!";
const newPassword = "NewPassword456!";
const userId = `v12_3_${randomBytes(12).toString("hex")}`;

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  return `scrypt$${salt}$${scryptSync(password, salt, 64).toString("hex")}`;
}

function verifyPassword(password, encoded) {
  const [scheme, salt, expected] = encoded.split("$");
  if (scheme !== "scrypt" || !salt || !expected) return false;
  const actual = scryptSync(password, salt, 64);
  const exp = Buffer.from(expected, "hex");
  return actual.length === exp.length && timingSafeEqual(actual, exp);
}

async function post(pathname, body, cookie = "") {
  return fetch(`${base}${pathname}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(cookie ? { Cookie: cookie } : {}) },
    body: JSON.stringify(body),
    redirect: "manual",
  });
}

try {
  await prisma.user.create({
    data: { id: userId, name: "V12.3 Runtime User", email, passwordHash: hashPassword(oldPassword), role: "USER", status: "ACTIVE" },
  });

  const state = JSON.parse(original);
  const now = new Date().toISOString();
  state.users.push({ id: userId, name: "V12.3 Runtime User", email, passwordHash: hashPassword(oldPassword), role: "USER", status: "ACTIVE", createdAt: now, updatedAt: now });
  fs.writeFileSync(authFile, JSON.stringify(state, null, 2));

  const unauth = await post("/api/auth/change-password", { currentPassword: oldPassword, newPassword, confirmNewPassword: newPassword });
  if (unauth.status !== 401) throw new Error(`Unauthenticated request expected 401, got ${unauth.status}`);

  const login = await post("/api/auth/login", { email, password: oldPassword });
  if (!login.ok) throw new Error(`Initial login failed: ${login.status}`);
  const cookie = login.headers.get("set-cookie")?.split(";")[0];
  if (!cookie) throw new Error("Session cookie missing");

  const wrongCurrent = await post("/api/auth/change-password", { currentPassword: "WrongPassword123!", newPassword, confirmNewPassword: newPassword }, cookie);
  if (wrongCurrent.status !== 400) throw new Error(`Wrong current password expected 400, got ${wrongCurrent.status}`);

  const mismatch = await post("/api/auth/change-password", { currentPassword: oldPassword, newPassword, confirmNewPassword: "DifferentPassword789!" }, cookie);
  if (mismatch.status !== 400) throw new Error(`Confirmation mismatch expected 400, got ${mismatch.status}`);

  const change = await post("/api/auth/change-password", { currentPassword: oldPassword, newPassword, confirmNewPassword: newPassword }, cookie);
  if (!change.ok) throw new Error(`Change password failed: ${change.status} ${await change.text()}`);

  const oldLogin = await post("/api/auth/login", { email, password: oldPassword });
  if (oldLogin.status !== 401) throw new Error(`Old password should be rejected, got ${oldLogin.status}`);
  const newLogin = await post("/api/auth/login", { email, password: newPassword });
  if (!newLogin.ok) throw new Error(`New password should be accepted, got ${newLogin.status}`);

  const after = await prisma.user.findUnique({ where: { id: userId }, select: { passwordHash: true, role: true, status: true } });
  if (!after || !after.passwordHash || after.role !== "USER" || after.status !== "ACTIVE") throw new Error("Credential change altered protected account state");
  if (!verifyPassword(newPassword, after.passwordHash)) throw new Error("DB does not contain the new password hash");
  if (verifyPassword(oldPassword, after.passwordHash)) throw new Error("DB still accepts the old password hash");

  console.log("V12.3 CHANGE PASSWORD RUNTIME E2E: PASS");
} finally {
  await prisma.user.deleteMany({ where: { id: userId } }).catch(() => {});
  fs.writeFileSync(authFile, original);
  await prisma.$disconnect();
}
