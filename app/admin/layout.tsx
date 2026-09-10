import type { ReactNode } from "react";
import { requireAdmin } from "../../lib/auth/admin";
import { AdminShell } from "../../components/admin/AdminShell";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const admin = await requireAdmin();
  return <AdminShell adminName={admin.name}>{children}</AdminShell>;
}
