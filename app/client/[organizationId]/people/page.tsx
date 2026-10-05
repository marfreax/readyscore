import { redirect } from "next/navigation";
import { getCurrentSession } from "../../../../lib/auth/session";
import { getClientOrganizationWorkspace } from "../../../../lib/client-organization/service";
import ClientWorkspaceShell from "../ClientWorkspaceShell";
import ClientInvitations from "../ClientInvitations";

export default async function ClientPeoplePage({ params }: { params: Promise<{ organizationId: string }> }) {
  const session = await getCurrentSession();
  if (!session) redirect("/login?next=%2Fclient");
  const { organizationId } = await params;
  const workspace = await getClientOrganizationWorkspace(session.user.id, organizationId);
  if (!workspace) redirect("/client");
  return (
    <ClientWorkspaceShell organizationId={organizationId} organizationName={workspace.organization.name} websiteUrl={workspace.organization.websiteUrl} active="people" role={workspace.membership.role}>
      <div className="space-y-5">
        <header className="rs-card p-7 sm:p-9"><p className="rs-eyebrow">Direktori organisasi</p><h2 className="mt-2 text-3xl font-black tracking-tight">Karyawan, candidate & alumni</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Satu daftar orang dengan status kerja saat ini dan hasil DISC yang sudah selesai.</p></header>
        <ClientInvitations organizationId={organizationId} role={workspace.membership.role} view="people" />
      </div>
    </ClientWorkspaceShell>
  );
}
