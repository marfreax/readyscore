import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentSession } from "../../../lib/auth/session";
import { getClientOrganizationWorkspace } from "../../../lib/client-organization/service";
import ClientWorkspaceShell from "./ClientWorkspaceShell";
import ClientInvitations from "./ClientInvitations";

export default async function ClientOrganizationPage({
  params,
}: {
  params: Promise<{ organizationId: string }>;
}) {
  const session = await getCurrentSession();
  if (!session) redirect("/login?next=%2Fclient");
  const { organizationId } = await params;
  const workspace = await getClientOrganizationWorkspace(session.user.id, organizationId);

  if (!workspace) {
    return (
      <main className="rs-page min-h-screen px-4 py-10 text-slate-950 sm:px-6">
        <div className="rs-container">
          <section className="rs-card max-w-2xl p-7">
            <p className="rs-eyebrow">ReadyScore · Client Portal</p>
            <h1 className="mt-2 text-2xl font-black">Akses organisasi tidak tersedia</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">Akun ini tidak memiliki membership aktif untuk ruang kerja tersebut.</p>
            <Link href="/client" className="rs-button rs-button-primary mt-5">Kembali ke organisasi</Link>
          </section>
        </div>
      </main>
    );
  }

  return (
    <ClientWorkspaceShell organizationId={organizationId} organizationName={workspace.organization.name} websiteUrl={workspace.organization.websiteUrl} active="dashboard" role={workspace.membership.role}>
      <div className="space-y-5">
        <header className="rs-card p-7 sm:p-9">
          <p className="rs-eyebrow">ReadyScore · Client Portal</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight">Ringkasan DISC</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Pantau peserta, kelola undangan, dan tinjau hasil DISC organisasi Anda.</p>
          <p className="mt-2 text-sm text-slate-600">Peran Anda: {workspace.membership.role === "ADMIN" ? "Administrator" : "Viewer"}</p>
        </header>

        <ClientInvitations organizationId={workspace.organization.id} role={workspace.membership.role} view="overview" />
      </div>
    </ClientWorkspaceShell>
  );
}
