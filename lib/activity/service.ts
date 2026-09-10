import { getUserHistory } from "../assessment/dashboard-repository";

export const ACTIVITY_CONTRACT_VERSION = "ACTIVITY_V1" as const;

export type ActivityItem = Awaited<ReturnType<typeof getUserHistory>>[number];

export type ActivitySummary = {
  contractVersion: typeof ACTIVITY_CONTRACT_VERSION;
  total: number;
  completed: number;
  inProgress: number;
  inactive: number;
  items: ActivityItem[];
};

export async function getUserActivity(userId: string): Promise<ActivitySummary> {
  const items = await getUserHistory(userId);
  return {
    contractVersion: ACTIVITY_CONTRACT_VERSION,
    total: items.length,
    completed: items.filter((item) => item.status === "COMPLETED").length,
    inProgress: items.filter((item) => item.status === "IN_PROGRESS").length,
    inactive: items.filter((item) => item.status === "ABANDONED" || item.status === "EXPIRED").length,
    items,
  };
}
