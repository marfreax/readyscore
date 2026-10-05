import { redirect } from "next/navigation";
import { getCurrentSession } from "../../../../lib/auth/session";
import { getClientOrganizationWorkspace } from "../../../../lib/client-organization/service";
import ClientWorkspaceShell from "../ClientWorkspaceShell";
import ClientInvitations from "../ClientInvitations";

export default async function ClientInvitationsPage({ params }: { params: Promise<{ organizationId: string }> }) {
  const session = await getCurrentSession();
  if (!session) redirect("/login?next=%2Fclient");
  const { organizationId } = await params;
  const workspace = await getClientOrganizationWorkspace(session.user.id, organizationId);
  if (!workspace) redirect("/client");
  return (
    <ClientWorkspaceShell organizationId={organizationId} organizationName={workspace.organization.name} websiteUrl={workspace.organization.websiteUrl} active="invitations" role={workspace.membership.role}>
      <div className="space-y-5">
        <header className="rs-card p-7 sm:p-9"><p className="rs-eyebrow">Assessment DISC</p><h2 className="mt-2 text-3xl font-black tracking-tight">Undangan dan aktivitas</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Kirim undangan kepada karyawan atau candidate, lalu pantau status test dan pengiriman hasil.</p></header>
        <ClientInvitations organizationId={organizationId} role={workspace.membership.role} view="invitations" />
      </div>
    </ClientWorkspaceShell>
  );
}
