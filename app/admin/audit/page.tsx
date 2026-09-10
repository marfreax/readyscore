import { requireAdmin } from "../../../lib/auth/admin";
import { AdminAuditWorkspace } from "../../../components/admin/AdminAuditWorkspace";

export default async function AdminAuditPage() {
  await requireAdmin();
  return <AdminAuditWorkspace />;
}
