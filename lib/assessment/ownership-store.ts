import fs from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";

export type AttemptHistoryRecord = {
  id: string;
  userId: string;
  assessmentType: "free" | "premium";
  status: "IN_PROGRESS" | "COMPLETED" | "ABANDONED";
  startedAt: string;
  completedAt?: string;
  resultAttemptId?: string;
  resultSummary?: {
    overallScore: number;
    band: string;
  };
};

type OwnershipState = {
  version: 1;
  attempts: AttemptHistoryRecord[];
};

const FILE = path.join(process.cwd(), "data", "assessment-ownership.json");

function load(): OwnershipState {
  try {
    if (!fs.existsSync(FILE)) return { version: 1, attempts: [] };
    return JSON.parse(fs.readFileSync(FILE, "utf8")) as OwnershipState;
  } catch {
    return { version: 1, attempts: [] };
  }
}

function save(state: OwnershipState) {
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(state, null, 2));
}

export function createOwnedAttempt(input: {
  userId: string;
  assessmentType: "free" | "premium";
  runtimeAttemptId?: string;
}) {
  const state = load();
  const now = new Date().toISOString();
  const record: AttemptHistoryRecord = {
    id: input.runtimeAttemptId ?? `att_${randomBytes(12).toString("hex")}`,
    userId: input.userId,
    assessmentType: input.assessmentType,
    status: "IN_PROGRESS",
    startedAt: now,
  };
  state.attempts.push(record);
  save(state);
  return record;
}

export function bindRuntimeAttempt(
  runtimeAttemptId: string,
  input: { userId: string; assessmentType: "free" | "premium"; startedAt?: string },
) {
  const state = load();
  const existing = state.attempts.find((item) => item.id === runtimeAttemptId);
  if (existing) {
    if (existing.userId !== input.userId) throw new Error("ATTEMPT_OWNERSHIP_CONFLICT");
    return existing;
  }
  const record: AttemptHistoryRecord = {
    id: runtimeAttemptId,
    userId: input.userId,
    assessmentType: input.assessmentType,
    status: "IN_PROGRESS",
    startedAt: input.startedAt ?? new Date().toISOString(),
  };
  state.attempts.push(record);
  save(state);
  return record;
}

export function getOwnedAttempt(userId: string, attemptId: string) {
  return load().attempts.find((item) => item.id === attemptId && item.userId === userId) ?? null;
}

export function listOwnedAttempts(userId: string) {
  return load().attempts
    .filter((item) => item.userId === userId)
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt));
}

export function markAttemptCompleted(
  userId: string,
  attemptId: string,
  result: { overallScore: number; band: string },
) {
  const state = load();
  const item = state.attempts.find((candidate) => candidate.id === attemptId && candidate.userId === userId);
  if (!item) throw new Error("ATTEMPT_NOT_FOUND");
  item.status = "COMPLETED";
  item.completedAt = new Date().toISOString();
  item.resultAttemptId = attemptId;
  item.resultSummary = result;
  save(state);
  return item;
}

export function markAttemptAbandoned(userId: string, attemptId: string) {
  const state = load();
  const item = state.attempts.find((candidate) => candidate.id === attemptId && candidate.userId === userId);
  if (!item) throw new Error("ATTEMPT_NOT_FOUND");
  item.status = "ABANDONED";
  save(state);
  return item;
}
