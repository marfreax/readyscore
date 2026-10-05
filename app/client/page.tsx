import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentSession } from "../../lib/auth/session";
import { listClientOrganizations } from "../../lib/client-organization/service";
import ClientOrganizationOnboarding from "./ClientOrganizationOnboarding";

export default async function ClientPortalPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/login?next=%2Fclient");

  const organizations = await listClientOrganizations(session.user.id);
  if (organizations.length === 1) redirect(`/client/${encodeURIComponent(organizations[0].id)}`);

  return (
    <main className="rs-page min-h-screen px-4 py-8 text-slate-950 sm:px-6 sm:py-12">
      <div className="rs-container">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="rs-eyebrow">ReadyScore · Client Portal</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight">DISC untuk organisasi</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Ruang kerja khusus client untuk invitation assessment dan laporan peserta.
            </p>
          </div>
          <Link href="/logout" className="rs-button rs-button-secondary">Keluar</Link>
        </header>

        <section className="mt-8">
          <div className="mb-4">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Organisasi Anda</p>
            <h2 className="mt-1 text-xl font-black">
              {organizations.length} organisasi aktif
            </h2>
          </div>

          {organizations.length === 0 ? (
            <ClientOrganizationOnboarding />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {organizations.map((organization) => (
                <Link
                  key={organization.id}
                  href={`/client/${encodeURIComponent(organization.id)}`}
                  className="rs-card block p-6 transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md"
                >
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-indigo-600">{organization.code}</p>
                  <h3 className="mt-3 text-lg font-black">{organization.name}</h3>
                  <p className="mt-2 text-sm text-slate-600">Akses: {organization.membership.role === "ADMIN" ? "Administrator" : "Viewer"}</p>
                  <p className="mt-5 text-sm font-bold text-indigo-700">Buka ruang kerja →</p>
                </Link>
              ))}
            </div>
          )}
        </section>

        <p className="mt-8 text-xs leading-5 text-slate-500">Assessment provided by ReadyScore</p>
      </div>
    </main>
  );
}
