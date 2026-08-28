import Link from "next/link";
import { getCurrentSession } from "../../../lib/auth/session";
import { getInstitutionWorkspace } from "../../../lib/institution/service";

export default async function InstitutionDetailPage({
  params,
}: {
  params: Promise<{ institutionId: string }>;
}) {
  const session = await getCurrentSession();
  const { institutionId } = await params;
  if (!session) return <main className="p-10">Login diperlukan.</main>;

  const workspace = await getInstitutionWorkspace(session.user.id, institutionId);
  if (!workspace) {
    return (
      <main className="rs-page p-6 text-slate-950">
        <div className="rs-container rs-card max-w-2xl p-8">
          <h1 className="text-2xl font-black">Institution access denied</h1>
          <p className="mt-2 text-sm text-slate-600">Akun ini tidak memiliki active membership pada institution tersebut.</p>
          <Link href="/institution" className="mt-5 inline-block font-bold">Back →</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="rs-page p-6 text-slate-950">
      <div className="mx-auto max-w-5xl">
        <Link href="/institution" className="text-sm font-bold text-slate-600">← Institutions</Link>
        <section className="rs-card mt-5 p-7">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-indigo-600">{workspace.institution.code}</p>
          <h1 className="mt-2 text-3xl font-black">{workspace.institution.name}</h1>
          <p className="mt-2 text-sm text-slate-600">Membership role: <strong>{workspace.membership.role}</strong></p>
          <div className="mt-8">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Institution entitlements</p>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {workspace.entitlements.map((item) => (
                <div key={`${item.type}:${item.resourceType}:${item.resourceKey}`} className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-indigo-600">{item.type}</p>
                  <p className="mt-1 font-black">{item.resourceKey}</p>
                  <p className="mt-1 text-xs text-slate-500">{item.resourceType} · {item.status}</p>
                </div>
              ))}
            </div>
            {!workspace.entitlements.length && <p className="mt-3 text-sm text-slate-500">Belum ada institution entitlement aktif.</p>}
          </div>
        </section>
      </div>
    </main>
  );
}
