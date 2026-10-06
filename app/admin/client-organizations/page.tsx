import { requireAdmin } from "../../../lib/auth/admin";
import { prisma } from "../../../lib/db/prisma";
import ClientOrganizationOperations from "./ClientOrganizationOperations";

export default async function AdminClientOrganizationsPage() {
  await requireAdmin();
  const organizations = await prisma.clientOrganization.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, code: true, name: true, websiteUrl: true, logoUrl: true, status: true, memberships: { select: { role: true, status: true, user: { select: { name: true, email: true } } } } },
  });
  return <section className="rs-container py-8 sm:py-10">
    <div className="mb-8"><p className="rs-eyebrow">Corporate DISC</p><h1 className="rs-section-title mt-1 text-3xl">Organisasi Corporate</h1><p className="rs-subtitle mt-2 max-w-3xl">Buat ruang kerja Corporate dan berikan akses administrator pertama. Akun pengguna harus sudah terdaftar di ReadyScore.</p></div>
    <ClientOrganizationOperations initialOrganizations={organizations} />
  </section>;
}
