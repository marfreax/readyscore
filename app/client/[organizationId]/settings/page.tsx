import { redirect } from "next/navigation";
import { getCurrentSession } from "../../../../lib/auth/session";
import { getClientOrganizationWorkspace } from "../../../../lib/client-organization/service";
import ClientWorkspaceShell from "../ClientWorkspaceShell";
import ClientOrganizationSettingsForm from "./ClientOrganizationSettingsForm";

export default async function ClientOrganizationSettingsPage({ params }: { params: Promise<{ organizationId: string }> }) {
  const session = await getCurrentSession();
  if (!session) redirect("/login?next=%2Fclient");
  const { organizationId } = await params;
  const workspace = await getClientOrganizationWorkspace(session.user.id, organizationId);
  if (!workspace) redirect("/client");
  if (workspace.membership.role !== "ADMIN") redirect(`/client/${encodeURIComponent(organizationId)}`);

  return (
    <ClientWorkspaceShell organizationId={organizationId} organizationName={workspace.organization.name} websiteUrl={workspace.organization.websiteUrl} active="settings" role={workspace.membership.role}>
      <div className="space-y-5">
        <header className="rs-card p-7 sm:p-9">
          <p className="rs-eyebrow">Pengaturan organisasi</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight">Profil dan branding</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Nama dan logo ini digunakan untuk mengenali organisasi Anda di workspace serta pada undangan peserta.</p>
        </header>
        <ClientOrganizationSettingsForm organizationId={organizationId} initialName={workspace.organization.name} initialWebsiteUrl={workspace.organization.websiteUrl} initialLogoUrl={workspace.organization.logoUrl} />
      </div>
    </ClientWorkspaceShell>
  );
}
