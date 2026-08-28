import { redirect } from "next/navigation";
import { getCurrentSession } from "./session";

export async function requireAdmin() {
  const session = await getCurrentSession();
  if (!session) redirect("/login?next=/admin/question-bank");
  if (session.user.role !== "ADMIN") redirect("/app");
  return session.user;
}

export async function requireAdminApi() {
  const session = await getCurrentSession();
  if (!session) throw new Error("UNAUTHENTICATED");
  if (session.user.role !== "ADMIN") throw new Error("FORBIDDEN");
  return session.user;
}
