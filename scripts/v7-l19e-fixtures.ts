import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../lib/auth/store";
import type { SessionRecord, UserRecord } from "../lib/auth/types";
import { startAssessment, saveAnswer, submitAssessment } from "../lib/assessment/runtime-service";
import { grantProductEntitlements, grantSingleTestEntitlements } from "../lib/commercial/entitlement-service";

const prisma = new PrismaClient();
const AUTH_FILE = path.join(process.cwd(), "data", "auth-state.json");

export const QA_FIXTURES = [
  {
    key: "QA-01",
    id: "qa_l19e_01",
    name: "ReadyScore QA-01 Single Test",
    email: "qa01.single@readyscore.local",
    role: "USER",
    scenario: "single-test",
  },
  {
    key: "QA-02",
    id: "qa_l19e_02",
    name: "ReadyScore QA-02 All Tests",
    email: "qa02.all-tests@readyscore.local",
    role: "USER",
    scenario: "all-tests",
  },
  {
    key: "QA-03",
    id: "qa_l19e_03",
    name: "ReadyScore QA-03 Full Access",
    email: "qa03.full-access@readyscore.local",
    role: "USER",
    scenario: "full-access",
  },
  {
    key: "QA-04",
    id: "qa_l19e_04",
    name: "ReadyScore QA-04 Admin",
    email: "qa04.admin@readyscore.local",
    role: "ADMIN",
    scenario: "admin",
  },
] as const;

function generatedPassword() {
  return `RS-L19E-${crypto.randomBytes(18).toString("base64url")}`;
}

type AuthState = { version: 1; users: UserRecord[]; sessions: SessionRecord[] };

function loadAuthState(): AuthState {
  if (!fs.existsSync(AUTH_FILE)) return { version: 1, users: [], sessions: [] };
  return JSON.parse(fs.readFileSync(AUTH_FILE, "utf8"));
}

function saveAuthState(state: AuthState) {
  fs.mkdirSync(path.dirname(AUTH_FILE), { recursive: true });
  fs.writeFileSync(AUTH_FILE, JSON.stringify(state, null, 2));
}

async function resetFixtureData(userId: string) {
  await prisma.assessmentAttempt.deleteMany({ where: { userId } });
  await prisma.userEntitlement.deleteMany({ where: { userId } });
  await prisma.userAddOnEntitlement.deleteMany({ where: { userId } });
  await prisma.reassessmentCredit.deleteMany({ where: { userId } });
  await prisma.session.deleteMany({ where: { userId } });
}

async function upsertFixtureUser(fixture: (typeof QA_FIXTURES)[number], password: string) {
  const auth = loadAuthState();
  auth.users = auth.users.filter((user) => user.id !== fixture.id && user.email !== fixture.email);
  auth.sessions = auth.sessions.filter((session) => session.userId !== fixture.id);

  const now = new Date().toISOString();
  const passwordHash = hashPassword(password);
  auth.users.push({
    id: fixture.id,
    name: fixture.name,
    email: fixture.email,
    passwordHash,
    role: fixture.role,
    status: "ACTIVE",
    createdAt: now,
    updatedAt: now,
  });
  saveAuthState(auth);

  await prisma.user.upsert({
    where: { id: fixture.id },
    create: {
      id: fixture.id,
      name: fixture.name,
      email: fixture.email,
      passwordHash,
      role: fixture.role,
      createdAt: new Date(now),
      updatedAt: new Date(now),
    },
    update: {
      name: fixture.name,
      email: fixture.email,
      passwordHash,
      role: fixture.role,
      updatedAt: new Date(now),
    },
  });
}

async function completeAssessment(userId: string, type: "riasec" | "disc" | "eq" | "cognitive", value = 3) {
  const started = await startAssessment(type, userId);
  for (const question of started.questions) {
    await saveAnswer(started.attempt.id, question.id, value);
  }
  const result = await submitAssessment(started.attempt.id);
  if (!result) throw new Error(`${type} fixture result was not persisted`);
  return started.attempt.id;
}

async function provisionFixture(fixture: (typeof QA_FIXTURES)[number], password: string) {
  await resetFixtureData(fixture.id);
  await upsertFixtureUser(fixture, password);

  const attemptIds: string[] = [];
  if (fixture.key === "QA-01") {
    await grantSingleTestEntitlements({
      userId: fixture.id,
      testType: "EQ",
      source: "QA_L19E_FIXTURE",
    });
    attemptIds.push(await completeAssessment(fixture.id, "eq"));
    await prisma.reassessmentCredit.create({
      data: {
        userId: fixture.id,
        testType: "EQ",
        status: "AVAILABLE",
        source: "QA_L19E_FIXTURE",
        purchasedAt: new Date(),
      },
    });
  }

  if (fixture.key === "QA-02") {
    await grantProductEntitlements({
      userId: fixture.id,
      productId: "product-medium",
      source: "QA_L19E_FIXTURE",
    });
    attemptIds.push(await completeAssessment(fixture.id, "riasec"));
  }

  if (fixture.key === "QA-03") {
    await grantProductEntitlements({
      userId: fixture.id,
      productId: "product-advance",
      source: "QA_L19E_FIXTURE",
    });
    for (const type of ["cognitive", "eq", "disc", "riasec"] as const) {
      attemptIds.push(await completeAssessment(fixture.id, type));
    }
  }

  return { ...fixture, password, attemptIds };
}

export async function provisionFixtures(options: { password?: string | null } = {}) {
  const sharedPassword = options.password ?? null;
  const results: Array<Awaited<ReturnType<typeof provisionFixture>>> = [];

  for (const fixture of QA_FIXTURES) {
    const password = sharedPassword ?? generatedPassword();
    results.push(await provisionFixture(fixture, password));
  }

  return {
    generatedAt: new Date().toISOString(),
    fixtures: results,
  };
}

export async function disconnectFixtures() {
  await prisma.$disconnect();
}


if (import.meta.url === `file://${process.argv[1]}`) {
  provisionFixtures({ password: process.env.L19E_QA_PASSWORD || undefined })
    .then((payload) => {
      console.log("=== READY SCORE V7 L19E QA FIXTURE PROVISIONING ===");
      console.log("DATABASE MIGRATION: NO");
      for (const fixture of payload.fixtures) {
        console.log(`${fixture.key} | ${fixture.email} | password generated for this test environment | attempts=${fixture.attemptIds.length}`);
      }
      console.log("Fixture identities are fixed; passwords are generated securely per run.");
      console.log("No production credentials are written by this script.");
      console.log(JSON.stringify({
        generatedAt: payload.generatedAt,
        fixtures: payload.fixtures.map(({ password, ...fixture }) => fixture),
      }, null, 2));
    })
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    })
    .finally(() => disconnectFixtures());
}
